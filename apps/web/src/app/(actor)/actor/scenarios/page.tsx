import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

export default async function ActorScenariosPage() {
  await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id, title, category, difficulty, situation")
    .order("title", { ascending: true });

  const categoryVariant: Record<string, "bad" | "warn" | "ld" | "accent"> = {
    termination: "bad",
    feedback: "warn",
    compensation: "ld",
    restructuring: "accent",
  };

  const difficultyLabel: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Scenarios" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {!scenarios || scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-[var(--color-ink-4)]">No scenarios available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-5 py-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                          {scenario.title}
                        </h2>
                        {scenario.category && (
                          <Pill
                            label={scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
                            variant={categoryVariant[scenario.category] ?? "neutral"}
                          />
                        )}
                        {scenario.difficulty && (
                          <span className="text-[10px] text-[var(--color-ink-4)] font-medium">
                            {difficultyLabel[scenario.difficulty] ?? scenario.difficulty}
                          </span>
                        )}
                      </div>
                      {scenario.situation && (
                        <p className="text-xs text-[var(--color-ink-3)] line-clamp-2">
                          {scenario.situation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/actor/playbook/${scenario.id}`}
                        className="text-xs font-medium text-[var(--color-actor)] border border-[var(--color-actor)]/30 px-3 py-1.5 rounded-[var(--radius)] hover:bg-[var(--color-actor-2)] transition-colors"
                      >
                        Playbook
                      </Link>
                      <Link
                        href={`/actor/rules/${scenario.id}`}
                        className="text-xs font-medium text-[var(--color-ink-3)] border border-[var(--color-line)] px-3 py-1.5 rounded-[var(--radius)] hover:bg-[var(--color-chip)] transition-colors"
                      >
                        Rules
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
