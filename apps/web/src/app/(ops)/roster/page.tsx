import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";

export default async function RosterPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch actors with their cert count + Stripe status
  const { data: actors } = await supabase
    .from("users")
    .select(`
      id,
      first_name,
      last_name,
      email,
      approved_at,
      stripe_account_id,
      stripe_payout_enabled,
      actor_certifications (status)
    `)
    .eq("role", "actor")
    .order("created_at", { ascending: true });

  function stripeStatus(actor: {
    stripe_account_id: string | null;
    stripe_payout_enabled: string | null;
    approved_at: string | null;
  }): { label: string; variant: "good" | "accent" | "warn" | "neutral" } {
    if (actor.stripe_payout_enabled === "true") return { label: "Connected", variant: "good" };
    if (actor.stripe_account_id) return { label: "Pending", variant: "warn" };
    if (actor.approved_at) return { label: "Invited", variant: "accent" };
    return { label: "Not approved", variant: "neutral" };
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Actor Roster" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line-2)]">
                  {["Actor", "Email", "Certified scenarios", "Stripe status", "Approved"].map((h) => (
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
                {(actors ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-4)]">
                      No actors yet.
                    </td>
                  </tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (actors ?? []).map((actor: any) => {
                    const certs = Array.isArray(actor.actor_certifications)
                      ? actor.actor_certifications
                      : [];
                    const certifiedCount = certs.filter(
                      (c: { status: string }) => c.status === "certified"
                    ).length;
                    const ss = stripeStatus(actor);
                    return (
                      <tr key={actor.id} className="hover:bg-[var(--color-chip)] transition-colors">
                        <td className="px-4 py-2.5 font-medium text-[var(--color-ink)]">
                          {actor.first_name} {actor.last_name}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)]">{actor.email}</td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                          {certifiedCount}
                        </td>
                        <td className="px-4 py-2.5">
                          <Pill label={ss.label} variant={ss.variant} />
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                          {actor.approved_at
                            ? new Date(actor.approved_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : <Pill label="Pending review" variant="warn" />}
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
