"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

type Props = {
  groups: NavGroup[];
  portal: "learner" | "actor" | "studio" | "ops";
};

export function SidebarNav({ groups, portal }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  const accentMap: Record<Props["portal"], string> = {
    learner: "bg-[var(--color-accent-2)] text-[var(--color-accent)]",
    actor: "bg-[var(--color-actor-2)] text-[var(--color-actor)]",
    studio: "bg-[var(--color-ld-2)] text-[var(--color-ld)]",
    ops: "bg-[var(--color-stripe-2)] text-[var(--color-stripe)]",
  };

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-4)]">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.id}>
                  {item.disabled ? (
                    <span
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)] text-sm text-[var(--color-ink-4)] cursor-not-allowed select-none"
                      title="Coming soon"
                    >
                      <span className="opacity-50">{item.icon}</span>
                      <span className="flex-1 opacity-50">{item.label}</span>
                      <span className="text-[10px] text-[var(--color-ink-4)] bg-[var(--color-chip)] px-1.5 py-0.5 rounded-full">
                        Soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-colors ${
                        active
                          ? accentMap[portal]
                          : "text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-chip)]"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
