import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { CoachChat } from "./CoachChat";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function CoachPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      analytics_ready,
      actor_rating,
      learner_id,
      scenarios ( title )
    `)
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (!session) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;

  if (!session.analytics_ready) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
          <TopBar breadcrumbs={[{ label: "Analytics", href: `/analytics/${sessionId}` }, { label: "Coach" }]} />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-2)] flex items-center justify-center mx-auto mb-3">
              <span className="text-sm font-bold text-[var(--color-accent)]">A</span>
            </div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
              Analytics not ready yet
            </h2>
            <p className="text-xs text-[var(--color-ink-4)]">
              Ada needs your session transcript before she can coach you.
              Come back once analytics are ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: scenario?.title ?? "Session", href: `/analytics/${sessionId}` },
            { label: "Coach with Ada" },
          ]}
        />
      </header>

      <CoachChat
        sessionId={sessionId}
        hasRating={!!session.actor_rating}
      />
    </div>
  );
}
