import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

export default async function ActorDashboardPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  // Upcoming sessions for this actor
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      status,
      scenarios (
        title,
        category,
        difficulty,
        slug
      ),
      learner:users!sessions_learner_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("actor_id", user.id)
    .in("status", ["booked", "confirmed", "live"])
    .order("scheduled_at", { ascending: true })
    .limit(10);

  // Certification count
  const { count: certCount } = await supabase
    .from("actor_certifications")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", user.id)
    .eq("status", "certified");

  // Completed sessions count
  const { count: completedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", user.id)
    .eq("status", "completed");

  // No-show count
  const { count: noShowCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", user.id)
    .eq("status", "no_show");

  // Average actor rating (learner ratings on completed sessions)
  const { data: ratingRows } = await supabase
    .from("sessions")
    .select("actor_rating")
    .eq("actor_id", user.id)
    .not("actor_rating", "is", null);

  const ratings = (ratingRows ?? []).map((r) => r.actor_rating as number).filter(Boolean);
  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  const totalFinished = (completedCount ?? 0) + (noShowCount ?? 0);
  const noShowRate = totalFinished > 0
    ? Math.round(((noShowCount ?? 0) / totalFinished) * 100)
    : null;

  const isNewActor = (certCount ?? 0) === 0 && (completedCount ?? 0) === 0;

  const now = new Date();
  const todaySessions = (sessions ?? []).filter((s) => {
    const d = new Date(s.scheduled_at);
    return d.toDateString() === now.toDateString();
  });
  const upcomingSessions = (sessions ?? []).filter((s) => {
    const d = new Date(s.scheduled_at);
    return d.toDateString() !== now.toDateString();
  });

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Dashboard" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
            {/* Session list */}
            <div className="space-y-6">
              {isNewActor && (
                <div className="bg-[var(--color-paper)] border border-[var(--color-actor)]/30 rounded-[var(--radius-lg)] p-5">
                  <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">Welcome to the Actor Portal</p>
                  <p className="text-xs text-[var(--color-ink-3)] mb-4">
                    Here&apos;s what happens next before sessions start appearing.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-actor)]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-[var(--color-actor)]">1</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-ink)]">Application review</p>
                        <p className="text-[11px] text-[var(--color-ink-4)]">Our team will review your profile within 2 business days.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-actor)]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-[var(--color-actor)]">2</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-ink)]">Scenario certification</p>
                        <p className="text-[11px] text-[var(--color-ink-4)]">Once approved, you&apos;ll be certified on one or more scenarios by our L&D team.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-actor)]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-[var(--color-actor)]">3</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-ink)]">Sessions appear here</p>
                        <p className="text-[11px] text-[var(--color-ink-4)]">When learners book sessions with you, they&apos;ll show up on this dashboard.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {todaySessions.length > 0 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-actor)] mb-3">
                    Today
                  </p>
                  <div className="space-y-2">
                    {todaySessions.map((s) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                  {todaySessions.length > 0 ? "Upcoming" : "Your sessions"}
                </p>
                {upcomingSessions.length === 0 && todaySessions.length === 0 ? (
                  <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-4 py-8 text-center">
                    <p className="text-sm text-[var(--color-ink-4)]">
                      No upcoming sessions.
                    </p>
                    <p className="text-xs text-[var(--color-ink-4)] mt-1">
                      Sessions booked by learners will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingSessions.map((s) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Stats sidebar */}
            <div className="space-y-4">
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                  Your stats
                </p>
                <div className="space-y-3">
                  <StatRow label="Sessions completed" value={String(completedCount ?? 0)} />
                  <StatRow label="Scenarios certified" value={String(certCount ?? 0)} />
                  {avgRating !== null && (
                    <StatRow label="Avg learner rating" value={`${avgRating} / 5`} />
                  )}
                  {noShowRate !== null && (
                    <StatRow label="No-show rate" value={`${noShowRate}%`} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SessionCard({ session }: { session: any }) {
  const scheduled = new Date(session.scheduled_at);
  const scenario = Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios;
  const learner = Array.isArray(session.learner) ? session.learner[0] : session.learner;

  const isLive = session.status === "live";

  const dayNum = scheduled.getDate();
  const month = scheduled.toLocaleString("en-US", { month: "short" });
  const time = scheduled.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const categoryVariant: Record<string, "bad" | "warn" | "ld" | "accent"> = {
    termination: "bad",
    feedback: "warn",
    compensation: "ld",
    restructuring: "accent",
  };

  return (
    <Link
      href={`/actor/brief/${session.id}`}
      className={`flex items-center gap-3 bg-[var(--color-paper)] border rounded-[var(--radius-lg)] px-4 py-3 hover:shadow-sm transition-all ${
        isLive
          ? "border-[var(--color-actor)] ring-1 ring-[var(--color-actor)]"
          : "border-[var(--color-line)] hover:border-[var(--color-actor)]"
      }`}
    >
      {/* Date block */}
      <div className="shrink-0 w-10 text-center">
        <p className="text-lg font-bold text-[var(--color-ink)] leading-none">{dayNum}</p>
        <p className="text-[10px] text-[var(--color-ink-4)] uppercase">{month}</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-[var(--color-ink)] truncate">
            {scenario?.title ?? "Session"}
          </p>
          {isLive && <Pill label="Live" variant="actor" />}
        </div>
        <p className="text-xs text-[var(--color-ink-4)]">
          {learner
            ? `${learner.first_name} ${learner.last_name}`
            : "Learner"}{" "}
          · {time}
        </p>
        {scenario?.category && (
          <div className="flex items-center gap-1.5 mt-1">
            <Pill
              label={scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
              variant={categoryVariant[scenario.category] ?? "neutral"}
            />
          </div>
        )}
      </div>

      {isLive && (
        <span className="shrink-0 text-xs font-semibold text-[var(--color-actor)]">
          Join →
        </span>
      )}
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--color-ink-3)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-ink)]">{value}</span>
    </div>
  );
}
