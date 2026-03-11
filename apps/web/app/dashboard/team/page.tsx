"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../../packages/convex/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/components/providers/session-provider";
import { useTeam } from "@/components/providers/team-provider";
import { IncomingInvites } from "@/components/team/incoming-invites";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Mail01Icon,
  Edit03Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { getInitials } from "@repo/shared";

const ROLE_BADGES: Record<
  string,
  { label: string; variant: "secondary" | "outline" }
> = {
  owner: { label: "Owner", variant: "secondary" },
  admin: { label: "Admin", variant: "outline" },
  member: { label: "Member", variant: "outline" },
};

export default function TeamPage() {
  const { currentUser } = useSession();
  const { activeTeam, isLoading } = useTeam();
  const myInvites = useQuery(api.teams.getMyPendingInvites);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Pending invitations for current user */}
      {myInvites && myInvites.length > 0 && (
        <IncomingInvites invites={myInvites} />
      )}

      {activeTeam && (
        <>
          <TeamHeader team={activeTeam} />

          <MembersCard
            teamId={activeTeam._id}
            currentUserId={currentUser?._id}
            currentRole={activeTeam.role}
          />

          {["owner", "admin"].includes(activeTeam.role) && (
            <PendingInvitesCard teamId={activeTeam._id} />
          )}

          {activeTeam.role !== "owner" && currentUser && (
            <DangerZone
              teamId={activeTeam._id}
              currentUserId={currentUser._id}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Team Header ──────────────────────────────────────────────────────

function TeamHeader({
  team,
}: {
  team: {
    _id: Id<"teams">;
    name: string;
    role: string;
  };
}) {
  const updateName = useMutation(api.teams.updateTeamName);
  const [open, setOpen] = useState(false);
  const [nameValue, setNameValue] = useState(team.name);
  const [saving, setSaving] = useState(false);
  const canManageTeam = ["owner", "admin"].includes(team.role);

  async function handleSave() {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await updateName({ teamId: team._id, name: nameValue.trim() });
      setOpen(false);
    } catch {
      toast.error("Failed to update team name");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{team.name}</CardTitle>
        <CardDescription>
          Your role: {ROLE_BADGES[team.role]?.label ?? team.role}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            {canManageTeam && (
              <Dialog
                open={open}
                onOpenChange={(v) => {
                  setOpen(v);
                  if (v) setNameValue(team.name);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <HugeiconsIcon
                      icon={Edit03Icon}
                      className="h-5 w-5"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Team</DialogTitle>
                    <DialogDescription>
                      Enter a new name for your team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <Label htmlFor="team-name">Name</Label>
                    <Input
                      id="team-name"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      placeholder="Team name"
                      maxLength={50}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={saving}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleSave}
                      disabled={saving || !nameValue.trim()}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

// ── Members Card ─────────────────────────────────────────────────────

function MembersCard({
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

  const isOwner = currentRole === "owner";
  const canManageTeam = ["owner", "admin"].includes(currentRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          {members
            ? `${members.length} member${members.length !== 1 ? "s" : ""}`
            : "Loading..."}
        </CardDescription>
        {canManageTeam && (
          <CardAction>
            <InviteDialog teamId={teamId} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canManageTeam && (
                <TableHead className="w-[50px]" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map(
              (member: NonNullable<typeof members>[number]) => {
                const isSelf = member.userId === currentUserId;
                const canManage =
                  !isSelf &&
                  canManageTeam &&
                  member.role !== "owner" &&
                  // Only owner can manage admins
                  !(currentRole === "admin" && member.role === "admin");

                return (
                  <TableRow key={member.membershipId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.image ?? undefined} />
                          <AvatarFallback>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.name ?? "Unnamed"}
                            {isSelf && (
                              <span className="ml-1 text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ROLE_BADGES[member.role]?.variant ?? "outline"
                        }
                      >
                        {ROLE_BADGES[member.role]?.label ?? member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <HugeiconsIcon
                                  icon={MoreHorizontalIcon}
                                  className="h-5 w-5"
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {isOwner && (
                                <DropdownMenuGroup>
                                  {member.role === "member" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        changeRole({
                                          teamId,
                                          userId: member.userId,
                                          role: "admin",
                                        })
                                      }
                                    >
                                      Promote to Admin
                                    </DropdownMenuItem>
                                  )}
                                  {member.role === "admin" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        changeRole({
                                          teamId,
                                          userId: member.userId,
                                          role: "member",
                                        })
                                      }
                                    >
                                      Demote to Member
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                </DropdownMenuGroup>
                              )}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  removeMember({
                                    teamId,
                                    userId: member.userId,
                                  })
                                }
                              >
                                Remove from team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              },
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Invite Dialog ───────────────────────────────────────────────────

function InviteDialog({ teamId }: { teamId: Id<"teams"> }) {
  const inviteMember = useAction(api.teams.inviteMember);
  const [open, setOpen] = useState(false);
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
        toast.success("Invite sent successfully");
        setEmail("");
        setRole("member");
        setOpen(false);
      }
    } catch {
      setError("Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setEmail("");
          setRole("member");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-5 w-5" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an email invitation to join your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <div className="flex items-end gap-3">
              <div className="grid flex-1 gap-3">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as "admin" | "member")}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {role === "admin"
                ? "Can invite and remove members, manage team settings, and access billing."
                : "Can access and use team features only. Cannot manage members or billing."}
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleInvite}
            disabled={loading || !email.trim()}
          >
            <HugeiconsIcon icon={Mail01Icon} className="mr-2 h-5 w-5" />
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Pending Invites Card ─────────────────────────────────────────────

function PendingInvitesCard({ teamId }: { teamId: Id<"teams"> }) {
  const invites = useQuery(api.teams.getPendingInvites, { teamId });
  const cancelInvite = useMutation(api.teams.cancelInvite);

  if (!invites || invites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invites</CardTitle>
        <CardDescription>
          {invites.length} pending invitation{invites.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map(
              (invite: NonNullable<typeof invites>[number]) => (
                <TableRow key={invite._id}>
                  <TableCell className="font-medium">
                    {invite.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ROLE_BADGES[invite.role]?.label ?? invite.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        cancelInvite({ inviteId: invite._id })
                      }
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Danger Zone ──────────────────────────────────────────────────────

function DangerZone({
  teamId,
  currentUserId,
}: {
  teamId: Id<"teams">;
  currentUserId: Id<"users">;
}) {
  const removeMember = useMutation(api.teams.removeMember);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danger Zone</CardTitle>
        <CardDescription>
          Leaving this team is permanent. You can only rejoin if invited again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Leave Team</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave this team?</AlertDialogTitle>
              <AlertDialogDescription>
                You will lose access to this team and all its resources.
                You can only rejoin if invited again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  removeMember({ teamId, userId: currentUserId })
                }
              >
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
