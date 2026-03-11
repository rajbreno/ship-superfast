import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerBackTitle: "",
        headerTitle: "",
        headerBackVisible: true,
        presentation: "card",
      }}
    />
  );
}
