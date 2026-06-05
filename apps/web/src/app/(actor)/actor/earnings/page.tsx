import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";

export default async function ActorEarningsPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: payments } = await supabase
    .from("session_payments")
    .select(`
      id,
      amount,
      currency,
      status,
      created_at,
      session:sessions!session_payments_session_id_fkey (
        scheduled_at,
        scenarios (
          title,
          category
        )
      )
    `)
    .eq("actor_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (payments ?? []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (Array.isArray(p.session) ? p.session[0] : p.session) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scenario = session ? (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any : null;
    return {
      id: p.id,
      amount: Number(p.amount),
      currency: (p.currency ?? "CAD").toUpperCase(),
      status: p.status as "pending" | "paid",
      createdAt: p.created_at,
      scheduledAt: session?.scheduled_at ?? null,
      scenarioTitle: scenario?.title ?? "Session",
    };
  });

  const pending = rows.filter((r) => r.status === "pending");
  const paid = rows.filter((r) => r.status === "paid");

  const totalLifetime = paid.reduce((s, r) => s + r.amount, 0);
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessionsThisMonth = rows.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= startOfMonth;
  }).length;

  const hasStripe = false; // Stripe Connect managed manually at this stage

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Earnings" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Lifetime earned" value={formatMoney(totalLifetime)} />
            <StatCard label="Pending payout" value={formatMoney(totalPending)} highlight={totalPending > 0} />
            <StatCard label="Sessions this month" value={String(sessionsThisMonth)} />
          </div>

          {/* Payout info */}
          {!hasStripe && (
            <div className="bg-[var(--color-warn-2)] border border-[var(--color-warn)] rounded-[var(--radius-lg)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--color-warn)] mb-0.5">Payouts via Stripe Connect</p>
              <p className="text-xs text-[var(--color-ink-3)]">
                The Rehearse team will set up your payout account directly. Payments run every Monday for the prior week&apos;s completed sessions.
              </p>
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
                Pending ({pending.length})
              </h2>
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-chip)]">
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Date</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Scenario</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--color-line)] last:border-0">
                        <td className="px-4 py-3 text-xs text-[var(--color-ink-3)]">
                          {formatDate(row.scheduledAt ?? row.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-[var(--color-ink)]">
                          {row.scenarioTitle}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-ink)]">
                          {formatMoney(row.amount)}
                          <span className="ml-1 text-[10px] font-normal text-[var(--color-ink-4)]">{row.currency}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Paid history */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
              Payment history
            </h2>
            {paid.length === 0 ? (
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-4 py-8 text-center">
                <p className="text-sm text-[var(--color-ink-4)]">No payments yet.</p>
                <p className="text-xs text-[var(--color-ink-4)] mt-1">
                  Completed sessions are paid out every Monday.
                </p>
              </div>
            ) : (
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-chip)]">
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Date</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Scenario</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Amount</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.map((row, i) => (
                      <tr key={row.id} className={`border-b border-[var(--color-line)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-chip)]/30"}`}>
                        <td className="px-4 py-3 text-xs text-[var(--color-ink-3)]">
                          {formatDate(row.scheduledAt ?? row.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-[var(--color-ink)]">
                          {row.scenarioTitle}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-ink)]">
                          {formatMoney(row.amount)}
                          <span className="ml-1 text-[10px] font-normal text-[var(--color-ink-4)]">{row.currency}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[11px] font-medium text-[var(--color-good)]">Paid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-[var(--color-paper)] border rounded-[var(--radius-lg)] p-4 ${highlight ? "border-[var(--color-actor)]/40" : "border-[var(--color-line)]"}`}>
      <p className="text-[11px] text-[var(--color-ink-4)] mb-1">{label}</p>
      <p className={`text-xl font-semibold ${highlight ? "text-[var(--color-actor)]" : "text-[var(--color-ink)]"}`}>
        {value}
      </p>
    </div>
  );
}

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
