import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function BriefingPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  // Load session + scenario + persona + objectives + legal requirements
  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      status,
      scenario:scenarios (
        id,
        slug,
        title,
        subtitle,
        category,
        difficulty,
        target_duration,
        situation,
        personas (
          name,
          role,
          disposition,
          emotional_state,
          motivation
        ),
        objectives (
          number,
          text,
          weight
        ),
        legal_requirements (
          text,
          sort_order
        )
      ),
      actor:users!sessions_actor_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (!session || !session.scenario) notFound();

  // Supabase nested selects can return arrays or objects depending on relation cardinality.
  // We cast via unknown to satisfy the type checker after the notFound() guard above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawScenario = session.scenario as any;
  const scenario = Array.isArray(rawScenario) ? rawScenario[0] : rawScenario;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawActor = session.actor as any;
  const actor = Array.isArray(rawActor) ? rawActor[0] : rawActor;
  const persona = Array.isArray(scenario.personas) ? scenario.personas[0] : scenario.personas;
  const objectives = (Array.isArray(scenario.objectives) ? scenario.objectives : [])
    .sort((a: { number: number }, b: { number: number }) => a.number - b.number);
  const legalRequirements = (Array.isArray(scenario.legal_requirements) ? scenario.legal_requirements : [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  const scheduledDate = new Date(session.scheduled_at);
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const actorName = actor
    ? `${actor.first_name} ${actor.last_name}`
    : "Your actor";

  const difficultyVariantMap: Record<string, "bad" | "warn" | "accent" | "neutral"> = {
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
            { label: scenario.title },
          ]}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Session timing banner */}
          <div className="flex items-center justify-between bg-[var(--color-accent-2)] border border-[var(--color-accent)] rounded-[var(--radius-lg)] px-4 py-3 mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon />
              <div>
                <p className="text-xs font-semibold text-[var(--color-accent)]">
                  {formattedDate} at {formattedTime}
                </p>
                <p className="text-xs text-[var(--color-ink-3)]">
                  With {actorName} · {scenario.target_duration}
                </p>
              </div>
            </div>
            <Link href={`/session/${session.id}`}>
              <Button variant="accent" size="sm">
                Join session
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Persona card */}
              {persona && (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[var(--color-chip)] flex items-center justify-center shrink-0">
                      <span className="text-base font-semibold text-[var(--color-ink-3)]">
                        {persona.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-[var(--color-ink)]">
                          {persona.name}
                        </h2>
                        <Pill
                          label={scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
                          variant={difficultyVariantMap[scenario.difficulty] ?? "neutral"}
                        />
                      </div>
                      <p className="text-sm text-[var(--color-ink-3)] mt-0.5">{persona.role}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Pill label={persona.disposition} variant="neutral" />
                        <Pill label={persona.emotional_state} variant="warn" />
                      </div>
                    </div>
                  </div>
                  {persona.motivation && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-line-2)]">
                      <p className="text-xs font-medium text-[var(--color-ink-4)] uppercase tracking-wide mb-1">
                        What they want
                      </p>
                      <p className="text-sm text-[var(--color-ink-3)]">
                        {persona.motivation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Situation */}
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                  Your situation
                </h3>
                <div
                  className="text-sm text-[var(--color-ink-2)] leading-relaxed [&_b]:font-semibold [&_b]:text-[var(--color-ink)]"
                  dangerouslySetInnerHTML={{ __html: scenario.situation }}
                />
              </div>

              {/* Objectives */}
              {objectives.length > 0 && (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                    Your objectives
                  </h3>
                  <ol className="space-y-2.5">
                    {objectives.map((obj: { number: number; text: string }, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent-2)] text-[var(--color-accent)] text-[11px] font-bold flex items-center justify-center mt-0.5">
                          {obj.number}
                        </span>
                        <span className="text-sm text-[var(--color-ink-2)] leading-relaxed">
                          {obj.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Right column — Legal requirements */}
            {legalRequirements.length > 0 && (
              <div className="space-y-4">
                <div className="bg-[var(--color-bad-2)] border border-[var(--color-bad)] rounded-[var(--radius-lg)] p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <WarningIcon />
                    <h3 className="text-xs font-semibold text-[var(--color-bad)]">
                      Legal requirements
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {legalRequirements.map((req: { text: string }, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-[var(--color-ink-2)] leading-relaxed">
                        <span className="shrink-0 text-[var(--color-bad)] mt-0.5">•</span>
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" />
      <path d="M5 1.5v2M11 1.5v2M1.5 6.5h13" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--color-bad)" strokeWidth="1.5">
      <path d="M6.5 1L12 11H1L6.5 1Z" />
      <path d="M6.5 5v3M6.5 9.5v.5" strokeLinecap="round" />
    </svg>
  );
}
