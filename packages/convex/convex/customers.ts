import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const customerValidator = v.union(
  v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
    authId: v.optional(v.string()),
    dodoCustomerId: v.string(),
    email: v.string(),
  }),
  v.null(),
);

export const getByAuthId = internalQuery({
  args: { authId: v.string() },
  returns: customerValidator,
  handler: async (ctx, { authId }) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_authId", (q) => q.eq("authId", authId))
      .first();
  },
});

export const getByEmail = internalQuery({
  args: { email: v.string() },
  returns: customerValidator,
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

/** Check if the current caller has a customer record (by identity or user email). */
export const hasCustomerRecord = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    if (identity.email) {
      const byEmail = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (byEmail) return true;
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    if (user?.email && user.email !== identity.email) {
      const byUserEmail = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", user.email!))
        .first();
      if (byUserEmail) return true;
    }

    return false;
  },
});

/** Identify the current caller's payment provider customer ID.
 *  Tries: auth email → user email → customerEmail on their payment records. */
export const identifyCustomer = internalQuery({
  args: {},
  returns: v.union(v.object({ dodoCustomerId: v.string() }), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // 1. Try by auth identity email
    if (identity.email) {
      const byEmail = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (byEmail) return { dodoCustomerId: byEmail.dodoCustomerId };
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);

    // 2. Try by user record email (if different from identity)
    if (user?.email && user.email !== identity.email) {
      const byUserEmail = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", user.email!))
        .first();
      if (byUserEmail) return { dodoCustomerId: byUserEmail.dodoCustomerId };
    }

    // 3. Fallback: find customer via payment or subscription linked to this user's teams
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const membership of memberships) {
      // Check payments for this team
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_teamId", (q) => q.eq("teamId", membership.teamId))
        .first();
      if (payment?.customerEmail) {
        const byPaymentEmail = await ctx.db
          .query("customers")
          .withIndex("by_email", (q) => q.eq("email", payment.customerEmail))
          .first();
        if (byPaymentEmail) return { dodoCustomerId: byPaymentEmail.dodoCustomerId };
      }

      // Check subscriptions for this team
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_teamId", (q) => q.eq("teamId", membership.teamId))
        .first();
      if (subscription?.customerEmail) {
        const bySubEmail = await ctx.db
          .query("customers")
          .withIndex("by_email", (q) => q.eq("email", subscription.customerEmail))
          .first();
        if (bySubEmail) return { dodoCustomerId: bySubEmail.dodoCustomerId };
      }
    }

    return null;
  },
});

export const upsertByEmail = internalMutation({
  args: {
    email: v.string(),
    dodoCustomerId: v.string(),
    authId: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      const patch: Record<string, string> = {};
      if (existing.dodoCustomerId !== args.dodoCustomerId) {
        patch.dodoCustomerId = args.dodoCustomerId;
      }
      if (args.authId && existing.authId !== args.authId) {
        patch.authId = args.authId;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("customers", {
      email: args.email,
      dodoCustomerId: args.dodoCustomerId,
      ...(args.authId ? { authId: args.authId } : {}),
    });
  },
});
