import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { useMutation } from "convex/react";
import { api } from "../../../../packages/convex/convex/_generated/api";

const DEVICE_ID_KEY = "push_device_id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Device.isDevice) return undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return undefined;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return undefined;

  try {
    const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return pushTokenString;
  } catch (error) {
    console.error("[Push] Error getting push token:", error);
    return undefined;
  }
}

/**
 * Hook to set up push notifications.
 *
 * 1. Gets/creates a unique deviceId
 * 2. Registers push token (no auth required — enables broadcasts)
 * 3. Links deviceId to userId when signed in (enables personal notifications)
 */
export function usePushNotifications(isSignedIn: boolean = false, enabled: boolean = true) {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const hasRegisteredToken = useRef(false);
  const hasLinkedUser = useRef(false);

  const recordDeviceToken = useMutation(api.pushNotifications.recordDeviceToken);
  const linkUserDevice = useMutation(api.pushNotifications.linkUserDevice);
  const unlinkUserDevice = useMutation(api.pushNotifications.unlinkUserDevice);

  useEffect(() => {
    if (!enabled) return;

    const isExpoGo = Constants.appOwnership === "expo";
    if (!Device.isDevice || isExpoGo) return;

    const init = async () => {
      const id = await getDeviceId();
      setDeviceId(id);

      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        try {
          await recordDeviceToken({ deviceId: id, token });
          hasRegisteredToken.current = true;
        } catch (error) {
          console.error("[Push] recordDeviceToken error:", error);
        }
      }
    };

    init();
  }, [enabled, recordDeviceToken]);

  useEffect(() => {
    if (!enabled) return;

    if (isSignedIn && deviceId && expoPushToken && !hasLinkedUser.current) {
      linkUserDevice({ deviceId, token: expoPushToken })
        .then(() => {
          hasLinkedUser.current = true;
        })
        .catch(console.error);
    }

    if (!isSignedIn && deviceId && hasLinkedUser.current) {
      unlinkUserDevice({ deviceId })
        .then(() => {
          hasLinkedUser.current = false;
        })
        .catch(console.error);
    }
  }, [enabled, isSignedIn, deviceId, expoPushToken, linkUserDevice, unlinkUserDevice]);

  return { expoPushToken, deviceId };
}
