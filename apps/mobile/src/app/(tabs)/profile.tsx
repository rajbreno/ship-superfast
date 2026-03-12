import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  Input,
  ListGroup,
  Separator,
  SkeletonGroup,
  Spinner,
  Switch,
  TextField,
  useThemeColor,
} from "heroui-native";
import { Uniwind, useUniwind } from "uniwind";
import { useMutation } from "convex/react";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import { useSession } from "../../providers/SessionProvider";
import { useRouter } from "expo-router";
import { getInitials } from "@repo/shared";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  UserIcon,
  Mail01Icon,
  Calendar03Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function ProfileScreen() {
  const { currentUser, isSignedIn, isLoading, signOut } = useSession();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);
  const mutedColor = useThemeColor("muted");
  const { theme } = useUniwind();

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() || undefined });
      setEditOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  }

  if (!isLoading && !isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="mb-2 text-xl font-semibold text-foreground">
          Not Signed In
        </Text>
        <Text className="mb-6 text-center text-muted">
          Sign in to access your profile.
        </Text>
        <Button onPress={() => router.push("/(auth)/sign-in")} size="lg">
          Sign In
        </Button>
      </View>
    );
  }

  const isDataLoading = isLoading || !currentUser;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-8"
      showsVerticalScrollIndicator={false}
    >
      {/* Skeleton loading */}
      <SkeletonGroup
        isLoading={isDataLoading}
        isSkeletonOnly
        className="gap-5 px-6 pt-6"
      >
        <Card>
          <Card.Body>
            <View className="items-center gap-3">
              <SkeletonGroup.Item className="h-12 w-12 rounded-full" />
              <SkeletonGroup.Item className="h-5 w-32 rounded-md" />
              <SkeletonGroup.Item className="h-3 w-40 rounded-md" />
            </View>
          </Card.Body>
        </Card>
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center gap-3 px-4">
            <SkeletonGroup.Item className="h-5 w-5 rounded-md" />
            <View className="flex-1 gap-1">
              <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
              <SkeletonGroup.Item className="h-4 w-36 rounded-md" />
            </View>
          </View>
        ))}
      </SkeletonGroup>

      {/* Profile */}
      {!isDataLoading && (
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        className="gap-5 px-6 pt-6"
      >
        <Card>
          <Card.Body>
            <View className="items-center gap-2">
              <Avatar size="lg" alt={currentUser?.name ?? "User avatar"}>
                {currentUser?.image ? (
                  <Avatar.Image source={{ uri: currentUser.image }} />
                ) : null}
                <Avatar.Fallback>
                  {getInitials(currentUser?.name ?? "?")}
                </Avatar.Fallback>
              </Avatar>
              <Text className="text-xl font-medium text-foreground">
                {currentUser?.name ?? "User"}
              </Text>
              <Text className="text-sm text-muted">
                {currentUser?.email}
              </Text>
            </View>
          </Card.Body>
        </Card>
        <ListGroup>
          <ListGroup.Item disabled>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                <Text className="text-lg font-medium text-foreground">
                  Profile Details
                </Text>
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
          </ListGroup.Item>

          <ListGroup.Item
            onPress={() => {
              setName(currentUser?.name ?? "");
              setEditOpen(true);
            }}
          >
            <ListGroup.ItemPrefix>
              <HugeiconsIcon icon={UserIcon} size={22} color={mutedColor} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemDescription>Name</ListGroup.ItemDescription>
              <Text className="text-base text-foreground">
                {currentUser?.name ?? "\u2014"}
              </Text>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator />

          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <HugeiconsIcon icon={Mail01Icon} size={22} color={mutedColor} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemDescription>Email</ListGroup.ItemDescription>
              <Text className="text-base text-foreground">
                {currentUser?.email ?? "\u2014"}
              </Text>
            </ListGroup.ItemContent>
          </ListGroup.Item>

          <Separator />

          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={22}
                color={mutedColor}
              />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemDescription>Member since</ListGroup.ItemDescription>
              <Text className="text-base text-foreground">
                {currentUser?._creationTime
                  ? new Date(
                      currentUser._creationTime,
                    ).toLocaleDateString()
                  : "\u2014"}
              </Text>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </ListGroup>

        <ListGroup>
          <ListGroup.Item disabled>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                <Text className="text-lg font-medium text-foreground">
                  Preferences
                </Text>
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
          </ListGroup.Item>

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <HugeiconsIcon icon={Moon02Icon} size={22} color={mutedColor} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Dark Mode</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={theme === "dark"}
                onSelectedChange={() =>
                  Uniwind.setTheme(theme === "light" ? "dark" : "light")
                }
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>

        {/* Sign out */}
        <Button onPress={signOut} variant="danger">
          Sign Out
        </Button>
      </Animated.View>
      )}

      {/* Edit profile bottom sheet */}
      <BottomSheet isOpen={editOpen} onOpenChange={setEditOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <BottomSheet.Title>Edit Profile</BottomSheet.Title>
            <BottomSheet.Description>
              Update your display name.
            </BottomSheet.Description>

            <View className="gap-4 pt-4">
              <TextField>
                <Text className="text-sm text-foreground">Name</Text>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                />
              </TextField>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="outline"
                    onPress={() => setEditOpen(false)}
                    isDisabled={saving}
                  >
                    Cancel
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    onPress={handleSave}
                    isDisabled={saving || !name.trim()}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </View>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </ScrollView>
  );
}
