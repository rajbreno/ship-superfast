import { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Separator,
  Spinner,
  useThemeColor,
} from "heroui-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import { useSession } from "../../providers/SessionProvider";
import { getInitials } from "@repo/shared";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  UserGroupIcon,
  FingerPrintIcon,
  Invoice02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function HomeScreen() {
  const { currentUser, isSignedIn, isLoading } = useSession();
  const accentColor = useThemeColor("accent");
  const mutedColor = useThemeColor("muted");

  // Auto-create team on first login (same as web dashboard layout)
  const ensureTeam = useMutation(api.teams.ensureTeam);
  useEffect(() => {
    if (isSignedIn) {
      ensureTeam().catch(() => {});
    }
  }, [isSignedIn, ensureTeam]);

  // Queries
  const myTeam = useQuery(api.teams.getMyTeam);
  const myInvites = useQuery(api.teams.getMyPendingInvites);
  const payments = useQuery(
    api.payments.getPaymentHistory,
    myTeam ? { teamId: myTeam._id } : "skip",
  );

  // Invite actions
  const acceptInvite = useMutation(api.teams.acceptInvite);
  const declineInvite = useMutation(api.teams.declineInvite);

  if (isLoading || !isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-8"
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome header */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        className="flex-row items-center gap-4 px-6 pt-6 pb-2"
      >
        <Avatar size="lg" alt={currentUser?.name ?? "User avatar"}>
          {currentUser?.image ? (
            <Avatar.Image source={{ uri: currentUser.image }} />
          ) : null}
          <Avatar.Fallback>
            {getInitials(currentUser?.name ?? "?")}
          </Avatar.Fallback>
        </Avatar>
        <View className="flex-1 gap-1">
          <Text className="text-xl font-semibold text-foreground">
            Welcome back, {currentUser?.name?.split(" ")[0] ?? "User"}
          </Text>
          <Text className="text-xs text-default-500">
            {myTeam ? `${myTeam.name} · ${myTeam.role}` : "No team"}
          </Text>
        </View>
      </Animated.View>

      {/* Pending invites */}
      {myInvites && myInvites.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          className="px-6 pt-4"
        >
          <Card>
            <Card.Body>
              <Card.Title>Pending Invitations</Card.Title>
              {myInvites.map((invite, i) => (
                <View key={invite._id}>
                  {i > 0 && <Separator />}
                  <View className="gap-2 py-2">
                    <View>
                      <Text className="text-sm text-foreground">
                        {invite.teamName}
                      </Text>
                      <Text className="text-xs text-default-500">
                        Invited by {invite.invitedByName ?? "a member"} as{" "}
                        {invite.role}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onPress={() => acceptInvite({ inviteId: invite._id })}
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={16}
                          color="#fff"
                        />
                        <Button.Label>Accept</Button.Label>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => declineInvite({ inviteId: invite._id })}
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={16}
                          color={mutedColor}
                        />
                        <Button.Label>Decline</Button.Label>
                      </Button>
                    </View>
                  </View>
                </View>
              ))}
            </Card.Body>
          </Card>
        </Animated.View>
      )}

      {/* Stat cards */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(300)}
        className="gap-3 px-6 pt-6"
      >
        {/* Team Plan */}
        <Card>
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="text-xs text-default-500">Team Plan</Text>
                <Text className="text-lg font-medium capitalize text-foreground">
                  {myTeam?.plan ?? "Free"}
                </Text>
              </View>
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={32}
                color={accentColor}
              />
            </View>
          </Card.Body>
        </Card>

        {/* Transactions */}
        <Card>
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="text-xs text-default-500">Transactions</Text>
                <Text className="text-lg font-medium text-foreground">
                  {payments?.length ?? 0}
                </Text>
              </View>
              <HugeiconsIcon
                icon={Invoice02Icon}
                size={32}
                color={accentColor}
              />
            </View>
          </Card.Body>
        </Card>

        {/* Auth status */}
        <Card>
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="text-xs text-default-500">Auth</Text>
                <Text className="text-lg font-medium text-foreground">
                  Connected
                </Text>
              </View>
              <HugeiconsIcon
                icon={FingerPrintIcon}
                size={32}
                color={accentColor}
              />
            </View>
          </Card.Body>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}
