import { APP_NAME } from "@repo/shared";

export { APP_NAME };

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Team", href: "/dashboard/team" },
  { title: "Billing", href: "/dashboard/billing" },
  { title: "Account", href: "/dashboard/profile" },
] as const;

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.href, item.title]),
);
