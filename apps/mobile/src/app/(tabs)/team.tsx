import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  Chip,
  Dialog,
  Input,
  ListGroup,
  Menu,
  Separator,
  Spinner,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../../packages/convex/convex/_generated/dataModel";
import { useSession } from "../../providers/SessionProvider";
import { useActiveTeam } from "../../hooks/useActiveTeam";
import { getInitials } from "@repo/shared";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Edit03Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  PlusSignIcon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default function TeamScreen() {
  const { currentUser, isSignedIn, isLoading } = useSession();
  const { activeTeam, allTeams, switchTeam } = useActiveTeam();
  const myInvites = useQuery(api.teams.getMyPendingInvites);
  const acceptInvite = useMutation(api.teams.acceptInvite);
  const declineInvite = useMutation(api.teams.declineInvite);
  const mutedColor = useThemeColor("muted");
  const accentForegroundColor = useThemeColor("accent-foreground");

  if (isLoading || !isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!activeTeam) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="mb-2 text-xl font-semibold text-foreground">
          No Team
        </Text>
        <Text className="text-center text-sm text-muted">
          You don't belong to any team yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-8"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        className="gap-5 px-6 pt-6"
      >
        {/* Incoming invites for current user */}
        {myInvites && myInvites.length > 0 && (
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
                      <Text className="text-xs text-muted">
                        Invited by {invite.invitedByName ?? "a member"} as{" "}
                        {invite.role}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onPress={() =>
                          acceptInvite({ inviteId: invite._id })
                        }
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={16}
                          color={accentForegroundColor}
                        />
                        <Button.Label>Accept</Button.Label>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() =>
                          declineInvite({ inviteId: invite._id })
                        }
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
        )}

        <TeamHeader
          team={activeTeam}
          teams={allTeams}
          onSwitchTeam={switchTeam}
        />

        <MembersList
          teamId={activeTeam._id}
          currentUserId={currentUser?._id}
          currentRole={activeTeam.role}
        />

        {["owner", "admin"].includes(activeTeam.role) && (
          <PendingInvites teamId={activeTeam._id} />
        )}

        {activeTeam.role !== "owner" && currentUser && (
          <LeaveTeam teamId={activeTeam._id} currentUserId={currentUser._id} />
        )}
      </Animated.View>
    </ScrollView>
  );
}

// ── Team Header ───────────────────────────────────────────────────────

type TeamInfo = {
  _id: Id<"teams">;
  name: string;
  role: string;
  plan: string;
};

function TeamHeader({
  team,
  teams,
  onSwitchTeam,
}: {
  team: { _id: Id<"teams">; name: string; role: string };
  teams: TeamInfo[];
  onSwitchTeam: (teamId: Id<"teams">) => void;
}) {
  const updateName = useMutation(api.teams.updateTeamName);
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const [editOpen, setEditOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = ["owner", "admin"].includes(team.role);
  const hasMultipleTeams = teams.length > 1;

  async function handleSave() {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await updateName({ teamId: team._id, name: nameValue.trim() });
      setEditOpen(false);
    } catch {
      Alert.alert("Error", "Failed to update team name");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <View className="gap-5">
        {hasMultipleTeams && (
          <Button
            variant="outline"
            size="sm"
            onPress={() => setSwitchOpen(true)}
          >
            <Button.Label>Switch Team</Button.Label>
          </Button>
        )}
        <Card>
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="text-xs text-muted">Team</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-medium text-foreground">
                    {team.name}
                  </Text>
                  {canManage && (
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        setNameValue(team.name);
                        setEditOpen(true);
                      }}
                    >
                      <HugeiconsIcon icon={Edit03Icon} size={16} color={foregroundColor} />
                    </Button>
                  )}
                </View>
              </View>
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={32}
                color={accentColor}
              />
            </View>
            <View className="pt-2">
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label>{ROLE_LABELS[team.role] ?? team.role}</Chip.Label>
              </Chip>
            </View>
          </Card.Body>
        </Card>
      </View>

      {/* Rename team */}
      <BottomSheet isOpen={editOpen} onOpenChange={setEditOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <BottomSheet.Title>Rename Team</BottomSheet.Title>
            <BottomSheet.Description>
              Enter a new name for your team.
            </BottomSheet.Description>
            <View className="gap-4 pt-4">
              <TextField>
                <Text className="text-sm text-foreground">Name</Text>
                <Input
                  placeholder="Team name"
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoFocus
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
                    isDisabled={saving || !nameValue.trim()}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </View>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Switch team */}
      {hasMultipleTeams && (
        <BottomSheet isOpen={switchOpen} onOpenChange={setSwitchOpen}>
          <BottomSheet.Portal>
            <BottomSheet.Overlay />
            <BottomSheet.Content>
              <BottomSheet.Title>Switch Team</BottomSheet.Title>
              <BottomSheet.Description>
                Select a team to view.
              </BottomSheet.Description>
              <View className="pt-4">
                <ListGroup>
                  {teams.map((t) => (
                    <ListGroup.Item
                      key={t._id}
                      onPress={() => {
                        onSwitchTeam(t._id);
                        setSwitchOpen(false);
                      }}
                    >
                      <ListGroup.ItemContent>
                        <ListGroup.ItemTitle>{t.name}</ListGroup.ItemTitle>
                        <ListGroup.ItemDescription>
                          {ROLE_LABELS[t.role] ?? t.role}
                          {t.plan !== "free"
                            ? ` · ${t.plan.charAt(0).toUpperCase() + t.plan.slice(1)}`
                            : ""}
                        </ListGroup.ItemDescription>
                      </ListGroup.ItemContent>
                      {t._id === team._id && (
                        <ListGroup.ItemSuffix>
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={20}
                            color={accentColor}
                          />
                        </ListGroup.ItemSuffix>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </View>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet>
      )}
    </View>
  );
}

// ── Members List ──────────────────────────────────────────────────────

function MembersList({
  teamId,
  currentUserId,
  currentRole,
}: {
  teamId: Id<"teams">;
  currentUserId?: Id<"users">;
  currentRole: string;
}) {
  const members = useQuery(api.teams.getTeamMembers, { teamId });
  const removeMember = useMutation(api.teams.removeMember);
  const changeRole = useMutation(api.teams.changeMemberRole);
  const foregroundColor = useThemeColor("foreground");

  const isOwner = currentRole === "owner";
  const canManage = ["owner", "admin"].includes(currentRole);

  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <View>
      <ListGroup>
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Members</ListGroup.ItemTitle>
            <ListGroup.ItemDescription>
              {members
                ? `${members.length} member${members.length !== 1 ? "s" : ""}`
                : "Loading..."}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          {canManage && (
            <ListGroup.ItemSuffix>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setInviteOpen(true)}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={18} color={foregroundColor} />
              </Button>
            </ListGroup.ItemSuffix>
          )}
        </ListGroup.Item>

        {members?.map((member, i) => {
          const isSelf = member.userId === currentUserId;
          const canManageMember =
            !isSelf &&
            canManage &&
            member.role !== "owner" &&
            !(currentRole === "admin" && member.role === "admin");

          return (
            <View key={member.membershipId}>
              <Separator />
              <MemberItem
                member={member}
                isSelf={isSelf}
                canManage={canManageMember}
                isOwner={isOwner}
                teamId={teamId}
                onChangeRole={(role) =>
                  changeRole({ teamId, userId: member.userId, role }).catch(
                    () => Alert.alert("Error", "Failed to change role"),
                  )
                }
                onRemove={() =>
                  removeMember({ teamId, userId: member.userId }).catch(() =>
                    Alert.alert("Error", "Failed to remove member"),
                  )
                }
              />
            </View>
          );
        })}
      </ListGroup>

      <InviteSheet
        teamId={teamId}
        isOpen={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </View>
  );
}

// ── Member Item ───────────────────────────────────────────────────────

function MemberItem({
  member,
  isSelf,
  canManage,
  isOwner,
  teamId,
  onChangeRole,
  onRemove,
}: {
  member: {
    userId: Id<"users">;
    name?: string;
    email?: string;
    image?: string;
    role: string;
    joinedAt: number;
  };
  isSelf: boolean;
  canManage: boolean;
  isOwner: boolean;
  teamId: Id<"teams">;
  onChangeRole: (role: "admin" | "member") => void;
  onRemove: () => void;
}) {
  const mutedColor = useThemeColor("muted");

  return (
    <ListGroup.Item disabled>
      <ListGroup.ItemPrefix>
        <Avatar size="sm" alt={member.name ?? "Member"}>
          {member.image ? (
            <Avatar.Image source={{ uri: member.image }} />
          ) : null}
          <Avatar.Fallback>
            {getInitials(member.name ?? "?")}
          </Avatar.Fallback>
        </Avatar>
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>
          {member.name ?? "Unnamed"}
          {isSelf ? " (you)" : ""}
        </ListGroup.ItemTitle>
        <ListGroup.ItemDescription>
          {ROLE_LABELS[member.role] ?? member.role}
          {member.email ? ` · ${member.email}` : ""}
        </ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      {canManage && (
        <ListGroup.ItemSuffix>
          <Menu>
            <Menu.Trigger asChild>
              <Button isIconOnly variant="ghost" size="sm">
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  size={18}
                  color={mutedColor}
                />
              </Button>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Overlay />
              <Menu.Content presentation="popover" width={220}>
                {isOwner && member.role === "member" && (
                  <Menu.Item onPress={() => onChangeRole("admin")}>
                    <Menu.ItemTitle>Promote to Admin</Menu.ItemTitle>
                  </Menu.Item>
                )}
                {isOwner && member.role === "admin" && (
                  <Menu.Item onPress={() => onChangeRole("member")}>
                    <Menu.ItemTitle>Demote to Member</Menu.ItemTitle>
                  </Menu.Item>
                )}
                <Menu.Item variant="danger" onPress={onRemove}>
                  <Menu.ItemTitle>Remove from team</Menu.ItemTitle>
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu>
        </ListGroup.ItemSuffix>
      )}
    </ListGroup.Item>
  );
}

// ── Invite Sheet ──────────────────────────────────────────────────────

function InviteSheet({
  teamId,
  isOpen,
  onOpenChange,
}: {
  teamId: Id<"teams">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inviteMember = useAction(api.teams.inviteMember);
  const accentForegroundColor = useThemeColor("accent-foreground");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await inviteMember({
        teamId,
        email: email.trim(),
        role,
      });
      if (!result.success) {
        setError(result.error ?? "Failed to send invite");
      } else {
        setEmail("");
        setRole("member");
        onOpenChange(false);
      }
    } catch {
      setError("Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setEmail("");
          setRole("member");
          setError(null);
        }
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Title>Invite Member</BottomSheet.Title>
          <BottomSheet.Description>
            Send an email invitation to join your team.
          </BottomSheet.Description>

          <View className="gap-4 pt-4">
            <TextField>
              <Text className="text-sm text-foreground">Email</Text>
              <Input
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </TextField>

            <View className="gap-1">
              <Text className="text-sm text-foreground">Role</Text>
              <View className="flex-row gap-2">
                <Chip
                  size="lg"
                  variant={role === "member" ? "primary" : "tertiary"}
                  onPress={() => setRole("member")}
                >
                  <Chip.Label>Member</Chip.Label>
                </Chip>
                <Chip
                  size="lg"
                  variant={role === "admin" ? "primary" : "tertiary"}
                  onPress={() => setRole("admin")}
                >
                  <Chip.Label>Admin</Chip.Label>
                </Chip>
              </View>
            </View>

            <Text className="text-xs text-muted">
              {role === "admin"
                ? "Can invite and remove members, manage team settings, and access billing."
                : "Can access and use team features only."}
            </Text>

            {error && (
              <Text className="text-sm text-danger">{error}</Text>
            )}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="outline"
                  onPress={() => onOpenChange(false)}
                  isDisabled={loading}
                >
                  Cancel
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  onPress={handleInvite}
                  isDisabled={loading || !email.trim()}
                >
                  <HugeiconsIcon icon={Mail01Icon} size={18} color={accentForegroundColor} />
                  <Button.Label>
                    {loading ? "Sending..." : "Send Invite"}
                  </Button.Label>
                </Button>
              </View>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

// ── Pending Invites ───────────────────────────────────────────────────

function PendingInvites({ teamId }: { teamId: Id<"teams"> }) {
  const invites = useQuery(api.teams.getPendingInvites, { teamId });
  const cancelInvite = useMutation(api.teams.cancelInvite);

  if (!invites || invites.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)}>
      <ListGroup>
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Pending Invites</ListGroup.ItemTitle>
            <ListGroup.ItemDescription>
              {invites.length} pending
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
        </ListGroup.Item>

        {invites.map((invite) => (
          <View key={invite._id}>
            <Separator />
            <ListGroup.Item disabled>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{invite.email}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {ROLE_LABELS[invite.role] ?? invite.role} · Invited{" "}
                  {new Date(invite.createdAt).toLocaleDateString()}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => cancelInvite({ inviteId: invite._id })}
                >
                  Cancel
                </Button>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </View>
        ))}
      </ListGroup>
    </Animated.View>
  );
}

// ── Leave Team ────────────────────────────────────────────────────────

function LeaveTeam({
  teamId,
  currentUserId,
}: {
  teamId: Id<"teams">;
  currentUserId: Id<"users">;
}) {
  const removeMember = useMutation(api.teams.removeMember);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card>
      <Card.Body>
        <View className="gap-2">
          <Card.Title>Danger Zone</Card.Title>
          <Card.Description>
            Leaving this team is permanent. You can only rejoin if invited again.
          </Card.Description>
        </View>
        <View className="pt-4">
          <Dialog isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
            <Dialog.Trigger asChild>
              <Button variant="danger">Leave Team</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay />
              <Dialog.Content>
                <View className="gap-1.5">
                  <Dialog.Title>Leave this team?</Dialog.Title>
                  <Dialog.Description>
                    You will lose access to this team and all its resources. You
                    can only rejoin if invited again.
                  </Dialog.Description>
                </View>
                <View className="flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onPress={() => {
                      removeMember({ teamId, userId: currentUserId });
                      setConfirmOpen(false);
                    }}
                  >
                    Leave
                  </Button>
                </View>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </View>
      </Card.Body>
    </Card>
  );
}
