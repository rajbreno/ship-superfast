import { internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import * as Billing from "./lib/billing";

const optionalCustomerArgs = {
  customerEmail: v.optional(v.string()),
  dodoCustomerId: v.optional(v.string()),
};

// ── Helper: upsert customer if data present ───────────────────────────

async function maybeUpsertCustomer(
  ctx: MutationCtx,
  customerEmail?: string,
  dodoCustomerId?: string,
) {
  if (customerEmail && dodoCustomerId) {
    await Billing.upsertCustomer(ctx, customerEmail, dodoCustomerId);
  }
}

// ── Helper: resolve teamId — use provided value or fall back to customer email ──

async function resolveTeamId(
  ctx: MutationCtx,
  teamId?: Id<"teams">,
  customerEmail?: string,
): Promise<Id<"teams"> | undefined> {
  if (teamId) return teamId;
  if (customerEmail) {
    return await Billing.resolveTeamIdFromEmail(ctx, customerEmail);
  }
  return undefined;
}


// ── Combined: customer upsert + payment create/upsert ─────────────────

export const handlePaymentEvent = internalMutation({
  args: {
    ...optionalCustomerArgs,
    paymentId: v.string(),
    businessId: v.string(),
    productName: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    webhookPayload: v.string(),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await maybeUpsertCustomer(ctx, args.customerEmail, args.dodoCustomerId);

    const teamId = await resolveTeamId(ctx, args.teamId, args.customerEmail);

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", args.paymentId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        webhookPayload: args.webhookPayload,
        ...(teamId && !existing.teamId ? { teamId } : {}),
      });
    } else {
      await ctx.db.insert("payments", {
        paymentId: args.paymentId,
        businessId: args.businessId,
        customerEmail: args.customerEmail ?? "",
        productName: args.productName,
        amount: args.amount,
        currency: args.currency,
        status: args.status,
        webhookPayload: args.webhookPayload,
        createdAt: Date.now(),
        teamId,
      });
    }

    return null;
  },
});

// ── Combined: customer upsert + subscription upsert + plan change ─────

export const handleSubscriptionEvent = internalMutation({
  args: {
    ...optionalCustomerArgs,
    subscriptionId: v.string(),
    businessId: v.string(),
    planName: v.optional(v.string()),
    status: v.string(),
    webhookPayload: v.string(),
    plan: v.optional(
      v.union(v.literal("free"), v.literal("pro"), v.literal("max")),
    ),
    scheduledDowngradeAt: v.optional(v.number()),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await maybeUpsertCustomer(ctx, args.customerEmail, args.dodoCustomerId);

    const teamId = await resolveTeamId(ctx, args.teamId, args.customerEmail);

    // Upsert subscription
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriptionId", (q) =>
        q.eq("subscriptionId", args.subscriptionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        webhookPayload: args.webhookPayload,
        ...(args.planName ? { planName: args.planName } : {}),
        ...(teamId && !existing.teamId ? { teamId } : {}),
      });
    } else {
      // Supersede prior active subscriptions for same team
      if (teamId) {
        await Billing.supersedePriorSubscriptions(
          ctx,
          teamId,
          args.subscriptionId,
        );
      }
      await ctx.db.insert("subscriptions", {
        subscriptionId: args.subscriptionId,
        businessId: args.businessId,
        customerEmail: args.customerEmail ?? "",
        planName: args.planName,
        status: args.status,
        webhookPayload: args.webhookPayload,
        createdAt: Date.now(),
        teamId,
      });
    }

    // For downgrade events (expired/failed), only downgrade if this
    // subscription is the team's current one — a newer active sub takes priority.
    if (args.plan === "free" && teamId) {
      const activeSub = await Billing.getTeamSubscription(ctx, teamId);
      if (
        !activeSub ||
        activeSub.subscriptionId === args.subscriptionId ||
        !["active", "renewed"].includes(activeSub.status)
      ) {
        await Billing.updateTeamPlan(ctx, teamId, "free");
      }
      // else: a newer subscription is active — skip downgrade
    } else if (args.plan && teamId) {
      // Upgrade/renew — always apply
      await Billing.updateTeamPlan(ctx, teamId, args.plan);
    }

    // Schedule deferred downgrade (cancellation — user keeps access until period ends)
    if (args.scheduledDowngradeAt && teamId) {
      await ctx.scheduler.runAt(
        args.scheduledDowngradeAt,
        internal.webhooks.scheduledPlanDowngrade,
        { teamId },
      );
    }
    return null;
  },
});

// ── Scheduled: downgrade team plan after billing period ends ──────────

export const scheduledPlanDowngrade = internalMutation({
  args: { teamId: v.id("teams") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Only downgrade if no active subscription exists (user may have re-subscribed)
    const activeSub = await Billing.getTeamSubscription(ctx, args.teamId);
    if (activeSub && ["active", "renewed"].includes(activeSub.status)) {
      return null;
    }
    await Billing.updateTeamPlan(ctx, args.teamId, "free");
    return null;
  },
});

// ── Combined: customer upsert + payment status update + optional plan change ──

export const handlePaymentStatusEvent = internalMutation({
  args: {
    ...optionalCustomerArgs,
    paymentId: v.string(),
    status: v.string(),
    webhookPayload: v.string(),
    downgradePlan: v.optional(v.boolean()),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await maybeUpsertCustomer(ctx, args.customerEmail, args.dodoCustomerId);

    const teamId = await resolveTeamId(ctx, args.teamId, args.customerEmail);

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", args.paymentId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        webhookPayload: args.webhookPayload,
        ...(teamId && !existing.teamId ? { teamId } : {}),
      });
    } else {
      console.warn(
        `handlePaymentStatusEvent: no record for paymentId=${args.paymentId}`,
      );
    }

    // Downgrade team plan if requested — but only if no active subscription exists
    if (args.downgradePlan && teamId) {
      const activeSub = await Billing.getTeamSubscription(ctx, teamId);
      if (
        !activeSub ||
        !["active", "renewed"].includes(activeSub.status)
      ) {
        await Billing.updateTeamPlan(ctx, teamId, "free");
      }
    }
    return null;
  },
});
