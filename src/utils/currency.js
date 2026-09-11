/**
 * ============================================================
 * Feldrix — Currency, Locale & Date Formatting (USA-2)
 *
 * Farm-aware presentation. FARM OPERATING currency/locale come from the
 * farm context (getFarmContext → { currency, country, ... }). This is
 * SEPARATE from Feldrix's subscription billing currency (ZAR/PayFast in
 * pricing.js), which this file never touches.
 *
 * BACKWARD COMPATIBILITY: called with no context (the historical
 * signature `formatCurrency(amount)`), it defaults to ZAR / en-ZA — the
 * exact current South African behaviour — so existing call-sites are
 * unaffected until they opt in by passing a farm context.
 * ============================================================
 */

const DEFAULT_CURRENCY = "ZAR";
const DEFAULT_LOCALE = "en-ZA";

// Currency → default display locale. Extend for future countries.
const CURRENCY_LOCALE = {
  ZAR: "en-ZA",
  USD: "en-US",
};

/** Resolve { currency, locale } from a farm context, string, or nothing. */
export function resolveCurrencyLocale(ctxOrCurrency) {
  // No context → current SA behaviour (backward compatible).
  if (!ctxOrCurrency) {
    return { currency: DEFAULT_CURRENCY, locale: DEFAULT_LOCALE };
  }

  // A bare currency code string.
  if (typeof ctxOrCurrency === "string") {
    const currency = ctxOrCurrency.toUpperCase();
    return { currency, locale: CURRENCY_LOCALE[currency] || DEFAULT_LOCALE };
  }

  // A farm context object.
  const currency = (ctxOrCurrency.currency || DEFAULT_CURRENCY).toUpperCase();
  const explicitLocale = ctxOrCurrency.locale;
  const locale = explicitLocale || CURRENCY_LOCALE[currency] || DEFAULT_LOCALE;
  return { currency, locale };
}

/**
 * Format a monetary amount using the farm's operating currency/locale.
 * @param {number} amount
 * @param {object|string} [ctxOrCurrency] - farm context, currency code, or omit for ZAR.
 */
export function formatCurrency(amount, ctxOrCurrency) {
  const { currency, locale } = resolveCurrencyLocale(ctxOrCurrency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

/** The farm's display locale (for dates/numbers). Defaults to en-ZA. */
export function resolveLocale(ctxOrCurrency) {
  return resolveCurrencyLocale(ctxOrCurrency).locale;
}

/**
 * The farm's currency symbol only (e.g. "R" for ZAR, "$" for USD), for compact
 * UI labels like input adornments. Display-only; never affects stored values.
 * Falls back to "R" (SA baseline) if the symbol cannot be derived.
 */
export function currencySymbol(ctxOrCurrency) {
  const { currency, locale } = resolveCurrencyLocale(ctxOrCurrency);
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === "currency");
    return sym?.value || "R";
  } catch {
    return "R";
  }
}

/**
 * Format a date using the farm's locale (display only — never changes
 * stored date semantics or timezone). Defaults to en-ZA.
 */
export function formatDate(dateValue, ctxOrCurrency, options) {
  if (!dateValue) return "\u2014";
  const locale = resolveLocale(ctxOrCurrency);
  try {
    return new Date(dateValue).toLocaleDateString(
      locale,
      options || { day: "numeric", month: "short", year: "numeric" }
    );
  } catch {
    return "\u2014";
  }
}
