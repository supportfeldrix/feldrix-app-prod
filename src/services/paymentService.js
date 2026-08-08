/**
 * ============================================
 * Feldrix
 * Payment Service
 * Server-side PayFast integration via Supabase Edge Function
 * ============================================
 *
 * Flow:
 * 1. Frontend calls startUpgradePayment() with customer + subscriptionId
 * 2. This service invokes the "bright-service" edge function
 * 3. Edge function builds the payload, signs it server-side using the
 *    official PayFast SDK algorithm, and returns { payfastUrl, payload }
 * 4. This service builds a hidden HTML form and submits it to PayFast
 *
 * No signatures are generated on the frontend.
 */

import { supabase } from "../supabaseClient";
import { getUpgradePrice } from "../constants/pricing";

/**
 * Creates and submits a PayFast payment via the server-side edge function.
 *
 * @param {object} options
 * @param {object} options.customer - { firstName, lastName, email, cellNumber }
 * @param {string} options.subscriptionId - Optional subscription reference
 * @returns {Promise<{ success: boolean }>}
 */
export async function startUpgradePayment({ customer, subscriptionId }) {
  // Call the Supabase edge function to get a signed payload
  const { data, error } = await supabase.functions.invoke("bright-service", {
    body: {
      amount: getUpgradePrice(),
      itemName: "Feldrix PRO Subscription",
      itemDescription: "Feldrix PRO Monthly Subscription",
      customer: {
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        email: customer?.email || "",
        cellNumber: customer?.cellNumber || "",
      },
      subscriptionId: subscriptionId || "",
    },
  });

  // Handle invocation error (network, auth, etc.)
  if (error) {
    throw new Error(
      `Payment service error: ${error.message || "Failed to invoke payment function"}`
    );
  }

  // Handle application-level error from the edge function
  if (!data || !data.success) {
    throw new Error(
      `Payment failed: ${data?.error || "Unknown error from payment service"}`
    );
  }

  const { payfastUrl, payload } = data;

  if (!payfastUrl || !payload) {
    throw new Error("Invalid response from payment service: missing URL or payload");
  }

  // DIAGNOSTIC: Log the exact payload being submitted to PayFast
  console.log("========== PAYFAST FORM SUBMISSION ==========");
  console.log("URL:", payfastUrl);
  console.log("notify_url:", payload.notify_url);
  console.log("notify_url empty:", !payload.notify_url);
  console.log("merchant_id:", payload.merchant_id);
  console.log("m_payment_id:", payload.m_payment_id);
  console.log("custom_str1:", payload.custom_str1);
  console.log("amount:", payload.amount);
  console.log("item_name:", payload.item_name);
  console.log("return_url:", payload.return_url);
  console.log("cancel_url:", payload.cancel_url);
  console.log("All keys:", Object.keys(payload).join(", "));
  console.log("=============================================");

  // Build and submit the HTML form to PayFast
  submitForm(payfastUrl, payload);

  return { success: true };
}

/**
 * Creates a hidden HTML form and submits it to PayFast.
 * This performs the browser redirect to PayFast's hosted payment page.
 *
 * @param {string} actionUrl - PayFast process URL (sandbox or production)
 * @param {object} fields - Signed payload fields including signature
 */
function submitForm(actionUrl, fields) {
  const form = document.createElement("form");

  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = key;
      input.value = String(value);

      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  form.submit();
}

/**
 * Placeholder for future payment verification (ITN callback validation).
 */
export async function verifyPayment() {
  return {
    success: true,
    message: "Verification will be implemented in Phase 2.2",
  };
}

/**
 * Placeholder for billing history.
 */
export async function getPaymentHistory() {
  return [];
}

/**
 * Placeholder for invoice generation.
 */
export async function generateInvoice() {
  return null;
}

export default {
  startUpgradePayment,
  verifyPayment,
  getPaymentHistory,
  generateInvoice,
};
