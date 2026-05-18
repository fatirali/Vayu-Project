type Variant = "good" | "warn" | "bad" | "accent" | "actor" | "stripe" | "ld" | "neutral";

type Props = {
  label: string;
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  good: "bg-[var(--color-good-2)] text-[var(--color-good)]",
  warn: "bg-[var(--color-warn-2)] text-[var(--color-warn)]",
  bad: "bg-[var(--color-bad-2)] text-[var(--color-bad)]",
  accent: "bg-[var(--color-accent-2)] text-[var(--color-accent)]",
  actor: "bg-[var(--color-actor-2)] text-[var(--color-actor)]",
  stripe: "bg-[var(--color-stripe-2)] text-[var(--color-stripe)]",
  ld: "bg-[var(--color-ld-2)] text-[var(--color-ld)]",
  neutral: "bg-[var(--color-chip)] text-[var(--color-ink-3)]",
};

export function Pill({ label, variant = "neutral" }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
