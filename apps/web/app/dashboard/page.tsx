"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../packages/convex/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/providers/session-provider";
import { useTeam } from "@/components/providers/team-provider";
import { IncomingInvites } from "@/components/team/incoming-invites";
import { getInitials } from "@repo/shared";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  FingerPrintIcon,
  Invoice02Icon,
} from "@hugeicons/core-free-icons";

export default function DashboardPage() {
  const { currentUser, isAdmin } = useSession();
  const { activeTeam } = useTeam();
  const myInvites = useQuery(api.teams.getMyPendingInvites);
  const payments = useQuery(
    api.payments.getPaymentHistory,
    activeTeam ? { teamId: activeTeam._id } : "skip",
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Welcome header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={currentUser?.image ?? undefined} />
          <AvatarFallback className="text-lg">
            {getInitials(currentUser?.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back, {currentUser?.name?.split(" ")[0] ?? "User"}
            {isAdmin && (
              <Badge variant="secondary" className="ml-2 align-middle">
                Admin
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeTeam
              ? `${activeTeam.name} · ${activeTeam.role}`
              : "No team selected"}
          </p>
        </div>
      </div>

      {/* Pending team invitations */}
      {myInvites && myInvites.length > 0 && (
        <IncomingInvites invites={myInvites} />
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Team Plan</CardDescription>
              <div className="rounded-lg bg-primary/10 p-2">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={1.5}
                  className="h-5 w-5 text-primary"
                />
              </div>
            </div>
            <CardTitle className="text-2xl capitalize">
              {activeTeam?.plan ?? "Free"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Shared across all team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Transactions</CardDescription>
              <div className="rounded-lg bg-primary/10 p-2">
                <HugeiconsIcon
                  icon={Invoice02Icon}
                  strokeWidth={1.5}
                  className="h-5 w-5 text-primary"
                />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {payments?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Auth</CardDescription>
              <div className="rounded-lg bg-primary/10 p-2">
                <HugeiconsIcon
                  icon={FingerPrintIcon}
                  strokeWidth={1.5}
                  className="h-5 w-5 text-primary"
                />
              </div>
            </div>
            <CardTitle className="text-2xl">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Google OAuth via Convex Auth
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
