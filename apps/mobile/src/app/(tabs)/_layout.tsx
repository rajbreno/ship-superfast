import React from "react";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
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
  const activeTeamValue = useActiveTeamValue();

  return (
    <ActiveTeamContext.Provider value={activeTeamValue}>
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        headerShown: true,
        headerShadowVisible: false,
        tabBarActiveTintColor: accentColor,
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
