import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { checkout, customerPortal } from "./dodo";
import * as Users from "./lib/users";
import * as Teams from "./lib/teams";
import { resolveProductName, resolveSubscriptionPlanName, resolvePlanFromWebhookPayload, PRODUCT_PLAN_MAP } from "./lib/billing";

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

    // Validate product IDs against known products
    for (const item of args.product_cart) {
      if (!PRODUCT_PLAN_MAP[item.product_id]) {
        throw new Error("Invalid product selected.");
      }
      if (item.quantity !== 1) {
        throw new Error("Invalid quantity.");
      }
    }

    // Validate returnUrl to prevent open redirect
    if (args.returnUrl) {
      const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
      if (!args.returnUrl.startsWith(siteUrl) && !args.returnUrl.startsWith("/")) {
        throw new Error("Invalid return URL.");
      }
    }

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
  planName: v.string(),
  status: v.string(),
  createdAt: v.number(),
  teamId: v.optional(v.id("teams")),
  creditsProvisioned: v.optional(v.boolean()),
});

// Enriched payment with resolved display name
const enrichedPaymentValidator = v.object({
  _id: v.id("payments"),
  _creationTime: v.number(),
  displayName: v.string(),
  plan: v.string(),
  amount: v.number(),
  currency: v.string(),
  status: v.string(),
  createdAt: v.number(),
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
    const { webhookPayload: _, businessId: _b, customerEmail: _c, ...safe } = sub;
    return {
      ...safe,
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

    return subscriptions.map((sub) => {
      const { webhookPayload: _, businessId: _b, customerEmail: _c, ...safe } = sub;
      return {
        ...safe,
        planName: sub.planName ?? resolveSubscriptionPlanName(sub.webhookPayload),
      };
    });
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
      _id: p._id,
      _creationTime: p._creationTime,
      displayName: resolveProductName(p.productName, p.amount, p.webhookPayload),
      plan: resolvePlanFromWebhookPayload(p.webhookPayload),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
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
