import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

export default async function OpsSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      status,
      scenarios (title),
      learner:users!sessions_learner_id_fkey (first_name, last_name),
      actor:users!sessions_actor_id_fkey (first_name, last_name),
      session_scores (overall_score, duration_actual),
      session_payments (amount, status)
    `)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: sessions } = await query;

  const statusVariant: Record<string, "good" | "accent" | "warn" | "bad" | "neutral"> = {
    completed: "good",
    live: "accent",
    booked: "neutral",
    confirmed: "accent",
    cancelled: "bad",
    no_show: "warn",
  };

  const filterOptions = ["all", "completed", "live", "booked", "cancelled", "no_show"];
  const activeFilter = status ?? "all";

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Session Log" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {filterOptions.map((opt) => (
              <a
                key={opt}
                href={opt === "all" ? "/sessions" : `/sessions?status=${opt}`}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  activeFilter === opt
                    ? "bg-[var(--color-stripe)] text-white border-[var(--color-stripe)]"
                    : "bg-white text-[var(--color-ink-3)] border-[var(--color-line)] hover:border-[var(--color-stripe)]"
                }`}
              >
                {opt === "all" ? "All" : opt.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
              </a>
            ))}
          </div>

          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line-2)]">
                  {["Date", "Scenario", "Actor", "Learner", "Duration", "Amount", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line-2)]">
                {(sessions ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-4)]">
                      No sessions found.
                    </td>
                  </tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (sessions ?? []).map((s: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const scenario = Array.isArray(s.scenarios) ? s.scenarios[0] : s.scenarios as any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const actor = Array.isArray(s.actor) ? s.actor[0] : s.actor as any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const learner = Array.isArray(s.learner) ? s.learner[0] : s.learner as any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const scores = Array.isArray(s.session_scores) ? s.session_scores[0] : s.session_scores as any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const payment = Array.isArray(s.session_payments) ? s.session_payments[0] : s.session_payments as any;

                    const date = new Date(s.scheduled_at);
                    const duration = scores?.duration_actual
                      ? `${Math.floor(scores.duration_actual / 60)}:${String(scores.duration_actual % 60).padStart(2, "0")}`
                      : "—";

                    return (
                      <tr key={s.id} className="hover:bg-[var(--color-chip)] transition-colors">
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)] whitespace-nowrap">
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-ink)] font-medium max-w-[160px] truncate">
                          {scenario?.title ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                          {actor ? `${actor.first_name} ${actor.last_name}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                          {learner ? `${learner.first_name} ${learner.last_name}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)] tabular-nums">
                          {duration}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[var(--color-ink)] tabular-nums">
                          {payment?.amount ? `$${Number(payment.amount).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Pill
                            label={s.status.replace("_", " ").replace(/^\w/, (c: string) => c.toUpperCase())}
                            variant={statusVariant[s.status] ?? "neutral"}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
