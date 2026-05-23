import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { KPICard } from "@/components/ui/KPICard";
import { Pill } from "@/components/ui/Pill";
import Link from "next/link";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function AnalyticsPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      analytics_ready,
      scenarios (
        title,
        objectives (
          id,
          number,
          text,
          weight
        )
      ),
      session_scores (
        overall_score,
        filler_count,
        pace_wpm,
        talk_ratio,
        duration_actual
      ),
      topic_coverage (
        objective_id,
        status,
        covered_at
      ),
      transcript_lines (
        id,
        timestamp,
        speaker,
        text,
        filler_words
      )
    `)
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (!session) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = (Array.isArray(session.session_scores) ? session.session_scores[0] : session.session_scores) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectives: any[] = Array.isArray(scenario?.objectives) ? scenario.objectives : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topicCoverage: any[] = Array.isArray(session.topic_coverage) ? session.topic_coverage : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transcriptLines: any[] = Array.isArray(session.transcript_lines)
    ? session.transcript_lines.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    : [];

  // Not ready yet
  if (!session.analytics_ready) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
          <TopBar breadcrumbs={[{ label: "Analytics" }]} />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-2)] flex items-center justify-center mx-auto mb-3">
              <SpinnerIcon />
            </div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
              Analysing your session…
            </h2>
            <p className="text-xs text-[var(--color-ink-4)]">
              This usually takes 1–3 minutes. Refresh when ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!scores) notFound();

  const talkPct = Math.round(scores.talk_ratio * 100);
  const listenPct = 100 - talkPct;

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function coverageStatus(objectiveId: string): "covered" | "partial" | "missed" | null {
    const cov = topicCoverage.find((c: { objective_id: string }) => c.objective_id === objectiveId);
    return cov?.status ?? null;
  }

  const coverageVariant: Record<string, "good" | "warn" | "bad"> = {
    covered: "good",
    partial: "warn",
    missed: "bad",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: "Library", href: "/library" },
            { label: scenario?.title ?? "Session" },
            { label: "Analytics" },
          ]}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Overall score" value={scores.overall_score} unit="/100" />
            <KPICard label="Filler words" value={scores.filler_count} />
            <KPICard label="Pace" value={scores.pace_wpm} unit="wpm" />
            <KPICard label="Talk ratio" value={`${talkPct}/${listenPct}`} unit="%" />
          </div>

          {/* Talk/listen split + duration */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 rounded-full bg-[var(--color-line)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                style={{ width: `${talkPct}%` }}
              />
            </div>
            <span className="text-xs text-[var(--color-ink-4)] shrink-0 tabular-nums">
              {formatDuration(scores.duration_actual)} total
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Left: transcript */}
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-line-2)]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">
                  Transcript
                </h3>
              </div>
              <div className="divide-y divide-[var(--color-line-2)] max-h-[400px] overflow-y-auto">
                {transcriptLines.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-[var(--color-ink-4)] text-center">
                    No transcript available.
                  </p>
                ) : (
                  transcriptLines.map((line: {
                    id: string;
                    timestamp: string;
                    speaker: string;
                    text: string;
                    filler_words: string[];
                  }) => (
                    <div
                      key={line.id}
                      className={`flex gap-3 px-4 py-2.5 ${
                        line.speaker === "actor"
                          ? "bg-[var(--color-bg)]"
                          : ""
                      }`}
                    >
                      <span className="shrink-0 text-[10px] text-[var(--color-ink-4)] tabular-nums mt-0.5 w-8">
                        {line.timestamp}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide mr-1.5 ${
                            line.speaker === "learner"
                              ? "text-[var(--color-accent)]"
                              : "text-[var(--color-ink-4)]"
                          }`}
                        >
                          {line.speaker === "learner" ? "You" : "Actor"}
                        </span>
                        <FillerHighlightedText
                          text={line.text}
                          fillerWords={line.filler_words}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: topic coverage */}
            <div>
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                  Topic coverage
                </h3>
                {objectives.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-4)]">No objectives.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {objectives
                      .sort((a: { number: number }, b: { number: number }) => a.number - b.number)
                      .map((obj: { id: string; number: number; text: string; weight: number }) => {
                        const status = coverageStatus(obj.id);
                        return (
                          <li key={obj.id} className="flex gap-2">
                            <span className="shrink-0 mt-0.5">
                              {status === "covered" && <CheckCircleIcon />}
                              {status === "partial" && <HalfCircleIcon />}
                              {(status === "missed" || !status) && <EmptyCircleIcon />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[var(--color-ink-2)] leading-snug">
                                {obj.text}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {status && (
                                  <Pill
                                    label={status.charAt(0).toUpperCase() + status.slice(1)}
                                    variant={coverageVariant[status] ?? "neutral"}
                                  />
                                )}
                                <span className="text-[10px] text-[var(--color-ink-4)]">
                                  {obj.weight}%
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Chat with Ada CTA */}
          <div className="mt-6 flex justify-center">
            <Link
              href={`/coach/${sessionId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">A</span>
              Chat with Ada →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FillerHighlightedText({ text, fillerWords }: { text: string; fillerWords: string[] }) {
  if (!fillerWords.length) {
    return <span className="text-xs text-[var(--color-ink-2)]">{text}</span>;
  }

  const fillerSet = new Set(fillerWords.map((w) => w.toLowerCase()));
  const parts = text.split(/\b/);

  return (
    <span className="text-xs text-[var(--color-ink-2)]">
      {parts.map((part, i) =>
        fillerSet.has(part.toLowerCase()) ? (
          <mark
            key={i}
            className="bg-[var(--color-warn-2)] text-[var(--color-warn)] rounded px-0.5 not-italic"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
      <circle className="opacity-25" cx="12" cy="12" r="10" />
      <path className="opacity-75" d="M4 12a8 8 0 018-8" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="var(--color-good-2)" stroke="var(--color-good)" strokeWidth="1" />
      <path d="M4 7l2 2 4-4" stroke="var(--color-good)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HalfCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="var(--color-warn-2)" stroke="var(--color-warn)" strokeWidth="1" />
      <path d="M5 7h4M7 5v4" stroke="var(--color-warn)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="var(--color-bad-2)" stroke="var(--color-bad)" strokeWidth="1" />
      <path d="M5 5l4 4M9 5l-4 4" stroke="var(--color-bad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
