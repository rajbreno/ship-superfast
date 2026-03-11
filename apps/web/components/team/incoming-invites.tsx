"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../packages/convex/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, CancelCircleIcon } from "@hugeicons/core-free-icons";

type Invite = {
  _id: Id<"teamInvites">;
  teamName: string;
  role: string;
  invitedByName?: string;
  createdAt: number;
};

export function IncomingInvites({ invites }: { invites: Invite[] }) {
  const acceptInvite = useMutation(api.teams.acceptInvite);
  const declineInvite = useMutation(api.teams.declineInvite);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          You have been invited to join the following teams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite._id}
            className="flex items-center justify-between rounded-lg border bg-background p-4"
          >
            <div>
              <p className="text-sm font-medium">{invite.teamName}</p>
              <p className="text-xs text-muted-foreground">
                Invited by {invite.invitedByName ?? "a team member"} as{" "}
                {invite.role}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => acceptInvite({ inviteId: invite._id })}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-1 h-5 w-5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineInvite({ inviteId: invite._id })}
              >
                <HugeiconsIcon
                  icon={CancelCircleIcon}
                  className="mr-1 h-5 w-5"
                />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
