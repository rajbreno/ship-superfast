"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { useTeam } from "@/components/providers/team-provider"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { activeTeam, teams, isLoading, switchTeam } = useTeam()

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent animate-pulse" />
            <div className="grid flex-1 gap-1">
              <div className="h-3.5 w-24 rounded bg-sidebar-accent animate-pulse" />
              <div className="h-3 w-12 rounded bg-sidebar-accent animate-pulse" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={activeTeam.ownerImage} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                  {activeTeam.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs capitalize">
                  {activeTeam.plan}
                </span>
              </div>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team) => (
              <DropdownMenuItem
                key={team._id}
                onClick={() => switchTeam(team._id)}
                className="gap-2 p-2"
              >
                <Avatar className="size-6 rounded-md">
                  <AvatarImage src={team.ownerImage} />
                  <AvatarFallback className="rounded-md text-xs font-semibold">
                    {team.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{team.name}</span>
                <Badge
                  variant={team.plan === "free" ? "outline" : "secondary"}
                >
                  {team.plan === "max" ? "Max" : team.plan === "pro" ? "Pro" : "Free"}
                </Badge>
                {team._id === activeTeam._id && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={20}
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
