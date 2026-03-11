import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const SPLASH_HIDE_DELAY_MS = 700;

/**
 * Hides the splash screen once the layout is ready (safe area insets available).
 * Data loads progressively in the background with skeleton loaders.
 */
export function SplashScreenController() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (insets.top > 0) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, SPLASH_HIDE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [insets.top]);

  return null;
}
