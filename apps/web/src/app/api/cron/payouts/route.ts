import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
}

function getStripe() {
  return new Stripe(process.env["STRIPE_SECRET_KEY"]!);
}

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return runPayouts();
}

// Also allow manual trigger from ops portal
export async function POST(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return runPayouts();
}

async function runPayouts() {
  const supabase = getServiceClient();
  const stripe = getStripe();

  // Find pending session payments where actor has Stripe payout enabled
  const { data: pendingPayments } = await supabase
    .from("session_payments")
    .select(`
      id,
      actor_id,
      session_id,
      amount,
      currency,
      actor:users!session_payments_actor_id_fkey (
        stripe_account_id,
        stripe_payout_enabled
      )
    `)
    .eq("status", "pending");

  if (!pendingPayments || pendingPayments.length === 0) {
    return NextResponse.json({ ok: true, paid: 0, skipped: 0 });
  }

  // Group by actor
  const byActor: Record<string, typeof pendingPayments> = {};
  for (const payment of pendingPayments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actor = (Array.isArray(payment.actor) ? payment.actor[0] : payment.actor) as any;
    if (!actor?.stripe_account_id || actor?.stripe_payout_enabled !== "true") continue;
    byActor[payment.actor_id] = byActor[payment.actor_id] ?? [];
    byActor[payment.actor_id]!.push(payment);
  }

  const now = new Date();
  const periodEnd = now.toISOString().slice(0, 10);
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let totalPaid = 0;
  let sessionCount = 0;
  const transferIds: string[] = [];

  for (const [actorId, payments] of Object.entries(byActor)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actor = (Array.isArray(payments[0]!.actor) ? payments[0]!.actor[0] : payments[0]!.actor) as any;
    const stripeAccountId = actor?.stripe_account_id as string;

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const amountCents = Math.round(totalAmount * 100);

    if (amountCents < 100) continue; // Minimum $1 payout

    try {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "cad",
        destination: stripeAccountId,
        description: `Rehearse actor payout ${periodStart} to ${periodEnd}`,
        metadata: {
          actor_id: actorId,
          session_ids: payments.map((p) => p.session_id).join(","),
        },
      });

      transferIds.push(transfer.id);
      totalPaid += totalAmount;
      sessionCount += payments.length;

      // Mark session payments as paid
      await supabase
        .from("session_payments")
        .update({ status: "paid" })
        .in("id", payments.map((p) => p.id));
    } catch (err) {
      console.error(`Stripe transfer failed for actor ${actorId}:`, err);
    }
  }

  // Create payout record
  if (sessionCount > 0) {
    await supabase.from("payouts").insert({
      period_start: periodStart,
      period_end: periodEnd,
      recipient_count: Object.keys(byActor).length,
      session_count: sessionCount,
      total_amount: totalPaid.toFixed(2),
      currency: "CAD",
      stripe_batch_id: transferIds.join(","),
      status: "paid",
    });

    await supabase.from("audit_log").insert({
      action: "payout.completed",
      metadata: {
        period_start: periodStart,
        period_end: periodEnd,
        total_amount: totalPaid,
        session_count: sessionCount,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    paid: sessionCount,
    total: totalPaid,
    skipped: (pendingPayments.length ?? 0) - sessionCount,
  });
}
