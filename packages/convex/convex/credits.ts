import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import * as Teams from "./lib/teams";

// ── Queries ──────────────────────────────────────────────────────────

export const getTeamCredits = query({
  args: { teamId: v.id("teams") },
  returns: v.object({
    balance: v.number(),
    totalPurchased: v.number(),
    totalUsed: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const membership = await Teams.getTeamMembership(ctx, args.teamId, userId);
    if (!membership) throw new Error("Not a member of this team");

    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (!credits) {
      return { balance: 0, totalPurchased: 0, totalUsed: 0 };
    }

    return {
      balance: credits.balance,
      totalPurchased: credits.totalPurchased,
      totalUsed: credits.totalUsed,
    };
  },
});

// ── Internal queries ─────────────────────────────────────────────────

export const getTeamCreditsInternal = internalQuery({
  args: { teamId: v.id("teams") },
  returns: v.object({
    balance: v.number(),
    totalPurchased: v.number(),
    totalUsed: v.number(),
  }),
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (!credits) {
      return { balance: 0, totalPurchased: 0, totalUsed: 0 };
    }

    return {
      balance: credits.balance,
      totalPurchased: credits.totalPurchased,
      totalUsed: credits.totalUsed,
    };
  },
});

// ── Internal mutations ───────────────────────────────────────────────

export const reserveCredit = internalMutation({
  args: { teamId: v.id("teams") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (!credits || credits.balance <= 0) {
      return false;
    }

    await ctx.db.patch(credits._id, {
      balance: credits.balance - 1,
      totalUsed: credits.totalUsed + 1,
    });
    return true;
  },
});

export const refundCredit = internalMutation({
  args: { teamId: v.id("teams") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (!credits) return null;

    await ctx.db.patch(credits._id, {
      balance: credits.balance + 1,
      totalUsed: Math.max(0, credits.totalUsed - 1),
    });
    return null;
  },
});

export const addCredits = internalMutation({
  args: {
    teamId: v.id("teams"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (credits) {
      await ctx.db.patch(credits._id, {
        balance: credits.balance + args.amount,
        totalPurchased: credits.totalPurchased + args.amount,
      });
    } else {
      await ctx.db.insert("teamCredits", {
        teamId: args.teamId,
        balance: args.amount,
        totalPurchased: args.amount,
        totalUsed: 0,
      });
    }
    return null;
  },
});

/** Atomically check provisioning flag + add credits in one mutation.
 *  Prevents the TOCTOU race where duplicate webhooks both pass the
 *  query-based idempotency check before either marks it as provisioned. */
export const provisionCreditsOnce = internalMutation({
  args: {
    teamId: v.id("teams"),
    amount: v.number(),
    subscriptionId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriptionId", (q) =>
        q.eq("subscriptionId", args.subscriptionId),
      )
      .first();

    if (sub && (sub as Record<string, unknown>).creditsProvisioned) {
      return false; // already provisioned
    }

    // Mark provisioned first (within same transaction)
    if (sub) {
      await ctx.db.patch(sub._id, { creditsProvisioned: true } as Record<string, unknown>);
    }

    // Add credits
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (credits) {
      await ctx.db.patch(credits._id, {
        balance: credits.balance + args.amount,
        totalPurchased: credits.totalPurchased + args.amount,
      });
    } else {
      await ctx.db.insert("teamCredits", {
        teamId: args.teamId,
        balance: args.amount,
        totalPurchased: args.amount,
        totalUsed: 0,
      });
    }

    return true;
  },
});

/** Reset credits to a plan's allocation. Idempotent — safe to call multiple
 *  times for the same billing event (e.g. subscription.active + subscription.renewed
 *  firing together). Only increments totalPurchased if the balance actually changes. */
export const resetCredits = internalMutation({
  args: {
    teamId: v.id("teams"),
    planCredits: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (credits) {
      const isAlreadyReset = credits.balance === args.planCredits;
      await ctx.db.patch(credits._id, {
        balance: args.planCredits,
        ...(isAlreadyReset ? {} : { totalPurchased: credits.totalPurchased + args.planCredits }),
      });
    } else {
      await ctx.db.insert("teamCredits", {
        teamId: args.teamId,
        balance: args.planCredits,
        totalPurchased: args.planCredits,
        totalUsed: 0,
      });
    }
    return null;
  },
});

/** Revoke all remaining credits (used on refund) */
export const revokeCredits = internalMutation({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (credits) {
      await ctx.db.patch(credits._id, {
        balance: 0,
      });
    }
    return null;
  },
});

export const initializeCredits = internalMutation({
  args: {
    teamId: v.id("teams"),
    initialBalance: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("teamCredits")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .unique();

    if (existing) return null;

    await ctx.db.insert("teamCredits", {
      teamId: args.teamId,
      balance: args.initialBalance,
      totalPurchased: args.initialBalance,
      totalUsed: 0,
    });
    return null;
  },
});

/** Monthly reset of free plan credits. Called by cron on the 1st of each month. */
export const resetFreePlanCredits = internalMutation({
  args: {},
  returns: v.object({
    teamsReset: v.number(),
  }),
  handler: async (ctx) => {
    const freeTeams = await ctx.db
      .query("teams")
      .withIndex("by_plan", (q) => q.eq("plan", "free"))
      .collect();
    const noPlanTeams = await ctx.db
      .query("teams")
      .withIndex("by_plan", (q) => q.eq("plan", undefined))
      .collect();
    const allFreeTeams = [...freeTeams, ...noPlanTeams];

    let teamsReset = 0;

    for (const team of allFreeTeams) {
      const credits = await ctx.db
        .query("teamCredits")
        .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
        .unique();

      if (credits) {
        await ctx.db.patch(credits._id, {
          balance: 10,
          totalPurchased: credits.totalPurchased + 10,
        });
      } else {
        await ctx.db.insert("teamCredits", {
          teamId: team._id,
          balance: 10,
          totalPurchased: 10,
          totalUsed: 0,
        });
      }
      teamsReset++;
    }

    if (teamsReset > 0) {
      console.log(`[Credits] Reset ${teamsReset} free plan teams to 10 credits`);
    }

    return { teamsReset };
  },
});
