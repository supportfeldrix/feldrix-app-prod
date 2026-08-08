/// <reference lib="deno.ns" />

// ============================================================================
// Feldrix — bright-service
// PayFast Payment Edge Function
// Generates server-side signatures using the official PayFast PHP SDK algorithm
// Reference: payfast-php-sdk-master/lib/Auth.php → generateSignature()
//
// Runtime: Deno (Supabase Edge Functions)
// ============================================================================

// @std/crypto extends crypto.subtle.digest to support MD5
// (native Web Crypto only supports SHA-1/256/384/512)
import { crypto as stdCrypto } from "jsr:@std/crypto@1";
import { encodeHex } from "jsr:@std/encoding@1/hex";

// Ambient declarations for editors without Deno types
declare const Deno: {
  serve(handler: (req: Request) => Promise<Response> | Response): void;
  env: { get(key: string): string | undefined };
};

interface PaymentRequest {
  amount: number;
  itemName: string;
  itemDescription?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    cellNumber?: string;
  };
  subscriptionId?: string;
  paymentMethod?: string;
}

// ---------------------------------------------------------------------------
// Official PayFast field order (from Auth.php lines 59-96)
// Only fields present in this list are included in the signature.
// The order here matches the SDK exactly.
// ---------------------------------------------------------------------------
const PAYFAST_SIGNATURE_FIELDS: string[] = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "notify_method",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "currency",
  "payment_method",
  "subscription_type",
  "passphrase",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
];

// ---------------------------------------------------------------------------
// phpUrlencode — replicates PHP's urlencode() behavior exactly
//
// PHP urlencode():
//   - Encodes spaces as '+'
//   - Encodes special chars: !, ', (, ), *, ~
//   - Uses uppercase hex: %2F not %2f
//
// JS encodeURIComponent():
//   - Encodes spaces as '%20'
//   - Does NOT encode: !, ', (, ), *, ~
//   - Uses uppercase hex
//
// Difference: we must convert %20 → + and encode !'()* and ~
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// generateSignature — exact port of Auth::generateSignature from PHP SDK
//
// Algorithm (from Auth.php):
// 1. array_filter($data, ..., ARRAY_FILTER_USE_KEY) — keep only keys in $fields
//    NOTE: array_filter preserves the original array order of $data.
//    Since we control payload construction (in FIELDS order), this is equivalent
//    to iterating the FIELDS list.
// 2. Append passphrase: $sortAttributes['passphrase'] = urlencode(trim($passPhrase))
// 3. Build param string: foreach $sortAttributes, if (!empty($value)):
//       $pfOutput .= $attribute . '=' . urlencode(trim($value)) . '&'
// 4. Remove trailing '&'
// 5. return md5($getString)
// ---------------------------------------------------------------------------
async function generateSignature(
  data: Record<string, string>,
  passPhrase: string | null
): Promise<string> {
  // Step 1: Filter and order attributes according to the SDK field list
  const sortedAttributes: Record<string, string> = {};

  for (const field of PAYFAST_SIGNATURE_FIELDS) {
    if (field in data) {
      sortedAttributes[field] = data[field];
    }
  }

  // Step 2: Append passphrase if provided and non-empty
  // PHP: $sortAttributes['passphrase'] = urlencode(trim($passPhrase))
  if (passPhrase !== null && passPhrase !== "") {
    sortedAttributes["passphrase"] = phpUrlencode(passPhrase.trim());
  }

  // Step 3+4: Build parameter string (skip empty values)
  // PHP: if (!empty($value)) { $pfOutput .= $attribute.'='.urlencode(trim($value)).'&'; }
  let pfOutput = "";
  for (const [attribute, value] of Object.entries(sortedAttributes)) {
    if (value !== undefined && value !== null && value !== "") {
      pfOutput += `${attribute}=${phpUrlencode(String(value).trim())}&`;
    }
  }

  // Remove trailing ampersand
  const getString = pfOutput.slice(0, -1);

  // Step 5: MD5 hash using @std/crypto (supports MD5 on Deno Deploy)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(getString);
  const hashBuffer = await stdCrypto.subtle.digest("MD5", dataBuffer);
  const md5Hash = encodeHex(new Uint8Array(hashBuffer));

  return md5Hash;
}

// ---------------------------------------------------------------------------
// Helper: create JSON response with CORS headers
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

// ---------------------------------------------------------------------------
// Edge Function Handler
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
    // Only accept POST
    if (req.method !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    // Parse request body
    const body: PaymentRequest = await req.json();

    // Validate required fields
    if (!body.amount || !body.itemName) {
      return jsonResponse(
        { success: false, error: "amount and itemName are required" },
        400
      );
    }

    // Load secrets from environment
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY");
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") ?? null;
    const returnUrl = Deno.env.get("PAYFAST_RETURN_URL") ?? "";
    const cancelUrl = Deno.env.get("PAYFAST_CANCEL_URL") ?? "";
    const notifyUrl = Deno.env.get("PAYFAST_NOTIFY_URL") ?? "";
    const sandbox = Deno.env.get("PAYFAST_SANDBOX") === "true";

    if (!merchantId || !merchantKey) {
      return jsonResponse(
        { success: false, error: "PayFast credentials are not configured." },
        500
      );
    }

    // Determine PayFast URL
    const payfastUrl = sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    // Diagnostic logging (production-safe — no secrets logged)
    console.log("========== PAYFAST CONFIG ==========");
    console.log("PAYFAST_SANDBOX:", Deno.env.get("PAYFAST_SANDBOX"));
    console.log("Sandbox Mode:", sandbox);
    console.log("PayFast URL:", payfastUrl);
    console.log("Merchant ID Present:", !!merchantId);
    console.log("Merchant Key Present:", !!merchantKey);
    console.log("Passphrase Present:", !!passphrase);
    console.log("Return URL:", returnUrl);
    console.log("Cancel URL:", cancelUrl);
    console.log("Notify URL:", notifyUrl);
    console.log("====================================");

    // Build payload in the official SDK field order
    // Matches CustomIntegration.php: ['merchant_id' => ..., 'merchant_key' => ...] + $data
    const payload: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: body.customer?.firstName ?? "",
      name_last: body.customer?.lastName ?? "",
      email_address: body.customer?.email ?? "",
      cell_number: body.customer?.cellNumber ?? "",
      m_payment_id: body.subscriptionId ?? crypto.randomUUID(),
      amount: Number(body.amount).toFixed(2),
      item_name: body.itemName,
      item_description: body.itemDescription ?? "",
      custom_str1: body.subscriptionId ?? "",
    };

    // Add optional payment_method if provided
    if (body.paymentMethod) {
      payload.payment_method = body.paymentMethod;
    }

    // Generate signature using the official PayFast algorithm
    const signature = await generateSignature(payload, passphrase);

    // Append signature to payload (matches SDK: $data['signature'] = $signature)
    payload.signature = signature;

    // =====================================================================
    // DIAGNOSTIC: Log the EXACT payload being returned to the frontend.
    // The frontend submits this as an HTML form POST to PayFast.
    // This proves what PayFast receives.
    // =====================================================================
    console.log("========== OUTGOING PAYFAST PAYLOAD ==========");
    console.log("merchant_id:", payload.merchant_id);
    console.log("return_url:", payload.return_url);
    console.log("cancel_url:", payload.cancel_url);
    console.log("notify_url:", payload.notify_url);
    console.log("notify_url length:", (payload.notify_url || "").length);
    console.log("notify_url is empty:", payload.notify_url === "");
    console.log("m_payment_id:", payload.m_payment_id);
    console.log("custom_str1:", payload.custom_str1);
    console.log("item_name:", payload.item_name);
    console.log("amount:", payload.amount);
    console.log("signature:", payload.signature);
    console.log("payfastUrl:", payfastUrl);
    console.log("Total payload keys:", Object.keys(payload).length);
    console.log("All payload keys:", Object.keys(payload).join(", "));
    console.log("================================================");

    // Return signed payload
    return jsonResponse({
      success: true,
      payfastUrl,
      payload,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown server error";
    console.error("bright-service error:", message);
    return jsonResponse({ success: false, error: message }, 500);
  }
});
