type Breadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  breadcrumbs?: Breadcrumb[];
  pill?: React.ReactNode;
  actions?: React.ReactNode;
};

export function TopBar({ breadcrumbs = [], pill, actions }: Props) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left: breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-[var(--color-ink-4)]">/</span>
            )}
            {crumb.href ? (
              <a
                href={crumb.href}
                className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)] transition-colors"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="font-medium text-[var(--color-ink)]">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
        {pill && <span className="ml-1">{pill}</span>}
      </div>

      {/* Right: actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
