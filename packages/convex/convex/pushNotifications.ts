import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import * as PushHelpers from "./lib/pushNotifications";

/**
 * Record a device's push notification token.
 * Called from the mobile app when notification permissions are granted.
 */
export const recordDeviceToken = mutation({
  args: {
    deviceId: v.string(),
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await PushHelpers.recordToken(ctx, args.deviceId, args.token);
    return null;
  },
});

/**
 * Link an authenticated user to their device.
 * Called when user signs in — enables personal notifications.
 */
export const linkUserDevice = mutation({
  args: {
    deviceId: v.string(),
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await PushHelpers.linkDevice(ctx, args.deviceId, args.token);
    return null;
  },
});

/**
 * Unlink user from device.
 * Called when user signs out — stops personal notifications.
 */
export const unlinkUserDevice = mutation({
  args: {
    deviceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await PushHelpers.unlinkDevice(ctx, args.deviceId);
    return null;
  },
});

/**
 * Broadcast a notification to all registered devices.
 */
export const broadcastNotification = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    // Arbitrary JSON payload forwarded to the push notification — shape varies per notification type
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await PushHelpers.broadcastToAll(ctx, {
      title: args.title,
      body: args.body,
      data: args.data,
    });
    return null;
  },
});

/**
 * Send a notification to a specific user's devices.
 */
export const sendNotificationToUser = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    // Arbitrary JSON payload forwarded to the push notification — shape varies per notification type
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await PushHelpers.sendToUser(ctx, args.userId, {
      title: args.title,
      body: args.body,
      data: args.data,
    });
    return null;
  },
});
