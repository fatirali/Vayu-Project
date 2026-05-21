import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { RunPayoutButton } from "./RunPayoutButton";

export default async function PayoutsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const statusVariant: Record<string, "good" | "accent" | "warn" | "bad"> = {
    paid: "good",
    transit: "accent",
    pending: "warn",
    failed: "bad",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[{ label: "Payout History" }]}
          actions={<RunPayoutButton />}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line-2)]">
                  {["Period", "Recipients", "Sessions", "Total paid", "Stripe batch", "Status"].map((h) => (
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
                {(payouts ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-4)]">
                      No payouts yet. The weekly cron runs every Monday.
                    </td>
                  </tr>
                ) : (
                  (payouts ?? []).map((p: {
                    id: string;
                    period_start: string;
                    period_end: string;
                    recipient_count: number;
                    session_count: number;
                    total_amount: number;
                    currency: string;
                    stripe_batch_id: string | null;
                    status: string;
                  }) => (
                    <tr key={p.id} className="hover:bg-[var(--color-chip)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--color-ink-3)] whitespace-nowrap">
                        {new Date(p.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" – "}
                        {new Date(p.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                        {p.recipient_count}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-3)]">
                        {p.session_count}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-[var(--color-ink)] tabular-nums">
                        ${Number(p.total_amount).toFixed(2)} {p.currency}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-4)] font-mono text-[10px]">
                        {p.stripe_batch_id
                          ? p.stripe_batch_id.slice(0, 12) + "…"
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Pill
                          label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          variant={statusVariant[p.status] ?? "neutral"}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
