/**
 * ============================================
 * FarmHand PRO
 * PayFast Service
 * Sprint 40 - Phase 2.1
 * ============================================
 */

const MERCHANT_ID = import.meta.env.VITE_PAYFAST_MERCHANT_ID || "";
const MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "";
const PASSPHRASE = import.meta.env.VITE_PAYFAST_PASSPHRASE || "";

const SANDBOX =
  String(import.meta.env.VITE_PAYFAST_SANDBOX).toLowerCase() === "true";

const RETURN_URL =
  import.meta.env.VITE_PAYFAST_RETURN_URL ||
  `${window.location.origin}/account/payment-success`;

const CANCEL_URL =
  import.meta.env.VITE_PAYFAST_CANCEL_URL ||
  `${window.location.origin}/account/payment-cancelled`;

const NOTIFY_URL =
  import.meta.env.VITE_PAYFAST_NOTIFY_URL || "";

/**
 * --------------------------------------------
 * PayFast URL
 * --------------------------------------------
 */
export function getPayFastUrl() {
  return SANDBOX
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

/**
 * --------------------------------------------
 * Merchant Details
 * --------------------------------------------
 */
export function getMerchantDetails() {
  return {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    passphrase: PASSPHRASE,
  };
}

/**
 * --------------------------------------------
 * Sandbox Flag
 * --------------------------------------------
 */
export function isSandbox() {
  return SANDBOX;
}

/**
 * --------------------------------------------
 * Format Currency
 * --------------------------------------------
 */
export function formatAmount(amount) {
  const value = Number(amount || 0);

  if (Number.isNaN(value)) {
    return "0.00";
  }

  return value.toFixed(2);
}

/**
 * --------------------------------------------
 * Validate Configuration
 * --------------------------------------------
 */
export function validateConfiguration() {
  const errors = [];

  if (!MERCHANT_ID) {
    errors.push("Missing VITE_PAYFAST_MERCHANT_ID");
  }

  if (!MERCHANT_KEY) {
    errors.push("Missing VITE_PAYFAST_MERCHANT_KEY");
  }

  if (!RETURN_URL) {
    errors.push("Missing RETURN URL");
  }

  if (!CANCEL_URL) {
    errors.push("Missing CANCEL URL");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * --------------------------------------------
 * Create Payment Payload
 * --------------------------------------------
 */
export function createPaymentPayload({
  amount,
  itemName,
  itemDescription = "",
  customer = {},
  subscriptionId = "",
}) {
  const firstName = customer.firstName || "";
  const lastName = customer.lastName || "";
  const email = customer.email || "";

  return {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,

    return_url: RETURN_URL,
    cancel_url: CANCEL_URL,
    notify_url: NOTIFY_URL,

    amount: formatAmount(amount),

    item_name: itemName,
    item_description: itemDescription,

    name_first: firstName,
    name_last: lastName,
    email_address: email,

    custom_str1: subscriptionId,
  };
}

/**
 * --------------------------------------------
 * Build HTML Form Fields
 * (Used later when redirecting to PayFast)
 * --------------------------------------------
 */
export function buildFormFields(payload = {}) {
  return Object.entries(payload).reduce((fields, [key, value]) => {
    if (value !== undefined && value !== null) {
      fields[key] = String(value);
    }

    return fields;
  }, {});
}

/**
 * --------------------------------------------
 * Create Upgrade Payment
 * Convenience helper
 * --------------------------------------------
 */
export function createUpgradePayment({
  customer,
  subscriptionId,
}) {
  return createPaymentPayload({
    amount: 99, // Legacy fallback — actual amount comes from paymentService.js via edge function
    itemName: "FarmHand PRO Subscription",
    itemDescription: "FarmHand PRO Monthly Subscription",
    customer,
    subscriptionId,
  });
}

/**
 * --------------------------------------------
 * Environment Summary
 * Useful while developing
 * --------------------------------------------
 */
export function getEnvironment() {
  return {
    sandbox: SANDBOX,
    merchantId: MERCHANT_ID,
    returnUrl: RETURN_URL,
    cancelUrl: CANCEL_URL,
    notifyUrl: NOTIFY_URL,
  };
}

export default {
  getPayFastUrl,
  getMerchantDetails,
  isSandbox,
  formatAmount,
  validateConfiguration,
  createPaymentPayload,
  buildFormFields,
  createUpgradePayment,
  getEnvironment,
};
