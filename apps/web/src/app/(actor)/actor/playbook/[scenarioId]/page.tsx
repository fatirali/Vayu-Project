import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

export default async function PlaybookPage({ params }: Props) {
  const { scenarioId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  // Verify actor is certified for this scenario
  const { data: cert } = await supabase
    .from("actor_certifications")
    .select("status")
    .eq("actor_id", user.id)
    .eq("scenario_id", scenarioId)
    .single();

  if (!cert) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select(`
      id,
      title,
      pushback_tiers (
        id,
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
    `)
    .eq("id", scenarioId)
    .single();

  if (!scenario) notFound();

  const tiers = (Array.isArray(scenario.pushback_tiers) ? scenario.pushback_tiers : [])
    .sort((a: { level: number }, b: { level: number }) => a.level - b.level);

  const tierConfig: Record<number, {
    label: string;
    variant: "good" | "accent" | "warn" | "bad";
    bg: string;
    border: string;
  }> = {
    0: { label: "Nailed it", variant: "good", bg: "bg-[var(--color-good-2)]", border: "border-[var(--color-good)]" },
    1: { label: "Soft fumble", variant: "accent", bg: "bg-[var(--color-accent-2)]", border: "border-[var(--color-accent)]" },
    2: { label: "Challenge", variant: "warn", bg: "bg-[var(--color-warn-2)]", border: "border-[var(--color-warn)]" },
    3: { label: "Escalated", variant: "bad", bg: "bg-[var(--color-bad-2)]", border: "border-[var(--color-bad)]" },
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: "Dashboard", href: "/actor/dashboard" },
            { label: scenario.title },
            { label: "Pushback playbook" },
          ]}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {tiers.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-4)] text-center py-8">
              No pushback tiers defined for this scenario.
            </p>
          ) : (
            tiers.map((tier: {
              id: string;
              level: number;
              level_label: string;
              trigger: string;
              requires_pre_approval: boolean;
              pushback_responses: { letter: string; text: string; stage_direction: string | null }[];
            }) => {
              const config = tierConfig[tier.level] ?? tierConfig[1]!;
              const responses = Array.isArray(tier.pushback_responses) ? tier.pushback_responses : [];
              return (
                <div
                  key={tier.id}
                  className={`${config.bg} border ${config.border} rounded-[var(--radius-lg)] p-5`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Pill label={tier.level_label} variant={config.variant} />
                    {tier.requires_pre_approval && (
                      <Pill label="Requires L&D approval" variant="warn" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-ink-4)] mb-4">
                    <span className="font-semibold text-[var(--color-ink-3)]">Trigger: </span>
                    {tier.trigger}
                  </p>

                  {responses.length > 0 && (
                    <div className="space-y-3">
                      {responses
                        .sort((a, b) => a.letter.localeCompare(b.letter))
                        .map((resp) => (
                          <div
                            key={resp.letter}
                            className="bg-white border border-[var(--color-line)] rounded-[var(--radius)] p-3"
                          >
                            <div className="flex gap-2.5">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-chip)] text-[10px] font-bold text-[var(--color-ink-3)] flex items-center justify-center">
                                {resp.letter.toUpperCase()}
                              </span>
                              <div>
                                <p className="text-sm text-[var(--color-ink)]">&ldquo;{resp.text}&rdquo;</p>
                                {resp.stage_direction && (
                                  <p className="text-xs italic text-[var(--color-ink-4)] mt-1">
                                    {resp.stage_direction}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
