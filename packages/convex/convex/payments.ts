import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { checkout, customerPortal } from "./dodo";
import * as Users from "./lib/users";
import * as Teams from "./lib/teams";
import { resolveProductName, resolveSubscriptionPlanName, resolvePlanFromWebhookPayload } from "./lib/billing";

// --- Actions ---

export const createCheckout = action({
  args: {
    product_cart: v.array(
      v.object({
        product_id: v.string(),
        quantity: v.number(),
      }),
    ),
    returnUrl: v.optional(v.string()),
    teamId: v.id("teams"),
  },
  returns: v.object({ checkout_url: v.string() }),
  handler: async (ctx, args): Promise<{ checkout_url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify caller is owner/admin
    const membership = await ctx.runQuery(internal.teams.getMyTeamRole, {
      teamId: args.teamId,
    });
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Only team owners and admins can manage billing");
    }

    // Re-use existing Dodo customer so all team purchases appear in one portal
    const existing = await ctx.runQuery(
      internal.customers.identifyCustomer,
      {},
    );
    const customer = existing
      ? { customer_id: existing.dodoCustomerId }
      : identity.email
        ? { email: identity.email }
        : undefined;

    const session = await checkout(ctx, {
      payload: {
        product_cart: args.product_cart,
        return_url: args.returnUrl,
        billing_currency: "USD",
        customer,
        feature_flags: {
          allow_discount_code: true,
        },
        metadata: { teamId: args.teamId },
      },
    });

    if (!session?.checkout_url) {
      throw new Error("Checkout session did not return a checkout_url");
    }
    return { checkout_url: session.checkout_url };
  },
});

export const getCustomerPortal = action({
  args: {
    send_email: v.optional(v.boolean()),
    teamId: v.id("teams"),
  },
  returns: v.object({ portal_url: v.string() }),
  handler: async (ctx, args): Promise<{ portal_url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify caller is owner/admin
    const membership = await ctx.runQuery(internal.teams.getMyTeamRole, {
      teamId: args.teamId,
    });
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Only team owners and admins can access the billing portal");
    }

    const portal = await customerPortal(ctx, {
      send_email: args.send_email,
    });
    if (!portal?.portal_url) {
      throw new Error("Customer portal did not return a portal_url");
    }
    return { portal_url: portal.portal_url };
  },
});

// --- Validators ---

const subscriptionValidator = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
  subscriptionId: v.string(),
  businessId: v.string(),
  customerEmail: v.string(),
  planName: v.string(),
  status: v.string(),
  webhookPayload: v.string(),
  createdAt: v.number(),
  teamId: v.optional(v.id("teams")),
});

// Enriched payment with resolved display name
const enrichedPaymentValidator = v.object({
  _id: v.id("payments"),
  _creationTime: v.number(),
  paymentId: v.string(),
  businessId: v.string(),
  customerEmail: v.string(),
  productName: v.optional(v.string()),
  displayName: v.string(),
  plan: v.string(),
  amount: v.number(),
  currency: v.string(),
  status: v.string(),
  webhookPayload: v.string(),
  createdAt: v.number(),
  teamId: v.optional(v.id("teams")),
});

// --- Subscription Queries ---

export const getSubscriptionStatus = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.union(subscriptionValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await Users.getCurrentUser(ctx);
    if (!user?.email) return null;

    await Teams.requireTeamMembership(ctx, args.teamId, user._id);
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .collect();

    const active = subscriptions.find((s) =>
      ["active", "renewed", "on_hold"].includes(s.status),
    );
    const sub = active ?? subscriptions[0] ?? null;
    if (!sub) return null;
    return {
      ...sub,
      planName: sub.planName ?? resolveSubscriptionPlanName(sub.webhookPayload),
    };
  },
});

export const getAllSubscriptions = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(subscriptionValidator),
  handler: async (ctx, args) => {
    const user = await Users.getCurrentUser(ctx);
    if (!user?.email) return [];

    await Teams.requireTeamMembership(ctx, args.teamId, user._id);
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .collect();

    return subscriptions.map((sub) => ({
      ...sub,
      planName: sub.planName ?? resolveSubscriptionPlanName(sub.webhookPayload),
    }));
  },
});

// --- Payment Queries ---

export const getPaymentHistory = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(enrichedPaymentValidator),
  handler: async (ctx, args) => {
    const user = await Users.getCurrentUser(ctx);
    if (!user?.email) return [];

    await Teams.requireTeamMembership(ctx, args.teamId, user._id);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .collect();

    return payments.map((p) => ({
      ...p,
      displayName: resolveProductName(p.productName, p.amount, p.webhookPayload),
      plan: resolvePlanFromWebhookPayload(p.webhookPayload),
    }));
  },
});

// --- Customer check ---

export const isCustomer = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await Users.getCurrentUser(ctx);
    if (!user?.email) return false;

    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .first();
    return customer !== null;
  },
});

// --- Team billing summary ---

const planValidator = v.union(v.literal("free"), v.literal("pro"), v.literal("max"));

export const getTeamBillingSummary = query({
  args: { teamId: v.id("teams") },
  returns: v.object({
    plan: planValidator,
    totalMembers: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await Users.getCurrentUser(ctx);
    if (!user) return { plan: "free" as const, totalMembers: 0 };

    await Teams.requireTeamMembership(ctx, args.teamId, user._id);

    const team = await ctx.db.get(args.teamId);
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", args.teamId))
      .collect();

    return {
      plan: team?.plan ?? ("free" as const),
      totalMembers: teamMembers.length,
    };
  },
});
