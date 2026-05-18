import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "default" | "ghost" | "accent" | "actor" | "stripe" | "ld" | "destructive";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  shortcut?: string;
  loading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  default: "bg-[var(--color-ink)] text-white hover:opacity-90",
  ghost: "bg-transparent text-[var(--color-ink-3)] hover:bg-[var(--color-chip)] hover:text-[var(--color-ink)]",
  accent: "bg-[var(--color-accent)] text-white hover:opacity-90",
  actor: "bg-[var(--color-actor)] text-white hover:opacity-90",
  stripe: "bg-[var(--color-stripe)] text-white hover:opacity-90",
  ld: "bg-[var(--color-ld)] text-white hover:opacity-90",
  destructive: "bg-[var(--color-bad)] text-white hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-8 px-3 text-sm gap-2",
  lg: "h-9 px-4 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "default", size = "md", shortcut, loading, children, className = "", disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-[var(--radius)] transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {children}
        </span>
      ) : (
        <>
          {children}
          {shortcut && (
            <kbd className="ml-1 text-[10px] opacity-60 font-mono">{shortcut}</kbd>
          )}
        </>
      )}
    </button>
  );
});
