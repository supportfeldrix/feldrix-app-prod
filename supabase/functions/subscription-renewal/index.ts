/// <reference lib="deno.ns" />

// ═══════════════════════════════════════════════════════════════════════════════
// Feldrix Sprint 49 — Subscription Renewal Automation Engine
// Supabase Edge Function
//
// SCHEDULED: Daily at 07:05 SAST (05:05 UTC) via pg_cron
//
// Process:
//   1. Find subscriptions with status='Pending Cancellation' AND renewal_date <= today
//   2. For each:
//      a. Downgrade to Starter (plan=Starter, status=Cancelled, price=0, billing_cycle=None)
//      b. Send email notification
//      c. Create in-app notification
//      d. Write audit log entry
//   3. Report results
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
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data: pendingSubs, error: queryError } = await supabase
      .from("subscriptions")
      .select(`
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
      `)
      .eq("status", "Pending Cancellation")
      .lte("renewal_date", today);

    if (queryError) {
      return json({ success: false, error: `Query failed: ${queryError.message}` }, 500, cors);
    }

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

        simResults.push({
          userId: sub.user_id,
          email: profile?.email || "unknown",
          name: profile?.full_name || "Unknown",
          currentPlan: sub.plan,
          currentStatus: sub.status,
          renewalDate: sub.renewal_date,
          actions: [
            "Would downgrade: Pro → Starter",
            "Would set status: Pending Cancellation → Cancelled",
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
  notificationCreated: boolean;
  auditLogged: boolean;
  payfastResult: string;
  error?: string;
}

async function processSubscription(supabase: any, sub: any): Promise<ProcessResult> {
  const result: ProcessResult = {
    userId: sub.user_id,
    success: false,
    downgraded: false,
    emailSent: false,
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
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: "Starter",
        status: "Cancelled",
        price: 0,
        billing_cycle: "None",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)
      .eq("user_id", sub.user_id); // Safety: ensure correct user

    if (updateError) {
      result.error = `Downgrade failed: ${updateError.message}`;
      await logAudit(supabase, sub, result, "FAILED");
      return result;
    }
    result.downgraded = true;

    // ─── Step 3: Send Email ───────────────────────────────────────────────────
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", sub.user_id)
        .single();

      if (profile?.email) {
        const emailResult = await supabase.functions.invoke("email-send", {
          body: {
            to: profile.email,
            subject: "Your PRO subscription has ended",
            text: buildDowngradeEmail(profile.full_name || "Farmer"),
          },
        });
        result.emailSent = !emailResult.error;
      }
    } catch {
      // Email failure is non-blocking
      result.emailSent = false;
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
        notification_created: result.notificationCreated,
        reason: "Automatic Renewal Processing",
        outcome,
        error: result.error || null,
      },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[subscription-renewal] Audit log failed:", err);
  }
}
