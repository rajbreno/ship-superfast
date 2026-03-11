import { useEffect } from "react";
import { Alert, Platform } from "react-native";

/**
 * Checks for native app updates on startup.
 *
 * - Android: Shows the native Play Store in-app update panel (flexible mode)
 * - iOS: Shows an alert, then opens App Store modal inside the app
 * - Skipped in dev mode, Expo Go, and on web
 *
 * Requires: expo-in-app-updates (install when building for production)
 */
export function useInAppUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS === "web") return;

    const checkForUpdates = async () => {
      try {
        const ExpoInAppUpdates = await import("expo-in-app-updates");

        if (Platform.OS === "android") {
          await ExpoInAppUpdates.checkAndStartUpdate(false);
        } else {
          const result = await ExpoInAppUpdates.checkForUpdate();

          if (!result.updateAvailable) return;

          Alert.alert(
            "Update Available",
            "A new version is available. Update now?",
            [
              {
                text: "Update",
                isPreferred: true,
                onPress: async () => {
                  try {
                    await ExpoInAppUpdates.startUpdate();
                  } catch (err) {
                    console.error("Failed to start update:", err);
                  }
                },
              },
              { text: "Later" },
            ],
          );
        }
      } catch (err) {
        console.warn(
          "In-app updates not available:",
          (err as Error).message,
        );
      }
    };

    checkForUpdates();
  }, []);
}
