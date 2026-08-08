/// <reference lib="deno.ns" />

// ============================================================================
// Feldrix — payfast-itn
// Receives and processes PayFast Instant Transaction Notifications (ITN)
//
// Sprint 40.2 - Phase 2
// Version 2
//
// Responsibilities:
// 1. Accept PayFast POST (application/x-www-form-urlencoded)
// 2. Verify signature against PayFast passphrase
// 3. Verify ITN with PayFast validation endpoint
// 4. Prevent duplicate processing (check transaction_id)
// 5. Locate subscription via custom_str1 (subscription ID)
// 6. Insert payment record into subscription_payments
// 7. Activate subscription (plan=Pro, status=Active)
// 8. Return HTTP 200 to acknowledge receipt
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { crypto as stdCrypto } from "jsr:@std/crypto@1";
import { encodeHex } from "jsr:@std/encoding@1/hex";

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response> | Response): void;
  env: { get(key: string): string | undefined };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Replicates PHP urlencode() for PayFast signature verification.
 */
function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

/**
 * Generates an MD5 hash using @std/crypto (supports MD5 on Deno Deploy).
 */
async function generateMd5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await stdCrypto.subtle.digest("MD5", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

/**
 * Verifies the PayFast signature on the incoming ITN data.
 * Follows the official PayFast ITN verification docs:
 * - Build param string from all fields EXCEPT "signature"
 * - Append passphrase if configured
 * - MD5 the result and compare
 */
async function verifySignature(
  data: Record<string, string>,
  passphrase: string | null
): Promise<boolean> {
  const receivedSignature = data.signature;

  if (!receivedSignature) {
    console.error("No signature field in ITN data");
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // FORENSIC LOGGING — SIGNATURE INVESTIGATION
  // ═══════════════════════════════════════════════════════════════

  console.log("══════ SIGNATURE FORENSICS ══════");
  console.log("Received signature:", receivedSignature);
  console.log("Passphrase present:", !!passphrase);
  console.log("Passphrase length:", passphrase ? passphrase.length : 0);
  console.log("Passphrase first 3 chars:", passphrase ? passphrase.substring(0, 3) + "..." : "NULL");
  console.log("");
  console.log("── ALL RECEIVED FIELDS ──");
  for (const [key, value] of Object.entries(data)) {
    console.log(`  ${key} = "${value}"`);
  }
  console.log("");

  // Build param string from all fields except signature, in received order
  // PayFast docs: "The parameter string is created by concatenating all
  // of the parameters sent by PayFast in the order received, URL-encoding
  // the values, joined with &"
  let paramString = "";
  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") continue;
    if (value !== undefined && value !== null && value !== "") {
      paramString += `${key}=${phpUrlencode(String(value).trim())}&`;
    }
  }

  // Append passphrase if provided
  if (passphrase && passphrase.trim() !== "") {
    paramString += `passphrase=${phpUrlencode(passphrase.trim())}&`;
  }

  // Remove trailing ampersand
  paramString = paramString.slice(0, -1);

  console.log("── CANONICAL STRING (for MD5) ──");
  console.log(paramString);
  console.log("");

  const expectedSignature = await generateMd5(paramString);

  console.log("── COMPARISON ──");
  console.log("Received :", receivedSignature.toLowerCase());
  console.log("Calculated:", expectedSignature);
  console.log("Match:", expectedSignature === receivedSignature.toLowerCase());
  console.log("══════════════════════════════════");

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL CHECK: Try WITHOUT URL-encoding (some PayFast
  // implementations use raw values without urlencode)
  // ═══════════════════════════════════════════════════════════════
  let rawParamString = "";
  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") continue;
    if (value !== undefined && value !== null && value !== "") {
      rawParamString += `${key}=${String(value).trim()}&`;
    }
  }
  if (passphrase && passphrase.trim() !== "") {
    rawParamString += `passphrase=${passphrase.trim()}&`;
  }
  rawParamString = rawParamString.slice(0, -1);

  const rawSignature = await generateMd5(rawParamString);
  console.log("── ALT CHECK (no urlencode) ──");
  console.log("Raw canonical:", rawParamString);
  console.log("Raw MD5:", rawSignature);
  console.log("Raw match:", rawSignature === receivedSignature.toLowerCase());
  console.log("══════════════════════════════════");

  // Return true if either method matches
  if (expectedSignature === receivedSignature.toLowerCase()) return true;
  if (rawSignature === receivedSignature.toLowerCase()) return true;

  return false;
}

/**
 * Validates the ITN by calling PayFast's validation endpoint.
 * Sends the ITN data back to PayFast to confirm it originated from them.
 */
async function verifyWithPayFast(
  data: Record<string, string>,
  sandbox: boolean
): Promise<boolean> {
  const validateUrl = sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  // Build form body
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  }

  try {
    const response = await fetch(validateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log("PayFast validation response:", responseText.trim());

    return responseText.trim() === "VALID";
  } catch (err) {
    console.error("PayFast validation request failed:", err);
    return false;
  }
}

/**
 * Generate an invoice number matching the project pattern.
 */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `FHP-${year}-${random}`;
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Only POST
    if (req.method !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    // -----------------------------------------------------------------------
    // Step 1: Parse ITN form data
    // -----------------------------------------------------------------------
    const formData = await req.formData();
    const payment: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      payment[key] = String(value);
    }

    console.log("====================================");
    console.log("PAYFAST ITN RECEIVED");
    console.log("Payment Status:", payment.payment_status);
    console.log("Payment ID:", payment.pf_payment_id);
    console.log("Merchant Payment ID:", payment.m_payment_id);
    console.log("Amount:", payment.amount_gross);
    console.log("Item:", payment.item_name);
    console.log("Customer:", payment.email_address);
    console.log("custom_str1 (subscription ID):", payment.custom_str1);
    console.log("====================================");

    // -----------------------------------------------------------------------
    // Step 2: Verify PayFast signature
    // -----------------------------------------------------------------------
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") ?? null;
    const sandbox = Deno.env.get("PAYFAST_SANDBOX") === "true";

    const signatureValid = await verifySignature(payment, passphrase);

    if (!signatureValid) {
      console.error("SIGNATURE VERIFICATION FAILED");
      return jsonResponse({
        success: false,
        error: "Signature verification failed",
      }, 200); // Return 200 so PayFast doesn't retry
    }

    console.log("Signature verification: PASSED");

    // -----------------------------------------------------------------------
    // Step 3: Verify with PayFast validation endpoint
    // In sandbox mode, log but don't block (sandbox shared merchant IDs
    // don't reliably validate). In production, this MUST block.
    // -----------------------------------------------------------------------
    const pfValid = await verifyWithPayFast(payment, sandbox);

    if (!pfValid && !sandbox) {
      console.error("PAYFAST SERVER VALIDATION FAILED");
      return jsonResponse({
        success: false,
        error: "PayFast server validation failed",
      }, 200);
    }

    if (!pfValid && sandbox) {
      console.warn("PayFast server validation failed (sandbox mode — continuing)");
    } else {
      console.log("PayFast server validation: PASSED");
    }

    // -----------------------------------------------------------------------
    // Step 4: Only process COMPLETE payments
    // -----------------------------------------------------------------------
    if (payment.payment_status !== "COMPLETE") {
      console.log(
        `Payment status is "${payment.payment_status}" — not COMPLETE. Acknowledging without processing.`
      );
      return jsonResponse({
        success: true,
        message: `ITN acknowledged. Status: ${payment.payment_status}`,
      });
    }

    // -----------------------------------------------------------------------
    // Step 5: Read custom_str1 as subscription ID
    // -----------------------------------------------------------------------
    const subscriptionId = payment.custom_str1;

    if (!subscriptionId) {
      console.error("No subscription ID in custom_str1 — cannot process");
      return jsonResponse({
        success: false,
        error: "Missing subscription reference (custom_str1)",
      }, 200);
    }

    // -----------------------------------------------------------------------
    // Step 6: Connect to Supabase
    // -----------------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Supabase URL present:", !!supabaseUrl);
    console.log("Service role key present:", !!supabaseServiceKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -----------------------------------------------------------------------
    // Step 7: Prevent duplicate processing
    // -----------------------------------------------------------------------
    const pfPaymentId = payment.pf_payment_id;

    const { data: existingPayment, error: dupCheckError } = await supabase
      .from("subscription_payments")
      .select("id")
      .eq("transaction_id", pfPaymentId)
      .maybeSingle();

    if (dupCheckError) {
      console.error("Duplicate check query failed:", dupCheckError.message);
    }

    if (existingPayment) {
      console.log(
        `DUPLICATE: Payment ${pfPaymentId} already processed. Skipping.`
      );
      return jsonResponse({
        success: true,
        message: "Payment already processed",
        transaction_id: pfPaymentId,
      });
    }

    // -----------------------------------------------------------------------
    // Step 8: Load subscription
    // -----------------------------------------------------------------------
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (subError || !subscription) {
      console.error(
        `Subscription not found for ID: ${subscriptionId}`,
        subError?.message
      );
      return jsonResponse({
        success: false,
        error: "Subscription not found",
      }, 200); // Return 200 — don't retry for missing subscription
    }

    console.log(
      `Subscription found: ${subscription.id} (user: ${subscription.user_id}, plan: ${subscription.plan})`
    );

    // -----------------------------------------------------------------------
    // Step 9: Insert payment record
    // -----------------------------------------------------------------------
    const now = new Date().toISOString();

    const paymentRecord = {
      user_id: subscription.user_id,
      provider: "PayFast",
      amount: parseFloat(payment.amount_gross) || 99,
      currency: "ZAR",
      status: "Completed",
      subscription_plan: "Pro",
      payment_reference: pfPaymentId,
      transaction_id: pfPaymentId,
      invoice_number: generateInvoiceNumber(),
      paid_at: now,
    };

    const { error: insertError } = await supabase
      .from("subscription_payments")
      .insert([paymentRecord]);

    if (insertError) {
      console.error("Failed to insert payment:", insertError.message);
      return jsonResponse({
        success: false,
        error: "Failed to record payment",
      }, 500);
    }

    console.log(`Payment record inserted: ${pfPaymentId}`);

    // -----------------------------------------------------------------------
    // Step 10: Activate subscription
    // -----------------------------------------------------------------------
    const nextRenewalDate = new Date();
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);

    const subscriptionUpdates = {
      plan: "Pro",
      status: "Active",
      billing_cycle: "Monthly",
      price: parseFloat(payment.amount_gross) || 99,
      payment_provider: "PayFast",
      payment_reference: pfPaymentId,
      renewal_date: nextRenewalDate.toISOString(),
      updated_at: now,
    };

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(subscriptionUpdates)
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("Failed to update subscription:", updateError.message);
      return jsonResponse({
        success: false,
        error: "Failed to activate subscription",
      }, 500);
    }

    console.log("====================================");
    console.log("SUBSCRIPTION ACTIVATED");
    console.log("Subscription ID:", subscriptionId);
    console.log("User ID:", subscription.user_id);
    console.log("Plan: Pro");
    console.log("Payment ID:", pfPaymentId);
    console.log("Amount:", payment.amount_gross);
    console.log("Renewal date:", nextRenewalDate.toISOString());
    console.log("====================================");

    return jsonResponse({
      success: true,
      message: "Payment processed and subscription activated",
      subscription_id: subscriptionId,
      transaction_id: pfPaymentId,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown server error";

    console.error("====================================");
    console.error("PAYFAST ITN ERROR");
    console.error(message);
    console.error("====================================");

    return jsonResponse({ success: false, error: message }, 500);
  }
});
