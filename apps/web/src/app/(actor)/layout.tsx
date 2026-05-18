import { AppShell } from "@/components/shell/AppShell";
import { requireAuth } from "@/lib/auth";
import type { NavItem } from "@/components/shell/SidebarNav";

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/actor/dashboard",
    icon: <DashboardIcon />,
  },
];

export default async function ActorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AppShell
      portal="actor"
      navGroups={[{ items: NAV_ITEMS }]}
      user={user}
    >
      {children}
    </AppShell>
  );
}

function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="5" height="5" rx="0.5" />
      <rect x="8.5" y="1.5" width="5" height="5" rx="0.5" />
      <rect x="1.5" y="8.5" width="5" height="5" rx="0.5" />
      <rect x="8.5" y="8.5" width="5" height="5" rx="0.5" />
    </svg>
  );
}
