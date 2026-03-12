import "../global.css";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HeroUINativeProvider } from "heroui-native";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SessionProvider, useSession } from "../providers/SessionProvider";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SplashScreenController } from "../components/SplashScreenController";
import { ForegroundRecoveryProvider } from "../providers/ForegroundRecoveryProvider";
import { useInAppUpdates } from "../hooks/useInAppUpdates";
import { ONBOARDING_KEY } from "./(onboarding)/index";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
      "Set it in apps/mobile/.env.local to your Convex deployment URL.",
  );
}

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export default function RootLayout() {
  useInAppUpdates();

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <HeroUINativeProvider>
          <ErrorBoundary>
            <ConvexProvider client={convex}>
              <ConvexAuthProvider client={convex} storage={secureStorage}>
                <ForegroundRecoveryProvider>
                  <SessionProvider>
                    <SplashScreenController />
                    <RootNavigator />
                  </SessionProvider>
                </ForegroundRecoveryProvider>
              </ConvexAuthProvider>
            </ConvexProvider>
          </ErrorBoundary>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const OnboardingContext = createContext<{ completeOnboarding: () => void }>({
  completeOnboarding: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

function RootNavigator() {
  const { isSignedIn } = useSession();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setHasSeenOnboarding(value === "true");
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setHasSeenOnboarding(true);
  }, []);

  // Wait until we know the onboarding state before rendering
  if (hasSeenOnboarding === null) return null;

  const showOnboarding = !hasSeenOnboarding && !isSignedIn;
  const showAuth = hasSeenOnboarding && !isSignedIn;

  return (
    <OnboardingContext.Provider value={{ completeOnboarding }}>
      <Stack
        screenOptions={{
          headerBackTitle: "",
          headerTitle: "",
          animation: "default",
          headerShadowVisible: false,
        }}
      >
        <Stack.Protected guard={showOnboarding}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={showAuth}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!showOnboarding && !showAuth}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </OnboardingContext.Provider>
  );
}
