import { AppShell } from "@/components/shell/AppShell";
import { requireAuth } from "@/lib/auth";
import type { NavItem } from "@/components/shell/SidebarNav";

const NAV_ITEMS: NavItem[] = [
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: <LibraryIcon />,
  },
  {
    id: "sessions",
    label: "My Sessions",
    href: "/my-sessions",
    icon: <SessionsIcon />,
  },
  {
    id: "progress",
    label: "My Progress",
    href: "/progress",
    icon: <ProgressIcon />,
  },
];

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AppShell
      portal="learner"
      navGroups={[{ items: NAV_ITEMS }]}
      user={user}
    >
      {children}
    </AppShell>
  );
}

function SessionsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="12" height="12" rx="1.5" />
      <path d="M5 5.5h5M5 7.5h5M5 9.5h3" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="2.5" width="4" height="10" rx="0.5" />
      <rect x="7" y="2.5" width="4" height="10" rx="0.5" />
      <path d="M12 4.5l1.5 8M13.5 4.5L12 4.5" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1.5,10.5 5,6.5 8,8.5 13.5,3.5" />
      <polyline points="11,3.5 13.5,3.5 13.5,6" />
    </svg>
  );
}
