import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

export default async function SessionsPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      status,
      scenarios (
        title,
        category,
        slug
      ),
      actor:users!sessions_actor_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("learner_id", user.id)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  const now = new Date();

  const upcoming = (sessions ?? []).filter(
    (s) => new Date(s.scheduled_at) >= now && s.status !== "cancelled"
  );
  const past = (sessions ?? []).filter(
    (s) => new Date(s.scheduled_at) < now || s.status === "completed" || s.status === "cancelled"
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Sessions" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Upcoming */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
              Upcoming
            </p>
            {upcoming.length === 0 ? (
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-4 py-8 text-center">
                <p className="text-sm text-[var(--color-ink-4)]">No upcoming sessions.</p>
                <Link
                  href="/library"
                  className="inline-block mt-3 text-xs font-medium text-[var(--color-accent)] hover:underline"
                >
                  Browse the scenario library →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                Past sessions
              </p>
              <div className="space-y-2">
                {past.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SessionCard({ session }: { session: any }) {
  const scenario = Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios;
  const actor = Array.isArray(session.actor) ? session.actor[0] : session.actor;
  const scheduled = new Date(session.scheduled_at);

  const dayNum = scheduled.getDate();
  const month = scheduled.toLocaleString("en-US", { month: "short" });
  const time = scheduled.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isLive = session.status === "live";
  const isCompleted = session.status === "completed";
  const isCancelled = session.status === "cancelled";

  const statusVariant: Record<string, "good" | "warn" | "bad" | "neutral" | "accent"> = {
    booked: "neutral",
    confirmed: "accent",
    live: "good",
    completed: "good",
    cancelled: "bad",
    no_show: "bad",
  };

  const categoryVariant: Record<string, "bad" | "warn" | "accent" | "ld"> = {
    termination: "bad",
    feedback: "warn",
    compensation: "ld",
    restructuring: "accent",
  };

  // Determine the CTA href
  let href = `/brief/${session.id}`;
  if (isLive) href = `/session/${session.id}`;
  if (isCompleted) href = `/analytics/${session.id}`;

  return (
    <Link
      href={isCancelled ? "#" : href}
      className={`flex items-center gap-3 bg-[var(--color-paper)] border rounded-[var(--radius-lg)] px-4 py-3 transition-all ${
        isCancelled
          ? "border-[var(--color-line)] opacity-50 cursor-default"
          : isLive
          ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] hover:shadow-sm"
          : "border-[var(--color-line)] hover:border-[var(--color-accent)] hover:shadow-sm"
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
          <Pill
            label={session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            variant={statusVariant[session.status] ?? "neutral"}
          />
          {isLive && <Pill label="Live" variant="accent" />}
        </div>
        <p className="text-xs text-[var(--color-ink-4)]">
          {actor ? `${actor.first_name} ${actor.last_name}` : "Actor"} · {time}
        </p>
        {scenario?.category && (
          <div className="mt-1">
            <Pill
              label={scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
              variant={categoryVariant[scenario.category] ?? "neutral"}
            />
          </div>
        )}
      </div>

      {!isCancelled && (
        <span className="shrink-0 text-xs font-medium text-[var(--color-accent)]">
          {isLive ? "Join →" : isCompleted ? "Analytics →" : "View brief →"}
        </span>
      )}
    </Link>
  );
}
