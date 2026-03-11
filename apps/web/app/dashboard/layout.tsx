"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../packages/convex/convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/components/providers/session-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { ModeToggle } from "@/components/navigation/mode-toggle";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { PAGE_TITLES } from "@/lib/config";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { LayoutAlignLeftIcon } from "@hugeicons/core-free-icons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const ensureTeam = useMutation(api.teams.ensureTeam);

  const pageTitle = PAGE_TITLES[pathname] ?? pathname.split("/").pop();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoading, isSignedIn, router]);

  // Auto-create team on first sign-in (safe to remove if teams feature is disabled)
  useEffect(() => {
    if (isSignedIn) {
      ensureTeam().catch((err) => {
        console.warn("ensureTeam failed (teams module may be removed):", err);
      });
    }
  }, [isSignedIn, ensureTeam]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <TeamProvider>
          <AppSidebar />
          <SidebarInset>
            <DashboardHeader pageTitle={pageTitle} />
            <main className="flex-1 px-6 py-8">{children}</main>
          </SidebarInset>
        </TeamProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function DashboardHeader({ pageTitle }: { pageTitle: string | undefined }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <HugeiconsIcon icon={LayoutAlignLeftIcon} size={24} />
        </Button>
        <h1 className="text-base font-normal">{pageTitle}</h1>
      </div>
      <ModeToggle />
    </header>
  );
}
