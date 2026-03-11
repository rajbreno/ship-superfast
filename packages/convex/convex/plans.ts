import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { PLANS } from "./lib/plans";

export const getPlans = query({
  args: {},
  returns: v.object({
    plans: v.array(
      v.object({
        tier: v.string(),
        productId: v.string(),
        name: v.string(),
        priceDisplay: v.string(),
        period: v.string(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return {
      plans: PLANS.map((p) => ({
        tier: p.tier,
        productId: p.productId,
        name: p.name,
        priceDisplay: p.priceDisplay,
        period: p.period,
      })),
    };
  },
});
