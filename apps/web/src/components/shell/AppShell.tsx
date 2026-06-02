import { SidebarNav, type NavItem } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";

type NavGroup = {
  label?: string;
  items: NavItem[];
};

type Props = {
  portal: "learner" | "actor" | "studio" | "ops";
  navGroups: NavGroup[];
  topBar?: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  children: React.ReactNode;
};

const portalNames: Record<Props["portal"], string> = {
  learner: "Rehearse",
  actor: "Actor Portal",
  studio: "L&D Studio",
  ops: "Ops",
};

const portalMarkColors: Record<Props["portal"], string> = {
  learner: "bg-[var(--color-accent)]",
  actor: "bg-[var(--color-actor)]",
  studio: "bg-[var(--color-ld)]",
  ops: "bg-[var(--color-stripe)]",
};

export function AppShell({ portal, navGroups, user, topBar, children }: Props) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div data-portal={portal} className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside className="flex flex-col w-[220px] shrink-0 border-r border-[var(--color-line)] bg-[var(--color-paper)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--color-line)] shrink-0">
          <div
            className={`w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0 ${portalMarkColors[portal]}`}
          >
            <span className="text-white font-bold text-[11px]">R</span>
          </div>
          <span className="text-sm font-semibold text-[var(--color-ink)] truncate">
            {portalNames[portal]}
          </span>
        </div>

        {/* Nav */}
        <SidebarNav groups={navGroups} portal={portal} />

        {/* User */}
        <div className="px-3 pb-3 pt-2 border-t border-[var(--color-line)] shrink-0 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)]">
            <div className="w-7 h-7 rounded-full bg-[var(--color-chip)] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-[var(--color-ink-3)]">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--color-ink)] truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[var(--color-ink-4)] truncate">
                {user.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TopBar */}
        {topBar && (
          <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
            {topBar}
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
