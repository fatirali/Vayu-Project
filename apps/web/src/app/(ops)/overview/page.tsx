import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shell/TopBar";
import { KPICard } from "@/components/ui/KPICard";
import { Pill } from "@/components/ui/Pill";

export default async function OverviewPage() {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // KPI: sessions this month
  const { count: sessionsThisMonth } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", firstOfMonth);

  // KPI: pending session payments
  const { count: pendingPayments } = await supabase
    .from("session_payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // KPI: paid MTD
  const { data: paidMtd } = await supabase
    .from("session_payments")
    .select("amount")
    .eq("status", "paid")
    .gte("created_at" as string, firstOfMonth);

  const paidTotal = (paidMtd ?? []).reduce(
    (sum: number, row: { amount: number }) => sum + Number(row.amount),
    0
  );

  // Recent payouts
  const { data: recentPayouts } = await supabase
    .from("payouts")
    .select("id, period_start, period_end, total_amount, session_count, status, stripe_batch_id")
    .order("created_at", { ascending: false })
    .limit(5);

  const payoutStatusVariant: Record<string, "good" | "accent" | "warn" | "bad"> = {
    paid: "good",
    transit: "accent",
    pending: "warn",
    failed: "bad",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar breadcrumbs={[{ label: "Payments Overview" }]} />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Paid MTD" value={`$${paidTotal.toFixed(2)}`} unit="CAD" />
            <KPICard label="Pending payout" value={pendingPayments ?? 0} unit="sessions" />
            <KPICard label="Sessions this month" value={sessionsThisMonth ?? 0} />
            <KPICard label="Flagged payments" value={0} />
          </div>

          {/* Stripe Connect banner */}
          <div className="bg-[var(--color-stripe-2)] border border-[var(--color-stripe)] rounded-[var(--radius-lg)] px-4 py-3 flex items-center gap-3">
            <StripeIcon />
            <div>
              <p className="text-xs font-semibold text-[var(--color-stripe)]">
                Stripe Connect · Standard accounts
              </p>
              <p className="text-xs text-[var(--color-ink-3)]">
                Weekly payouts run every Monday at 00:00 UTC via Vercel Cron.
              </p>
            </div>
          </div>

          {/* Recent payouts */}
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-line-2)] flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">
                Recent payouts
              </h3>
              <a
                href="/payouts"
                className="text-xs text-[var(--color-stripe)] hover:underline"
              >
                View all
              </a>
            </div>
            {(recentPayouts ?? []).length === 0 ? (
              <p className="px-4 py-6 text-xs text-[var(--color-ink-4)] text-center">
                No payouts yet.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-line-2)]">
                    {["Period", "Sessions", "Total", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-4)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line-2)]">
                  {(recentPayouts ?? []).map((p: {
                    id: string;
                    period_start: string;
                    period_end: string;
                    total_amount: number;
                    session_count: number;
                    status: string;
                  }) => (
                    <tr key={p.id} className="hover:bg-[var(--color-chip)]">
                      <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                        {new Date(p.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" – "}
                        {new Date(p.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-3)]">{p.session_count}</td>
                      <td className="px-4 py-2.5 font-medium text-[var(--color-ink)]">
                        ${Number(p.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Pill
                          label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          variant={payoutStatusVariant[p.status] ?? "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StripeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="var(--color-stripe)" />
      <path
        d="M9.2 7.6c0-.7.6-1 1.6-1 1.4 0 2.8.5 3.8 1.2V4.4C13.4 3.8 12 3.5 10.8 3.5 7.9 3.5 6 5 6 7.7c0 4.2 5.6 3.5 5.6 5.3 0 .8-.7 1.1-1.7 1.1-1.5 0-3-.6-4.1-1.5v3.4c1.1.6 2.5.9 4.1.9 3 0 5-.5 5-3.3-.1-4.4-5.7-3.7-5.7-5z"
        fill="white"
      />
    </svg>
  );
}
