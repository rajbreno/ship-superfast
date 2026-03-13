import { MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { components } from "../_generated/api";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { getAuthUserId } from "@convex-dev/auth/server";

const pushNotifications = new PushNotifications<string>(components.pushNotifications);

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Record a push token for a device
 */
export async function recordToken(
  ctx: MutationCtx,
  deviceId: string,
  token: string,
): Promise<boolean> {
  if (!token || token.trim() === "") return false;

  await pushNotifications.recordToken(ctx, {
    userId: deviceId,
    pushToken: token,
  });

  const existing = await ctx.db
    .query("registeredDevices")
    .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
    .unique();

  if (!existing) {
    await ctx.db.insert("registeredDevices", {
      deviceId,
      registeredAt: Date.now(),
    });
    return true;
  }
  return false;
}

/**
 * Link an authenticated user to their device (enables personal notifications)
 */
export async function linkDevice(
  ctx: MutationCtx,
  deviceId: string,
  token?: string,
): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;

  if (token && token.trim() !== "") {
    await pushNotifications.recordToken(ctx, {
      userId: deviceId,
      pushToken: token,
    });
  }

  const existing = await ctx.db
    .query("registeredDevices")
    .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
    .unique();

  if (existing) {
    if (existing.userId === userId) return false;
    await ctx.db.patch(existing._id, { userId });
    return true;
  }

  if (token && token.trim() !== "") {
    await ctx.db.insert("registeredDevices", {
      deviceId,
      userId,
      registeredAt: Date.now(),
    });
    return true;
  }
  return false;
}

/**
 * Unlink user from device (stops personal notifications)
 */
export async function unlinkDevice(ctx: MutationCtx, deviceId: string): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;

  const existing = await ctx.db
    .query("registeredDevices")
    .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
    .unique();

  if (existing && existing.userId === userId) {
    await ctx.db.patch(existing._id, { userId: undefined });
    return true;
  }
  return false;
}

/**
 * Send notification to a single device
 */
export async function sendToDevice(
  ctx: MutationCtx,
  deviceId: string,
  notification: NotificationPayload,
): Promise<boolean> {
  const status = await pushNotifications.getStatusForUser(ctx, { userId: deviceId });
  if (!status.hasToken || status.paused) return false;

  try {
    await pushNotifications.sendPushNotification(ctx, {
      userId: deviceId,
      notification: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: "default",
      },
    });
    return true;
  } catch (error) {
    console.error(`[Push] Failed to send to device ${deviceId}:`, error);
    return false;
  }
}

const MAX_BROADCAST_BATCH = 500;

/**
 * Broadcast notification to ALL registered devices (capped at MAX_BROADCAST_BATCH)
 */
export async function broadcastToAll(
  ctx: MutationCtx,
  notification: NotificationPayload,
): Promise<number> {
  const devices = await ctx.db.query("registeredDevices").take(MAX_BROADCAST_BATCH);
  let sentCount = 0;
  for (const device of devices) {
    const sent = await sendToDevice(ctx, device.deviceId, notification);
    if (sent) sentCount++;
  }
  return sentCount;
}

/**
 * Send notification to a specific user's devices
 */
export async function sendToUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  notification: NotificationPayload,
): Promise<number> {
  const devices = await ctx.db
    .query("registeredDevices")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  let sentCount = 0;
  for (const device of devices) {
    const sent = await sendToDevice(ctx, device.deviceId, notification);
    if (sent) sentCount++;
  }
  return sentCount;
}
