/**
 * Feldrix — Subscription Pricing
 * Single source of truth for plan prices.
 */

export const PLANS = {
  starter: {
    name: "Starter",
    price: 0,
    currency: "ZAR",
    billing: "Free",
  },
  pro: {
    name: "Pro",
    price: 99,
    currency: "ZAR",
    billing: "Monthly",
  },
};

/**
 * Get the price for a plan upgrade (currently only Pro).
 */
export function getUpgradePrice() {
  return PLANS.pro.price;
}

/**
 * Format a price for display.
 */
export function formatPrice(amount) {
  return `R${Number(amount || 0).toFixed(2)}`;
}
