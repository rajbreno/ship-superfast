"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../packages/convex/convex/_generated/api";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useSession } from "@/components/providers/session-provider";
import { getInitials } from "@repo/shared";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit03Icon } from "@hugeicons/core-free-icons";

export default function ProfilePage() {
  const { currentUser } = useSession();
  const updateProfile = useMutation(api.users.updateProfile);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const initials = getInitials(currentUser?.name);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() || undefined });
      setOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentUser?.image ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {currentUser?.name ?? "User"}
              </CardTitle>
              <CardDescription>{currentUser?.email}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (v) setName(currentUser?.name ?? "");
              }}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HugeiconsIcon icon={Edit03Icon} className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your display name.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="Your name"
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
                    disabled={saving || !name.trim()}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="mt-1">{currentUser?.name ?? "\u2014"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="mt-1">{currentUser?.email ?? "\u2014"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Member since
              </p>
              <p className="mt-1">
                {currentUser?._creationTime
                  ? new Date(currentUser._creationTime).toLocaleDateString()
                  : "\u2014"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
