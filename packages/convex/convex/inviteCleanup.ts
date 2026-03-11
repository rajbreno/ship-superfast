import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Removes stale team invites:
 * - Pending invites older than 7 days (expired)
 * - Accepted/declined invites older than 30 days (historical cleanup)
 */
export const cleanupExpiredInvites = internalMutation({
  args: {},
  returns: v.object({
    expiredDeleted: v.number(),
    resolvedDeleted: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const allInvites = await ctx.db.query("teamInvites").collect();

    let expiredDeleted = 0;
    let resolvedDeleted = 0;

    for (const invite of allInvites) {
      const age = now - invite.createdAt;

      if (invite.status === "pending" && age > SEVEN_DAYS_MS) {
        await ctx.db.delete(invite._id);
        expiredDeleted++;
      } else if (
        (invite.status === "accepted" || invite.status === "declined") &&
        age > THIRTY_DAYS_MS
      ) {
        await ctx.db.delete(invite._id);
        resolvedDeleted++;
      }
    }

    if (expiredDeleted > 0 || resolvedDeleted > 0) {
      console.log(
        `Invite cleanup: ${expiredDeleted} expired, ${resolvedDeleted} resolved`,
      );
    }

    return { expiredDeleted, resolvedDeleted };
  },
});
