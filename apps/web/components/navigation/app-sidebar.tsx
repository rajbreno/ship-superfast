"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  UserIcon,
  CreditCardIcon,
  UserMultipleIcon,
  ArrowUp01Icon,
  LogoutIcon,
} from "@hugeicons/core-free-icons"
import { useSession } from "@/components/providers/session-provider"
import { getInitials } from "@repo/shared"
import { NAV_ITEMS } from "@/lib/config"
import { TeamSwitcher } from "@/components/navigation/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ICONS: Record<string, typeof Home01Icon> = {
  "/dashboard": Home01Icon,
  "/dashboard/team": UserMultipleIcon,
  "/dashboard/billing": CreditCardIcon,
  "/dashboard/profile": UserIcon,
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { currentUser, signOut } = useSession()
  const { isMobile, setOpenMobile } = useSidebar()

  const initials = getInitials(currentUser?.name)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={NAV_ICONS[item.href] ?? Home01Icon} size={24} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={currentUser?.image ?? undefined}
                      alt={currentUser?.name ?? "User"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {currentUser?.name ?? "User"}
                    </span>
                    <span className="truncate text-xs">
                      {currentUser?.email ?? ""}
                    </span>
                  </div>
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} size={20} className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={currentUser?.image ?? undefined}
                        alt={currentUser?.name ?? "User"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {currentUser?.name ?? "User"}
                      </span>
                      <span className="truncate text-xs">
                        {currentUser?.email ?? ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex justify-between">
                      Account
                      <HugeiconsIcon icon={UserIcon} strokeWidth={2} size={18} />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/billing" className="flex justify-between">
                      Billing
                      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} size={18} />
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex justify-between">
                  Log out
                  <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} size={18} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
