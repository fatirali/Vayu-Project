import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function ActorBriefPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      scenarios (
        id,
        slug,
        title,
        situation,
        target_duration,
        personas (
          name,
          role,
          disposition,
          emotional_state,
          backstory,
          motivation,
          emotion_arc,
          dont_list,
          allowed_facts,
          vocabulary_do,
          vocabulary_dont
        ),
        dramatic_arc_phases (
          phase_number,
          name,
          emotion,
          stance,
          moves_on_when,
          duration_estimate
        ),
        objectives (
          number,
          text
        )
      ),
      learner:users!sessions_learner_id_fkey (
        first_name,
        last_name,
        job_title,
        company
      )
    `)
    .eq("id", sessionId)
    .eq("actor_id", user.id)
    .single();

  if (!session) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
  if (!scenario) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const persona = (Array.isArray(scenario.personas) ? scenario.personas[0] : scenario.personas) as any;
  const arcPhases = (Array.isArray(scenario.dramatic_arc_phases) ? scenario.dramatic_arc_phases : [])
    .sort((a: { phase_number: number }, b: { phase_number: number }) => a.phase_number - b.phase_number);
  const objectives = (Array.isArray(scenario.objectives) ? scenario.objectives : [])
    .sort((a: { number: number }, b: { number: number }) => a.number - b.number);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const learner = (Array.isArray(session.learner) ? session.learner[0] : session.learner) as any;

  const scheduledDate = new Date(session.scheduled_at);
  const formattedDateTime =
    scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " at " +
    scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const phaseColors = [
    "bg-[var(--color-accent-2)] text-[var(--color-accent)]",
    "bg-[var(--color-warn-2)] text-[var(--color-warn)]",
    "bg-[var(--color-bad-2)] text-[var(--color-bad)]",
    "bg-[var(--color-actor-2)] text-[var(--color-actor)]",
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: "Dashboard", href: "/actor/dashboard" },
            { label: "Character brief" },
          ]}
          actions={
            <Link
              href={`/actor/session/${sessionId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-actor)] text-white text-xs font-semibold rounded-[var(--radius)] hover:opacity-90 transition"
            >
              Join session →
            </Link>
          }
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Session info banner */}
          <div className="flex items-center gap-3 bg-[var(--color-actor-2)] border border-[var(--color-actor)] rounded-[var(--radius-lg)] px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-actor)] animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--color-actor)]">{formattedDateTime}</p>
              <p className="text-xs text-[var(--color-ink-3)]">
                {scenario.title} · {scenario.target_duration}
                {learner && ` · Learner: ${learner.first_name} ${learner.last_name}`}
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <Link href={`/actor/playbook/${scenario.id}`}>
                <Pill label="Playbook" variant="actor" />
              </Link>
              <Link href={`/actor/rules/${scenario.id}`}>
                <Pill label="Rules" variant="neutral" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Left */}
            <div className="space-y-5">
              {/* Persona card */}
              {persona && (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-actor-2)] flex items-center justify-center shrink-0">
                      <span className="text-base font-semibold text-[var(--color-actor)]">
                        {persona.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--color-ink)]">{persona.name}</h2>
                      <p className="text-sm text-[var(--color-ink-3)]">{persona.role}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <Pill label={persona.disposition} variant="neutral" />
                        <Pill label={persona.emotional_state} variant="warn" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-[var(--color-line-2)]">
                    <InfoRow label="Motivation" value={persona.motivation} />
                    <InfoRow label="Emotion arc" value={persona.emotion_arc} />
                  </div>
                </div>
              )}

              {/* Dramatic arc */}
              {arcPhases.length > 0 && (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-4">
                    Emotional arc
                  </h3>
                  <div className="space-y-3">
                    {arcPhases.map((phase: {
                      phase_number: number;
                      name: string;
                      emotion: string;
                      stance: string;
                      moves_on_when: string;
                      duration_estimate: string;
                    }, i: number) => (
                      <div key={phase.phase_number} className="flex gap-3">
                        <div className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center mt-0.5 ${phaseColors[i] ?? phaseColors[0]}`}>
                          {phase.phase_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-[var(--color-ink)]">{phase.name}</p>
                            <span className="text-[10px] text-[var(--color-ink-4)]">{phase.duration_estimate}</span>
                          </div>
                          <p className="text-xs text-[var(--color-ink-3)]">
                            <span className="font-medium">Emotion:</span> {phase.emotion} ·{" "}
                            <span className="font-medium">Stance:</span> {phase.stance}
                          </p>
                          <p className="text-xs text-[var(--color-ink-4)] mt-0.5">
                            Move on when: {phase.moves_on_when}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learner objectives */}
              {objectives.length > 0 && (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                    Learner&apos;s objectives
                  </h3>
                  <ol className="space-y-1.5">
                    {objectives.map((obj: { number: number; text: string }) => (
                      <li key={obj.number} className="flex gap-2.5 text-xs text-[var(--color-ink-3)]">
                        <span className="shrink-0 w-4 font-semibold text-[var(--color-ink-4)]">{obj.number}.</span>
                        {obj.text}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Right: vocabulary */}
            {persona && (
              <div className="space-y-4">
                {persona.vocabulary_do?.length > 0 && (
                  <div className="bg-[var(--color-good-2)] border border-[var(--color-good)] rounded-[var(--radius-lg)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-good)] mb-2">Say</p>
                    <ul className="space-y-1">
                      {persona.vocabulary_do.map((word: string, i: number) => (
                        <li key={i} className="text-xs text-[var(--color-ink-2)]">&ldquo;{word}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}
                {persona.vocabulary_dont?.length > 0 && (
                  <div className="bg-[var(--color-bad-2)] border border-[var(--color-bad)] rounded-[var(--radius-lg)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-bad)] mb-2">Don&apos;t say</p>
                    <ul className="space-y-1">
                      {persona.vocabulary_dont.map((word: string, i: number) => (
                        <li key={i} className="text-xs text-[var(--color-ink-2)]">&ldquo;{word}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}
                {persona.dont_list?.length > 0 && (
                  <div className="bg-[var(--color-warn-2)] border border-[var(--color-warn)] rounded-[var(--radius-lg)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-warn)] mb-2">Never do</p>
                    <ul className="space-y-1">
                      {persona.dont_list.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-[var(--color-ink-2)]">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--color-ink-2)]">{value}</p>
    </div>
  );
}
