import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import * as Users from "./lib/users";

const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
});

export const current = query({
  args: {},
  returns: v.union(userValidator, v.null()),
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    return await Users.getCurrentUser(ctx);
  },
});

export const currentInternal = internalQuery({
  args: {},
  returns: v.union(userValidator, v.null()),
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    return await Users.getCurrentUser(ctx);
  },
});

export const isAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    return await Users.isAdmin(ctx);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const updates: Partial<Doc<"users">> = {};
    if (args.name !== undefined) updates.name = args.name;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
    return null;
  },
});

export const getCurrentWithRole = query({
  args: {},
  returns: v.object({
    user: v.union(userValidator, v.null()),
    isAdmin: v.boolean(),
  }),
  handler: async (ctx): Promise<{ user: Doc<"users"> | null; isAdmin: boolean }> => {
    const user = await Users.getCurrentUser(ctx);
    if (!user) {
      return { user: null, isAdmin: false };
    }
    return { user, isAdmin: user.role === "admin" };
  },
});
