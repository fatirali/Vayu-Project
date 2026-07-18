import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { DebriefForm } from "./DebriefForm";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export type DebriefAssessment = {
  id: string;
  objectiveId: string;
  objectiveNumber: number;
  objectiveText: string;
  objectiveWeight: number;
  aiRating: "red" | "yellow" | "green" | null;
  aiNote: string | null;
  actorRating: "red" | "yellow" | "green" | null;
  actorComment: string | null;
};

export type DebriefData = {
  debriefId: string;
  status: "draft" | "submitted";
  verdict: "ready" | "almost" | "not_yet" | null;
  learnerName: string;
  scenarioTitle: string;
  sessionDate: string;
  durationSeconds: number | null;
  flaggedCount: number;
  assessments: DebriefAssessment[];
};

export default async function ActorDebriefPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  // Session scoped to this actor — also gives us recap data
  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      learner_id,
      scenarios ( title, objectives ( id, number, text, weight ) ),
      session_scores ( duration_actual )
    `)
    .eq("id", sessionId)
    .eq("actor_id", user.id)
    .single();

  if (!session) notFound();

  const { data: debrief } = await supabase
    .from("actor_debriefs")
    .select(`
      id, status, verdict,
      debrief_assessments ( id, objective_id, ai_rating, ai_note, actor_rating, actor_comment )
    `)
    .eq("session_id", sessionId)
    .eq("actor_id", user.id)
    .single();

  // Pipeline hasn't produced the debrief yet
  if (!debrief) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-[var(--color-actor-2)] border-t-[var(--color-actor)] animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
          Your debrief is still being prepared
        </h2>
        <p className="text-xs text-[var(--color-ink-4)] max-w-xs mb-4">
          The AI is analysing the session. This usually takes 1–3 minutes after
          the call ends — refresh, or come back from your dashboard.
        </p>
        <Link
          href="/actor/dashboard"
          className="text-xs font-medium text-[var(--color-actor)] hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const { data: learner } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", session.learner_id)
    .single();

  const { count: flaggedCount } = await supabase
    .from("flagged_moments")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = (Array.isArray(session.session_scores) ? session.session_scores[0] : session.session_scores) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectives: any[] = Array.isArray(scenario?.objectives) ? scenario.objectives : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAssessments: any[] = Array.isArray(debrief.debrief_assessments)
    ? debrief.debrief_assessments
    : [];

  const assessments: DebriefAssessment[] = objectives
    .sort((a, b) => a.number - b.number)
    .map((obj) => {
      const a = rawAssessments.find((r) => r.objective_id === obj.id);
      return {
        id: a?.id ?? "",
        objectiveId: obj.id,
        objectiveNumber: obj.number,
        objectiveText: obj.text,
        objectiveWeight: obj.weight,
        aiRating: a?.ai_rating ?? null,
        aiNote: a?.ai_note ?? null,
        actorRating: a?.actor_rating ?? null,
        actorComment: a?.actor_comment ?? null,
      };
    })
    .filter((a) => a.id !== "");

  const data: DebriefData = {
    debriefId: debrief.id,
    status: debrief.status as "draft" | "submitted",
    verdict: debrief.verdict as DebriefData["verdict"],
    learnerName: learner ? `${learner.first_name} ${learner.last_name}` : "Learner",
    scenarioTitle: scenario?.title ?? "Session",
    sessionDate: session.scheduled_at,
    durationSeconds: scores?.duration_actual ?? null,
    flaggedCount: flaggedCount ?? 0,
    assessments,
  };

  return <DebriefForm data={data} />;
}
