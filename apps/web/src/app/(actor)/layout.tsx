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
  {
    id: "scenarios",
    label: "Scenarios",
    href: "/actor/scenarios",
    icon: <ScenariosIcon />,
  },
  {
    id: "earnings",
    label: "Earnings",
    href: "/actor/earnings",
    icon: <EarningsIcon />,
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

function ScenariosIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1.5" width="11" height="12" rx="1" />
      <line x1="4.5" y1="5" x2="10.5" y2="5" />
      <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" />
      <line x1="4.5" y1="10" x2="8" y2="10" />
    </svg>
  );
}

function EarningsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="6" />
      <path d="M7.5 4v1.5M7.5 9.5V11" />
      <path d="M5.5 6.25C5.5 5.56 6.4 5 7.5 5s2 .56 2 1.25c0 1.5-4 1.5-4 3C5.5 10 6.4 10.5 7.5 10.5s2-.5 2-1.25" />
    </svg>
  );
}
