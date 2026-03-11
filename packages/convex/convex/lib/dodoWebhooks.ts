import { createDodoWebhookHandler } from "@dodopayments/convex";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { PRODUCT_PLAN_MAP, resolvePlanFromProductId } from "./billing";
import { DEFAULT_FROM_EMAIL } from "./constants";
import {
  paymentSuccessEmailTemplate,
  refundSuccessEmailTemplate,
} from "../email";

// ── Webhook payload helpers ───────────────────────────────────────────
// Dodo SDK payloads have complex union types (null vs undefined, different
// shapes for payment vs subscription vs dispute). Using `any` here is
// intentional — the SDK validates payloads before they reach these handlers.

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractCustomer(payload: any): {
  customerEmail?: string;
  dodoCustomerId?: string;
} {
  return {
    customerEmail: payload.data?.customer?.email?.toLowerCase().trim(),
    dodoCustomerId: payload.data?.customer?.customer_id,
  };
}

function extractTeamMeta(payload: any): {
  teamId?: Id<"teams">;
} {
  try {
    const metadata = payload.data?.metadata;
    if (metadata) {
      const teamId =
        typeof metadata.teamId === "string"
          ? (metadata.teamId as Id<"teams">)
          : undefined;
      return { teamId };
    }
  } catch {
    // Best-effort extraction
  }
  return {};
}

function extractProductName(payload: any): string | undefined {
  try {
    const items = payload.data?.product_cart ?? payload.data?.items;
    if (Array.isArray(items) && items.length > 0) {
      const name = items
        .map((item: any) => item.product?.name ?? item.name)
        .filter(Boolean)
        .join(", ");
      return name || undefined;
    }
  } catch {
    // Best-effort extraction
  }
  return undefined;
}

function resolveSubscriptionPlanName(payload: any): string | undefined {
  const productName = payload.data?.product_name;
  if (productName) return productName;
  const productId = payload.data?.product_id;
  if (productId && PRODUCT_PLAN_MAP[productId]) {
    const tier = PRODUCT_PLAN_MAP[productId];
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
  return undefined;
}

function resolvePlanFromPayload(payload: any): "pro" | "max" {
  const productId = payload.data?.product_id;
  if (productId && PRODUCT_PLAN_MAP[productId]) {
    return PRODUCT_PLAN_MAP[productId];
  }
  const items = payload.data?.product_cart ?? payload.data?.items;
  if (Array.isArray(items) && items.length > 0) {
    const firstProductId = items[0]?.product_id;
    return resolvePlanFromProductId(firstProductId);
  }
  return "pro";
}

// ── Shared arg builders ───────────────────────────────────────────────

function buildPaymentArgs(payload: any, teamId?: Id<"teams">) {
  const customer = extractCustomer(payload);
  return {
    ...customer,
    paymentId: payload.data.payment_id,
    businessId: payload.business_id,
    productName: extractProductName(payload),
    amount: payload.data.total_amount,
    currency: payload.data.currency,
    webhookPayload: JSON.stringify(payload),
    teamId,
  };
}

function buildSubscriptionArgs(payload: any, teamId?: Id<"teams">) {
  const customer = extractCustomer(payload);
  return {
    ...customer,
    subscriptionId: payload.data.subscription_id,
    businessId: payload.business_id,
    planName: resolveSubscriptionPlanName(payload),
    webhookPayload: JSON.stringify(payload),
    teamId,
  };
}

function handleDispute(status: string, downgradePlan?: boolean) {
  return async (ctx: any, payload: any) => {
    const customer = extractCustomer(payload);
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handlePaymentStatusEvent, {
      ...customer,
      paymentId: payload.data.payment_id,
      status,
      webhookPayload: JSON.stringify(payload),
      ...(downgradePlan ? { downgradePlan: true } : {}),
      teamId,
    });
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Dodo Payments webhook handler config ─────────────────────────────
// Each event calls a SINGLE internal mutation for atomicity.

export const dodoWebhookHandler = createDodoWebhookHandler({
  // ── Payment events ──────────────────────────────────────────────

  onPaymentSucceeded: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    const args = buildPaymentArgs(payload, teamId);
    await ctx.runMutation(internal.webhooks.handlePaymentEvent, {
      ...args,
      status: payload.data.status,
    });

    if (args.customerEmail) {
      try {
        await ctx.runMutation(internal.email.sendEmail, {
          from: DEFAULT_FROM_EMAIL,
          to: args.customerEmail,
          subject: "Payment confirmed",
          html: paymentSuccessEmailTemplate(
            extractProductName(payload) ?? "your purchase",
            payload.data.total_amount,
            payload.data.currency,
          ),
        });
      } catch (e) {
        console.warn("Payment confirmation email failed:", e);
      }
    }
  },

  onPaymentProcessing: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handlePaymentEvent, {
      ...buildPaymentArgs(payload, teamId),
      status: "processing",
    });
  },

  onPaymentFailed: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handlePaymentEvent, {
      ...buildPaymentArgs(payload, teamId),
      status: "failed",
    });
  },

  onPaymentCancelled: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handlePaymentEvent, {
      ...buildPaymentArgs(payload, teamId),
      status: "cancelled",
    });
  },

  // ── Refund events ───────────────────────────────────────────────

  onRefundSucceeded: async (ctx, payload) => {
    const customer = extractCustomer(payload);
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handlePaymentStatusEvent, {
      ...customer,
      paymentId: payload.data.payment_id,
      status: "refunded",
      webhookPayload: JSON.stringify(payload),
      downgradePlan: true,
      teamId,
    });

    if (customer.customerEmail) {
      try {
        await ctx.runMutation(internal.email.sendEmail, {
          from: DEFAULT_FROM_EMAIL,
          to: customer.customerEmail,
          subject: "Refund processed",
          html: refundSuccessEmailTemplate(
            payload.data.amount,
            payload.data.currency,
          ),
        });
      } catch (e) {
        console.warn("Refund confirmation email failed:", e);
      }
    }
  },

  onRefundFailed: async (_ctx, payload) => {
    console.warn("Refund failed for payment:", payload.data.payment_id);
  },

  // ── Subscription events ─────────────────────────────────────────

  onSubscriptionActive: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: payload.data.status,
      plan: resolvePlanFromPayload(payload),
    });
  },

  onSubscriptionRenewed: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: "renewed",
      plan: resolvePlanFromPayload(payload),
    });
  },

  onSubscriptionPlanChanged: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: payload.data.status,
      plan: resolvePlanFromPayload(payload),
    });
  },

  onSubscriptionCancelled: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    // User keeps access until the end of their paid billing period.
    // Schedule a deferred downgrade at next_billing_date instead of revoking immediately.
    const nextBillingDate = (payload.data as any).next_billing_date;
    let scheduledDowngradeAt: number | undefined;
    if (nextBillingDate) {
      const parsed = new Date(nextBillingDate).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) {
        scheduledDowngradeAt = parsed;
      }
    }
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: "cancelled",
      // If valid future date, schedule deferred downgrade; otherwise downgrade immediately
      ...(scheduledDowngradeAt
        ? { scheduledDowngradeAt }
        : { plan: "free" as const }),
    });
  },

  onSubscriptionExpired: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: "expired",
      plan: "free",
    });
  },

  onSubscriptionFailed: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: "failed",
      plan: "free",
    });
  },

  onSubscriptionOnHold: async (ctx, payload) => {
    const { teamId } = extractTeamMeta(payload);
    await ctx.runMutation(internal.webhooks.handleSubscriptionEvent, {
      ...buildSubscriptionArgs(payload, teamId),
      status: "on_hold",
      // No plan change — team keeps plan while on hold
    });
  },

  // ── Dispute events ──────────────────────────────────────────────

  onDisputeOpened: async (ctx, payload) => {
    console.warn("Dispute opened for payment:", payload.data.payment_id);
    await handleDispute("disputed")(ctx, payload);
  },

  onDisputeWon: handleDispute("dispute_won"),
  onDisputeLost: handleDispute("dispute_lost", true),
  onDisputeAccepted: handleDispute("dispute_accepted"),
  onDisputeCancelled: handleDispute("dispute_cancelled"),
  onDisputeChallenged: handleDispute("dispute_challenged"),
  onDisputeExpired: handleDispute("dispute_expired", true),

  // ── Catch-all for unknown / new event types ──────────────────────
  onPayload: async (_ctx, payload) => {
    console.log("Dodo webhook received:", (payload as any).type ?? "unknown");
  },
});
