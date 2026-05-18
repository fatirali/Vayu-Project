import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

// ── Types ────────────────────────────────────────────────────────────────────

type Scenario = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: string;
  status: string;
  target_duration: string;
  retry_policy: string;
  session_rate: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  termination: "Termination",
  feedback: "Feedback",
  compensation: "Compensation",
  restructuring: "Restructuring",
};

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; dots: number; variant: "bad" | "warn" | "accent" | "neutral" }
> = {
  easy: { label: "Easy", dots: 1, variant: "accent" },
  medium: { label: "Medium", dots: 2, variant: "accent" },
  hard: { label: "Hard", dots: 3, variant: "warn" },
  hardest: { label: "Hardest", dots: 4, variant: "bad" },
};

function DifficultyDots({ difficulty }: { difficulty: string }) {
  const config = DIFFICULTY_CONFIG[difficulty] ?? { label: difficulty, dots: 2, variant: "neutral" as const };
  const filled = config.dots;
  const total = 4;
  const colorMap = {
    bad: "bg-[var(--color-bad)]",
    warn: "bg-[var(--color-warn)]",
    accent: "bg-[var(--color-accent)]",
    neutral: "bg-[var(--color-ink-4)]",
  } as const;
  const dotColor = colorMap[config.variant];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < filled ? dotColor : "bg-[var(--color-line)]"
          }`}
        />
      ))}
      <span className="ml-1 text-[11px] text-[var(--color-ink-4)]">
        {config.label}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("scenarios")
    .select("id, slug, title, subtitle, category, difficulty, status, target_duration, retry_policy, session_rate")
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data: scenarios = [] } = await query;

  const activeCategory = category ?? "all";

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Library" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["all", "termination", "feedback", "compensation", "restructuring"].map(
            (cat) => (
              <Link
                key={cat}
                href={cat === "all" ? "/library" : `/library?category=${cat}`}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                    : "bg-white text-[var(--color-ink-3)] border-[var(--color-line)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                }`}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
              </Link>
            )
          )}
        </div>

        {/* Grid */}
        {scenarios && scenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-[var(--color-ink-4)]">
              No scenarios in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const categoryLabel = CATEGORY_LABELS[scenario.category] ?? scenario.category;

  // Map category to pill variant
  const categoryVariant: Record<string, "bad" | "warn" | "accent" | "ld"> = {
    termination: "bad",
    feedback: "warn",
    compensation: "ld",
    restructuring: "accent",
  };

  return (
    <div className="group flex flex-col bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden hover:border-[var(--color-accent)] hover:shadow-sm transition-all">
      {/* Card header — colour accent bar */}
      <div
        className={`h-1 w-full ${
          scenario.category === "termination"
            ? "bg-[var(--color-bad)]"
            : scenario.category === "feedback"
            ? "bg-[var(--color-warn)]"
            : scenario.category === "restructuring"
            ? "bg-[var(--color-accent)]"
            : "bg-[var(--color-ld)]"
        }`}
      />

      <div className="flex flex-col flex-1 p-4">
        {/* Tags row */}
        <div className="flex items-center gap-2 mb-3">
          <Pill
            label={categoryLabel}
            variant={categoryVariant[scenario.category] ?? "neutral"}
          />
          <DifficultyDots difficulty={scenario.difficulty} />
        </div>

        {/* Title + subtitle */}
        <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-1 leading-snug">
          {scenario.title}
        </h3>
        <p className="text-xs text-[var(--color-ink-3)] leading-relaxed flex-1">
          {scenario.subtitle}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-line-2)]">
          <span className="text-[11px] text-[var(--color-ink-4)]">
            {scenario.target_duration}
          </span>
          <span className="text-[var(--color-line)] text-xs">·</span>
          <span className="text-[11px] text-[var(--color-ink-4)]">
            {scenario.retry_policy}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          href={`/book/${scenario.slug}`}
          className="flex items-center justify-center w-full py-2 text-xs font-semibold text-white bg-[var(--color-accent)] rounded-[var(--radius)] hover:opacity-90 transition-opacity"
        >
          Book a session
        </Link>
      </div>
    </div>
  );
}
