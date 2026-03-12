import React from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useThemeColor } from "heroui-native";
import { useUniwind } from "uniwind";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Home01Icon,
  CreditCardIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import {
  ActiveTeamContext,
  useActiveTeamValue,
} from "../../hooks/useActiveTeam";

const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <HugeiconsIcon icon={Home01Icon} size={size} color={color} />
);

const TeamIcon = ({ color, size }: { color: string; size: number }) => (
  <HugeiconsIcon icon={UserGroupIcon} size={size} color={color} />
);

const BillingIcon = ({ color, size }: { color: string; size: number }) => (
  <HugeiconsIcon icon={CreditCardIcon} size={size} color={color} />
);

const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <HugeiconsIcon icon={UserIcon} size={size} color={color} />
);

export default function TabsLayout() {
  const accentColor = useThemeColor("accent");
  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");
  const { theme } = useUniwind();
  const insets = useSafeAreaInsets();
  const activeTeamValue = useActiveTeamValue();

  return (
    <ActiveTeamContext.Provider value={activeTeamValue}>
    <StatusBar style={theme === "dark" ? "light" : "dark"} />
    <Tabs
      safeAreaInsets={Platform.OS === "android" ? {
        bottom: insets.bottom + 16,
      } : undefined}
      screenOptions={{
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        headerShown: true,
        headerShadowVisible: false,
        tabBarActiveTintColor: accentColor,
        tabBarStyle: { backgroundColor, paddingTop: 8, ...(theme === "dark" && { borderTopColor: "#3f3f46" }) },
        tabBarInactiveTintColor: theme === "dark" ? "#a1a1aa" : "#71717a",
        headerStyle: { backgroundColor },
        headerTintColor: foregroundColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: HomeIcon,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          tabBarIcon: TeamIcon,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: BillingIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tabs>
    </ActiveTeamContext.Provider>
  );
}
