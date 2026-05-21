import { AppShell } from "@/components/shell/AppShell";
import { requireAuth } from "@/lib/auth";
import type { NavItem } from "@/components/shell/SidebarNav";

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/overview",
    icon: <OverviewIcon />,
  },
  {
    id: "sessions",
    label: "Sessions",
    href: "/sessions",
    icon: <SessionsIcon />,
  },
  {
    id: "roster",
    label: "Roster",
    href: "/roster",
    icon: <RosterIcon />,
  },
  {
    id: "payouts",
    label: "Payouts",
    href: "/payouts",
    icon: <PayoutsIcon />,
  },
];

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AppShell
      portal="ops"
      navGroups={[{ items: NAV_ITEMS }]}
      user={user}
    >
      {children}
    </AppShell>
  );
}

function OverviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7.5" cy="7.5" r="5.5" />
      <path d="M7.5 4v3.5l2 2" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.5 4.5h12M1.5 7.5h12M1.5 10.5h7" />
    </svg>
  );
}

function RosterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="5.5" cy="5" r="2" />
      <path d="M1.5 12.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <path d="M10 3.5a2 2 0 010 4M13.5 12.5c0-2.2-1.8-4-4-4" />
    </svg>
  );
}

function PayoutsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="4" width="12" height="8" rx="1" />
      <path d="M1.5 7h12M5 10h2" />
    </svg>
  );
}
