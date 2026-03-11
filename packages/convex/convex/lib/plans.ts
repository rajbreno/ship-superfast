// ── Centralized plan/product configuration ────────────────────────────
// Single source of truth for plan tiers and product IDs.
// Keep this in sync with your Dodo Payments dashboard.

import type { PlanTier, PaidPlanTier } from "@repo/shared";
export type { PlanTier, PaidPlanTier };

export type PlanDefinition = {
  tier: PlanTier;
  /** Product ID from Dodo dashboard (Pricing Type: Subscription) */
  productId: string;
  name: string;
  priceDisplay: string;
  period: string; // e.g., "/mo"
};

// Create your own products in the Dodo dashboard and replace the IDs below.
export const PLANS: PlanDefinition[] = [
  {
    tier: "pro",
    productId: "pdt_0Na80F8DAxolISwHgq98f",
    name: "Pro",
    priceDisplay: "$9.90",
    period: "/mo",
  },
  {
    tier: "max",
    productId: "pdt_0Na80GkE51ZnB71TzmzM3",
    name: "Max",
    priceDisplay: "$19.90",
    period: "/mo",
  },
];

// ── Derived maps ─────────────────────────────────────────────────────

export const PRODUCT_PLAN_MAP: Record<string, PaidPlanTier> =
  Object.fromEntries(
    PLANS.filter(
      (p): p is PlanDefinition & { tier: PaidPlanTier } => p.tier !== "free",
    ).map((p) => [p.productId, p.tier]),
  );

// Map of amount (in cents) → display name for resolving product names from payment amounts.
// Populate this if you need amount-based fallback resolution.
// Example: { 990: "Pro Plan", 1990: "Max Plan" }
export const KNOWN_PRODUCTS: Record<number, string> = {};
