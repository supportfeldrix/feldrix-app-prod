/// <reference lib="deno.ns" />

// ═══════════════════════════════════════════════════════════════════════════════
// Feldrix Sprint 49 — Subscription Renewal Automation Engine
// Supabase Edge Function
//
// SCHEDULED: Daily at 07:05 SAST (05:05 UTC) via pg_cron
//
// Process (two categories, both handled by the same idempotent downgrade path):
//   1. SCHEDULED CANCELLATION
//      Subscriptions with status='Pending Cancellation' AND renewal_date <= today.
//      (User asked to cancel; ends at the current billing period boundary.)
//   2. NATURAL EXPIRY  ← Sprint 51 fix
//      PRO subscriptions with status='Active' AND renewal_date < today.
//      (Paid PRO whose period ended and was never renewed or cancelled.
//       Previously nothing transitioned these — they stayed PRO forever.)
//   For each match:
//      a. Downgrade to Starter (plan=Starter, status=Cancelled, price=0, billing_cycle=None)
//      b. Send email notification
//      c. Create in-app notification
//      d. Write audit log entry
//   3. Report results
//
// Date boundary semantics (renewal_date is a DATE column):
//   A subscription is valid THROUGH its renewal_date (inclusive of that day).
//   It becomes eligible for natural expiry only once renewal_date < today,
//   i.e. from the day AFTER renewal_date. This matches the requirement:
//   "valid through Sept 7 → Starter from Sept 8".
//
// Renewed-user protection:
//   renewal_date always reflects the latest paid period (payfast-itn and
//   renewSubscription move it forward). There is exactly one subscription row
//   per user (UNIQUE(user_id)). A renewed user therefore has a future
//   renewal_date and is naturally excluded from both queries.
//
// Idempotency:
//   The natural-expiry query filters plan IN ('Pro','pro') AND status='Active'.
//   Once a row is downgraded to plan='Starter'/status='Cancelled' it no longer
//   matches, so re-running the job makes no further changes.
//
// Request Types:
//   - "process"    (default) — Run full renewal processing
//   - "simulate"   — Dry run: shows what WOULD happen without making changes
//   - "retry"      — Process only previously failed renewals
//   - "health"     — Status check
//
// PayFast:
//   The current billing model uses one-time payments per cycle (NOT PayFast
//   recurring billing). Therefore there is nothing to cancel at PayFast's end.
//   If recurring billing is added in future, the cancel API call will be added here.
//
// Secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   EMAIL_USERNAME, EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_SECURE (via email-send)
//
// Safety:
//   - Farmer data (animals, crops, machinery, finance) is NEVER deleted
//   - Only subscription metadata is changed
//   - Simulation mode available for safe testing
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2";

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response> | Response): void;
  env: { get(key: string): string | undefined };
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ─── CORS ───────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://app.feldrix.com",
  "https://admin.feldrix.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
  };
}

function json(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    let mode = "process";
    try {
      const body = await req.json();
      if (body?.mode) mode = body.mode;
      if (body?.type) mode = body.type; // alias
    } catch { /* default to process */ }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ─── HEALTH CHECK ───────────────────────────────────────────
    if (mode === "health") {
      return json({
        success: true,
        status: "online",
        service: "subscription-renewal",
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      }, 200, cors);
    }

    // ─── Find subscriptions due for downgrade ───────────────────
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD (UTC calendar day)

    const SELECT_COLS = `
        id,
        user_id,
        plan,
        status,
        price,
        billing_cycle,
        renewal_date,
        payment_provider,
        payment_reference,
        updated_at
      `;

    // Category 1 — Scheduled cancellation.
    // User requested cancellation; the subscription ends when its paid period
    // ends. Business rule: PRO is valid THROUGH renewal_date, so a
    // Pending Cancellation row becomes eligible only once renewal_date < today
    // (i.e. from the day AFTER renewal_date). Using `lt` (not `lte`) so a user
    // whose renewal_date IS today is NOT expired a day early — this matches the
    // frontend getEffectivePlan() boundary and the natural-expiry query below.
    const { data: cancellationSubs, error: cancelQueryError } = await supabase
      .from("subscriptions")
      .select(SELECT_COLS)
      .eq("status", "Pending Cancellation")
      .not("renewal_date", "is", null)
      .lt("renewal_date", today);

    if (cancelQueryError) {
      return json({ success: false, error: `Query failed (cancellations): ${cancelQueryError.message}` }, 500, cors);
    }

    // Category 2 — Natural expiry (Sprint 51 fix).
    // PRO that is still marked Active but whose paid period ended (renewal_date < today).
    // These were never renewed and never cancelled, so nothing previously moved them.
    // Using `lt` (not `lte`) keeps the subscription valid THROUGH the renewal day.
    const { data: expiredProSubs, error: expiredQueryError } = await supabase
      .from("subscriptions")
      .select(SELECT_COLS)
      .eq("status", "Active")
      .in("plan", ["Pro", "pro", "PRO"])
      .not("renewal_date", "is", null)
      .lt("renewal_date", today);

    if (expiredQueryError) {
      return json({ success: false, error: `Query failed (expired PRO): ${expiredQueryError.message}` }, 500, cors);
    }

    // Merge both categories, de-duplicating by subscription id (defensive; the two
    // queries are mutually exclusive on status but we guard against overlap anyway).
    const byId = new Map<string, any>();
    for (const s of cancellationSubs || []) byId.set(s.id, s);
    for (const s of expiredProSubs || []) if (!byId.has(s.id)) byId.set(s.id, s);
    const pendingSubs = Array.from(byId.values());

    if (!pendingSubs || pendingSubs.length === 0) {
      return json({
        success: true,
        mode,
        message: "No subscriptions due for processing.",
        processed: 0,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      }, 200, cors);
    }

    // ─── SIMULATION MODE ────────────────────────────────────────
    if (mode === "simulate") {
      const simResults = [];
      for (const sub of pendingSubs) {
        // Get user email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", sub.user_id)
          .single();

        const reason = expiryReason(sub);

        simResults.push({
          userId: sub.user_id,
          email: profile?.email || "unknown",
          name: profile?.full_name || "Unknown",
          currentPlan: sub.plan,
          currentStatus: sub.status,
          renewalDate: sub.renewal_date,
          reason,
          actions: [
            `Reason: ${reason}`,
            "Would downgrade: Pro → Starter",
            `Would set status: ${sub.status} → Cancelled`,
            "Would set price: R0",
            "Would set billing_cycle: None",
            "Would send email: 'Your PRO subscription has ended'",
            "Would create in-app notification",
            "Would write audit log entry",
            sub.payment_provider === "PayFast" ? "PayFast: No recurring billing to cancel (one-time payment model)" : "No payment provider action needed",
          ],
        });
      }

      return json({
        success: true,
        mode: "simulate",
        message: `Simulation complete. ${simResults.length} subscription(s) would be processed.`,
        wouldProcess: simResults.length,
        results: simResults,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      }, 200, cors);
    }

    // ─── PROCESS / RETRY MODE ───────────────────────────────────
    const results: ProcessResult[] = [];

    for (const sub of pendingSubs) {
      const result = await processSubscription(supabase, sub);
      results.push(result);
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return json({
      success: true,
      mode,
      processed: results.length,
      succeeded,
      failed,
      results,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    }, 200, cors);

  } catch (err) {
    console.error("[subscription-renewal] Fatal error:", err);
    return json({ success: false, error: String(err), responseTime: Date.now() - startTime }, 500, cors);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS SINGLE SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════════

interface ProcessResult {
  userId: string;
  success: boolean;
  downgraded: boolean;
  emailSent: boolean;
  // Distinguishes a timeout from a normal success/failure without exposing
  // secrets: "not_attempted" | "skipped_no_email" | "sent" | "failed" | "timeout".
  emailStatus: string;
  notificationCreated: boolean;
  auditLogged: boolean;
  payfastResult: string;
  error?: string;
}

// Hard cap for the best-effort email side effect. A stalled SMTP connection
// inside email-send must never block the subscription reconciliation, the
// per-subscription loop, or the function's HTTP response.
const EMAIL_INVOKE_TIMEOUT_MS = 10_000;

/**
 * Invoke the email-send Edge Function with a bounded timeout.
 * Returns a discriminated result so the caller can record "sent" | "failed"
 * | "timeout" without ever throwing (no unhandled rejection) and without
 * blocking longer than EMAIL_INVOKE_TIMEOUT_MS. The underlying invoke promise
 * is allowed to settle on its own after a timeout; its rejection (if any) is
 * swallowed so it cannot surface as an unhandled rejection.
 */
async function sendDowngradeEmailWithTimeout(
  supabase: any,
  to: string,
  fullName: string,
): Promise<{ status: "sent" | "failed" | "timeout"; error?: string }> {
  let timer: number | undefined;

  const invokePromise = (async () => {
    const emailResult = await supabase.functions.invoke("email-send", {
      body: {
        to,
        subject: "Your PRO subscription has ended",
        text: buildDowngradeEmail(fullName),
      },
    });
    return emailResult;
  })();

  // Prevent an eventual rejection of the invoke promise (after we've already
  // timed out and moved on) from becoming an unhandled rejection.
  invokePromise.catch(() => { /* swallowed — handled via race/logging below */ });

  const timeoutPromise = new Promise<{ __timeout: true }>((resolve) => {
    timer = setTimeout(() => resolve({ __timeout: true }), EMAIL_INVOKE_TIMEOUT_MS) as unknown as number;
  });

  try {
    const raced = await Promise.race([invokePromise, timeoutPromise]);

    if (raced && (raced as any).__timeout === true) {
      console.warn(`[subscription-renewal] email-send timed out after ${EMAIL_INVOKE_TIMEOUT_MS}ms (best-effort, continuing).`);
      return { status: "timeout" };
    }

    const emailResult = raced as any;
    if (emailResult?.error) {
      console.warn("[subscription-renewal] email-send returned an error (best-effort, continuing).");
      return { status: "failed", error: String(emailResult.error?.message || emailResult.error) };
    }
    return { status: "sent" };
  } catch (err) {
    console.warn("[subscription-renewal] email-send threw (best-effort, continuing).");
    return { status: "failed", error: String(err) };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function processSubscription(supabase: any, sub: any): Promise<ProcessResult> {
  const result: ProcessResult = {
    userId: sub.user_id,
    success: false,
    downgraded: false,
    emailSent: false,
    emailStatus: "not_attempted",
    notificationCreated: false,
    auditLogged: false,
    payfastResult: "not_applicable",
  };

  try {
    // ─── Step 1: PayFast Protection ───────────────────────────────────────────
    // Current model: one-time payments. No recurring billing to cancel.
    // If PayFast recurring is ever enabled, the cancel API call would go here:
    //   PUT https://api.payfast.co.za/subscriptions/{token}/cancel
    // For now, we just confirm there's nothing to cancel.
    if (sub.payment_provider === "PayFast") {
      result.payfastResult = "one_time_payment_model_no_cancellation_needed";
    }

    // ─── Step 2: Downgrade Subscription ───────────────────────────────────────
    // Guarded, idempotent update. We re-assert the pre-downgrade state at write
    // time so that:
    //   • A renewal that landed between the SELECT and this UPDATE (moving
    //     renewal_date into the future) causes the guard to match 0 rows and
    //     we DO NOT downgrade a freshly-renewed user (renewed-user protection).
    //   • Re-running the job after a successful downgrade matches 0 rows
    //     (row is now plan=Starter/status=Cancelled) — idempotent, no churn.
    const today = new Date().toISOString().split("T")[0];

    let updateQuery = supabase
      .from("subscriptions")
      .update({
        plan: "Starter",
        status: "Cancelled",
        price: 0,
        billing_cycle: "None",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)
      .eq("user_id", sub.user_id) // Safety: ensure correct user (tenant isolation)
      .eq("status", sub.status);  // Guard: status unchanged since we read it

    if (sub.status === "Active") {
      // Natural expiry: only downgrade PRO whose renewal_date is still in the past.
      updateQuery = updateQuery
        .in("plan", ["Pro", "pro", "PRO"])
        .not("renewal_date", "is", null)
        .lt("renewal_date", today);
    } else {
      // Scheduled cancellation (Pending Cancellation): paid period ended.
      // `lt` (not `lte`) keeps the subscription valid THROUGH renewal_date,
      // matching the SELECT above and the frontend effective-plan boundary.
      updateQuery = updateQuery
        .not("renewal_date", "is", null)
        .lt("renewal_date", today);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select("id");

    if (updateError) {
      result.error = `Downgrade failed: ${updateError.message}`;
      await logAudit(supabase, sub, result, "FAILED");
      return result;
    }

    if (!updatedRows || updatedRows.length === 0) {
      // Guard matched nothing → the row was renewed/changed concurrently, or was
      // already downgraded. This is a safe no-op, NOT a failure. Skip side effects
      // (no email/notification/audit) so we never spam a still-valid PRO user.
      result.success = true;
      result.downgraded = false;
      result.payfastResult = "skipped_no_longer_eligible";
      return result;
    }
    result.downgraded = true;

    // ─── Step 3: Send Email (best-effort, hard-timeout bounded) ───────────────
    // The DB downgrade above has ALREADY committed. Email is best-effort only:
    // it is wrapped in a 10s hard timeout so a stalled SMTP connection inside
    // email-send can never hang this subscription, the sequential loop, or the
    // function's HTTP response. A timeout is recorded distinctly from a normal
    // failure. Never throws (no unhandled rejection); always continues.
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", sub.user_id)
        .single();

      if (profile?.email) {
        const emailOutcome = await sendDowngradeEmailWithTimeout(
          supabase,
          profile.email,
          profile.full_name || "Farmer",
        );
        result.emailStatus = emailOutcome.status;         // "sent" | "failed" | "timeout"
        result.emailSent = emailOutcome.status === "sent";
      } else {
        result.emailStatus = "skipped_no_email";
      }
    } catch {
      // Any failure looking up the profile is non-blocking.
      result.emailSent = false;
      result.emailStatus = "failed";
    }

    // ─── Step 4: In-App Notification ──────────────────────────────────────────
    try {
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        title: "Subscription Updated",
        message: "Your account has been moved to the Starter plan. You can upgrade again at any time.",
        type: "subscription",
        priority: "medium",
        read: false,
        created_at: new Date().toISOString(),
      });
      result.notificationCreated = true;
    } catch {
      // Notification failure is non-blocking (table may not exist)
      result.notificationCreated = false;
    }

    // ─── Step 5: Audit Log ────────────────────────────────────────────────────
    await logAudit(supabase, sub, result, "SUCCESS");
    result.auditLogged = true;

    result.success = true;
    return result;

  } catch (err) {
    result.error = String(err);
    try { await logAudit(supabase, sub, result, "ERROR"); } catch { /* non-blocking */ }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Human-readable reason for the downgrade, used in audit logs and simulation.
 * Distinguishes user-initiated cancellation from natural (unrenewed) expiry.
 */
function expiryReason(sub: any): string {
  if (sub.status === "Pending Cancellation") {
    return "Scheduled cancellation processed at billing period end";
  }
  if (sub.status === "Active") {
    return "PRO subscription expired (renewal_date passed, not renewed)";
  }
  return "Automatic Renewal Processing";
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

function buildDowngradeEmail(name: string): string {
  return `Hi ${name},

Your PRO subscription has reached the end of its billing period.

Your account has now been moved to the Starter plan.

What this means:
• Your farm data (animals, crops, machinery, finance) has NOT been deleted.
• You still have access to all basic features.
• Advanced features (AI Assistant, automation, advanced reports) are now paused.
• You can upgrade again at any time from Account → Subscription.

If you'd like to continue with PRO, simply upgrade again — your data is waiting for you.

Thank you for being a Feldrix farmer.

— The Feldrix Team
https://app.feldrix.com/account`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════

async function logAudit(supabase: any, sub: any, result: ProcessResult, outcome: string) {
  try {
    await supabase.from("admin_audit_log").insert({
      admin_id: null, // System-initiated (no human admin)
      action: "subscription_renewal_processing",
      target_type: "subscription",
      target_id: sub.id,
      details: {
        severity: outcome === "SUCCESS" ? "info" : "error",
        user_id: sub.user_id,
        old_plan: sub.plan,
        new_plan: "Starter",
        old_status: sub.status,
        new_status: "Cancelled",
        renewal_date: sub.renewal_date,
        downgrade_date: new Date().toISOString(),
        payfast_result: result.payfastResult,
        email_sent: result.emailSent,
        email_status: result.emailStatus,
        notification_created: result.notificationCreated,
        reason: expiryReason(sub),
        outcome,
        error: result.error || null,
      },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[subscription-renewal] Audit log failed:", err);
  }
}
