type Props = {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number; // positive = up, negative = down
  deltaLabel?: string;
};

export function KPICard({ label, value, unit, delta, deltaLabel }: Props) {
  const hasDelta = delta !== undefined;
  const positive = delta !== undefined && delta >= 0;

  return (
    <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-4 py-3">
      <p className="text-xs text-[var(--color-ink-4)] mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-[var(--color-ink)] tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-[var(--color-ink-4)]">{unit}</span>
        )}
      </div>
      {hasDelta && (
        <div
          className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
            positive ? "text-[var(--color-good)]" : "text-[var(--color-bad)]"
          }`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            className={positive ? "" : "rotate-180"}
          >
            <path d="M5 1L9 7H1L5 1Z" />
          </svg>
          <span>
            {positive ? "+" : ""}
            {delta}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
