import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { CalEmbedPanel } from "./CalEmbedPanel";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

type Actor = {
  id: string;
  firstName: string;
  lastName: string;
  calComUsername: string | null;
  rating: number;
  sessionCount: number;
};

export default async function BookPage({ params }: Props) {
  const { scenarioId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  // Resolve by slug or UUID
  const isUuid = /^[0-9a-f-]{36}$/i.test(scenarioId);
  const scenarioQuery = supabase
    .from("scenarios")
    .select("id, slug, title, subtitle, category, difficulty, target_duration, retry_policy")
    .eq("status", "published");

  const { data: scenario } = await (isUuid
    ? scenarioQuery.eq("id", scenarioId).single()
    : scenarioQuery.eq("slug", scenarioId).single());

  if (!scenario) notFound();

  // Fetch certified actors for this scenario
  const { data: certRows } = await supabase
    .from("actor_certifications")
    .select(`
      actor:users!actor_certifications_actor_id_fkey (
        id,
        first_name,
        last_name,
        cal_com_username,
        approved_at
      )
    `)
    .eq("scenario_id", scenario.id)
    .eq("status", "certified");

  const actors: Actor[] = (certRows ?? [])
    .filter((row) => {
      const a = Array.isArray(row.actor) ? row.actor[0] : row.actor;
      return a && a.approved_at;
    })
    .map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = (Array.isArray(row.actor) ? row.actor[0] : row.actor) as any;
      if (!a) return null;
      // Seed data has static ratings baked in; production will aggregate session_scores
      const ACTOR_RATINGS: Record<string, { rating: number; sessions: number }> = {
        "00000000-0000-0000-0000-000000000010": { rating: 4.9, sessions: 87 },
        "00000000-0000-0000-0000-000000000011": { rating: 4.7, sessions: 54 },
        "00000000-0000-0000-0000-000000000012": { rating: 4.8, sessions: 61 },
        "00000000-0000-0000-0000-000000000013": { rating: 5.0, sessions: 28 },
      };
      const stats = ACTOR_RATINGS[a.id as string] ?? { rating: 0, sessions: 0 };
      return {
        id: a.id as string,
        firstName: a.first_name as string,
        lastName: a.last_name as string,
        calComUsername: a.cal_com_username as string | null,
        rating: stats.rating,
        sessionCount: stats.sessions,
      } as Actor;
    })
    .filter((a): a is Actor => a !== null);

  const diffVariant: Record<string, "bad" | "warn" | "accent"> = {
    hardest: "bad",
    hard: "warn",
    medium: "accent",
    easy: "accent",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: "Library", href: "/library" },
            { label: "Book a session" },
          ]}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Scenario summary */}
          <div className="flex items-center gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-semibold text-[var(--color-ink)]">
                  {scenario.title}
                </h1>
                <Pill
                  label={scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
                  variant={diffVariant[scenario.difficulty] ?? "neutral"}
                />
              </div>
              <p className="text-xs text-[var(--color-ink-4)]">
                {scenario.target_duration} · {scenario.retry_policy}
              </p>
            </div>
          </div>

          {/* Main booking grid */}
          <CalEmbedPanel
            actors={actors}
            learnerId={user.id}
            learnerEmail={user.email}
            learnerName={`${user.firstName} ${user.lastName}`}
            scenarioId={scenario.id}
            scenarioTitle={scenario.title}
          />
        </div>
      </div>
    </div>
  );
}
