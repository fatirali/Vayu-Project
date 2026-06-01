import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { ActorSessionRoom } from "./ActorSessionRoom";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export type ArcPhase = {
  phase_number: number;
  name: string;
  emotion: string;
  stance: string;
  moves_on_when: string;
  duration_estimate: string | null;
};

export type PushbackResponse = {
  letter: string;
  text: string;
  stage_direction: string | null;
};

export type PushbackTier = {
  level: number;
  level_label: string;
  trigger: string;
  requires_pre_approval: boolean;
  pushback_responses: PushbackResponse[];
};

export type SceneContext = {
  scenarioTitle: string;
  arcPhases: ArcPhase[];
  pushbackTiers: PushbackTier[];
  emotionalState: string | null;
  dontList: string[];
  allowedFacts: string[];
};

export default async function ActorSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      scenarios (
        title,
        personas (
          emotional_state,
          dont_list,
          allowed_facts
        ),
        dramatic_arc_phases (
          phase_number,
          name,
          emotion,
          stance,
          moves_on_when,
          duration_estimate
        ),
        pushback_tiers (
          level,
          level_label,
          trigger,
          requires_pre_approval,
          pushback_responses (
            letter,
            text,
            stage_direction
          )
        )
      )
    `)
    .eq("id", sessionId)
    .eq("actor_id", user.id)
    .single();

  if (!session) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const persona = scenario ? (Array.isArray(scenario.personas) ? scenario.personas[0] : scenario.personas) as any : null;

  const arcPhases: ArcPhase[] = (Array.isArray(scenario?.dramatic_arc_phases) ? scenario.dramatic_arc_phases : [])
    .sort((a: ArcPhase, b: ArcPhase) => a.phase_number - b.phase_number);

  const pushbackTiers: PushbackTier[] = (Array.isArray(scenario?.pushback_tiers) ? scenario.pushback_tiers : [])
    .sort((a: PushbackTier, b: PushbackTier) => a.level - b.level)
    .map((t: PushbackTier) => ({
      ...t,
      pushback_responses: Array.isArray(t.pushback_responses)
        ? [...t.pushback_responses].sort((a, b) => a.letter.localeCompare(b.letter))
        : [],
    }));

  const sceneContext: SceneContext = {
    scenarioTitle: scenario?.title ?? "",
    arcPhases,
    pushbackTiers,
    emotionalState: persona?.emotional_state ?? null,
    dontList: persona?.dont_list ?? [],
    allowedFacts: persona?.allowed_facts ?? [],
  };

  return <ActorSessionRoom sessionId={sessionId} sceneContext={sceneContext} />;
}
