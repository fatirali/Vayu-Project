import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import Link from "next/link";

export default async function ProgressPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      scenarios ( title, category ),
      session_scores ( overall_score, filler_count, pace_wpm, talk_ratio, duration_actual )
    `)
    .eq("learner_id", user.id)
    .eq("status", "completed")
    .eq("analytics_ready", true)
    .order("scheduled_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (sessions ?? []).map((s) => ({
    id: s.id,
    scheduledAt: s.scheduled_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scenario: (Array.isArray(s.scenarios) ? s.scenarios[0] : s.scenarios) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scores: (Array.isArray(s.session_scores) ? s.session_scores[0] : s.session_scores) as any,
  })).filter((r) => r.scores);

  const hasData = rows.length > 0;
  const scores = rows.map((r) => r.scores.overall_score as number);
  const first = rows[0]?.scores;
  const last = rows[rows.length - 1]?.scores;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // Build sparkline SVG path
  function buildSparkline(values: number[], width: number, height: number) {
    if (values.length < 2) return null;
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - minV) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });
    return points.join(" ");
  }

  const sparkPoints = buildSparkline(scores, 400, 80);

  function Delta({ first, last, label, lowerBetter }: { first: number; last: number; label: string; lowerBetter?: boolean }) {
    const diff = last - first;
    const improved = lowerBetter ? diff < 0 : diff > 0;
    const neutral = diff === 0;
    return (
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4">
        <p className="text-xs text-[var(--color-ink-4)] mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-xl font-semibold text-[var(--color-ink)]">{last}</span>
          {!neutral && (
            <span className={`text-xs font-medium pb-0.5 ${improved ? "text-[var(--color-good)]" : "text-[var(--color-bad)]"}`}>
              {diff > 0 ? "+" : ""}{diff} {improved ? "↑" : "↓"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-chip)] overflow-hidden">
            <div
              className={`h-full rounded-full ${improved ? "bg-[var(--color-good)]" : neutral ? "bg-[var(--color-ink-4)]" : "bg-[var(--color-bad)]"}`}
              style={{ width: `${Math.min(100, Math.abs(last))}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--color-ink-4)]">from {first}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "My Progress" }]} />
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto">
            <div className="w-10 h-10 rounded-full bg-[var(--color-chip)] flex items-center justify-center mb-3">
              <ChartIcon />
            </div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-1">No completed sessions yet</h2>
            <p className="text-xs text-[var(--color-ink-4)]">
              Complete a session and get your analytics back — your progress will appear here.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Score sparkline */}
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">Overall score over time</h2>
                <span className="text-xs text-[var(--color-ink-4)]">{rows.length} session{rows.length !== 1 ? "s" : ""}</span>
              </div>
              <svg viewBox="0 0 400 80" className="w-full" preserveAspectRatio="none" style={{ height: 80 }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <line
                    key={v}
                    x1="0" y1={80 - (v / 100) * 72 - 4}
                    x2="400" y2={80 - (v / 100) * 72 - 4}
                    stroke="var(--color-line)" strokeWidth="0.5"
                  />
                ))}
                {sparkPoints && (
                  <>
                    <polyline
                      points={sparkPoints}
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {scores.map((v, i) => {
                      const x = (i / (scores.length - 1)) * 400;
                      const y = 80 - ((v - Math.min(...scores)) / (Math.max(...scores) - Math.min(...scores) || 1)) * 72 - 4;
                      return (
                        <circle key={i} cx={x} cy={y} r="3" fill="var(--color-accent)" />
                      );
                    })}
                  </>
                )}
                {scores.length === 1 && (
                  <circle cx="200" cy="40" r="4" fill="var(--color-accent)" />
                )}
              </svg>
              <div className="flex justify-between mt-1">
                {rows.map((r, i) => (
                  <span key={i} className="text-[10px] text-[var(--color-ink-4)]">
                    {formatDate(r.scheduledAt)}
                  </span>
                ))}
              </div>
            </div>

            {/* Skill deltas — only show if >1 session */}
            {rows.length > 1 && first && last && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                  Skill progression (first → latest)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <Delta first={first.filler_count} last={last.filler_count} label="Filler words" lowerBetter />
                  <Delta first={first.pace_wpm} last={last.pace_wpm} label="Pace (wpm)" />
                  <Delta first={Math.round(first.talk_ratio * 100)} last={Math.round(last.talk_ratio * 100)} label="Talk ratio %" />
                </div>
              </div>
            )}

            {/* Session history table */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                Session history
              </h2>
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-chip)]">
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Date</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Scenario</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Score</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Duration</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Fillers</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows].reverse().map((row, i) => (
                      <tr key={row.id} className={`border-b border-[var(--color-line)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-chip)]/30"}`}>
                        <td className="px-4 py-3 text-xs text-[var(--color-ink-3)]">{formatDate(row.scheduledAt)}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-ink)] font-medium">{row.scenario?.title ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-semibold ${
                            row.scores.overall_score >= 75 ? "text-[var(--color-good)]" :
                            row.scores.overall_score >= 50 ? "text-[var(--color-warn)]" :
                            "text-[var(--color-bad)]"
                          }`}>
                            {row.scores.overall_score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[var(--color-ink-3)]">
                          {row.scores.duration_actual ? formatDuration(row.scores.duration_actual) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[var(--color-ink-3)]">{row.scores.filler_count}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/analytics/${row.id}`}
                            className="text-[11px] font-medium text-[var(--color-accent)] hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-ink-4)" strokeWidth="1.5">
      <polyline points="1.5,13.5 6,8.5 9.5,11 16.5,4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
