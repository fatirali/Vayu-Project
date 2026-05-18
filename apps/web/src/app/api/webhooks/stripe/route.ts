import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env["STRIPE_WEBHOOK_SECRET"]!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Actor completes Stripe Connect onboarding
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    // Find actor by stripe_account_id
    const { data: actor } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_account_id", account.id)
      .single();

    if (actor) {
      const payoutsEnabled = account.payouts_enabled ? "true" : "false";
      await supabase
        .from("users")
        .update({ stripe_payout_enabled: payoutsEnabled })
        .eq("id", actor.id);
    }
  }

  return NextResponse.json({ received: true });
}
