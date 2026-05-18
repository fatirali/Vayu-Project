import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

export default async function RulesPage({ params }: Props) {
  const { scenarioId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

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
      improv_latitude,
      max_pause_length,
      off_limits_topics,
      stage_rules (
        id,
        type,
        text,
        sort_order
      )
    `)
    .eq("id", scenarioId)
    .single();

  if (!scenario) notFound();

  const allRules = Array.isArray(scenario.stage_rules) ? scenario.stage_rules : [];
  const doRules = allRules
    .filter((r: { type: string }) => r.type === "do")
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  const dontRules = allRules
    .filter((r: { type: string }) => r.type === "dont")
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: "Dashboard", href: "/actor/dashboard" },
            { label: scenario.title },
            { label: "Stage rules" },
          ]}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Do / Don't grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Do */}
            <div className="bg-[var(--color-good-2)] border border-[var(--color-good)] rounded-[var(--radius-lg)] p-5">
              <p className="text-xs font-semibold text-[var(--color-good)] uppercase tracking-wide mb-3">
                Do
              </p>
              {doRules.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-4)]">No do rules.</p>
              ) : (
                <ul className="space-y-2">
                  {doRules.map((rule: { id: string; text: string }) => (
                    <li key={rule.id} className="flex gap-2 text-sm text-[var(--color-ink-2)]">
                      <span className="shrink-0 text-[var(--color-good)] mt-0.5">✓</span>
                      {rule.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Don't */}
            <div className="bg-[var(--color-bad-2)] border border-[var(--color-bad)] rounded-[var(--radius-lg)] p-5">
              <p className="text-xs font-semibold text-[var(--color-bad)] uppercase tracking-wide mb-3">
                Don&apos;t
              </p>
              {dontRules.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-4)]">No don&apos;t rules.</p>
              ) : (
                <ul className="space-y-2">
                  {dontRules.map((rule: { id: string; text: string }) => (
                    <li key={rule.id} className="flex gap-2 text-sm text-[var(--color-ink-2)]">
                      <span className="shrink-0 text-[var(--color-bad)] mt-0.5">✗</span>
                      {rule.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Improv parameters */}
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-4">
              Improv parameters
            </h3>
            <div className="space-y-4">
              {/* Improv latitude slider (display only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-ink-3)]">Improvisation latitude</span>
                  <span className="text-xs font-semibold text-[var(--color-ink)]">
                    {scenario.improv_latitude}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-actor)]"
                    style={{ width: `${scenario.improv_latitude}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[var(--color-ink-4)]">Scripted</span>
                  <span className="text-[10px] text-[var(--color-ink-4)]">Full improv</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-ink-3)]">Max silence before intervention</span>
                <span className="text-xs font-semibold text-[var(--color-ink)]">
                  {scenario.max_pause_length}s
                </span>
              </div>

              {scenario.off_limits_topics && (
                <div>
                  <p className="text-xs font-medium text-[var(--color-ink-3)] mb-1">
                    Off-limits topics
                  </p>
                  <p className="text-sm text-[var(--color-ink-2)]">
                    {scenario.off_limits_topics}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stop session immediately */}
          <div className="bg-[var(--color-warn-2)] border border-[var(--color-warn)] rounded-[var(--radius-lg)] p-5">
            <p className="text-xs font-semibold text-[var(--color-warn)] mb-3">
              Stop the session immediately if:
            </p>
            <ul className="space-y-1.5">
              {[
                "Learner becomes abusive, threatening, or uses discriminatory language",
                "Learner appears genuinely distressed (not just portraying emotion)",
                "Technical failure prevents meaningful engagement",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-xs text-[var(--color-ink-2)]">
                  <span className="shrink-0 text-[var(--color-warn)] mt-0.5">!</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-[var(--color-warn)]">
              <p className="text-xs text-[var(--color-ink-3)]">
                <span className="font-semibold">Safeword:</span>{" "}
                <span className="bg-white px-2 py-0.5 rounded text-[var(--color-warn)] font-mono text-xs">
                  &ldquo;Pause scene&rdquo;
                </span>{" "}
                — both parties may use this to pause without explanation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
