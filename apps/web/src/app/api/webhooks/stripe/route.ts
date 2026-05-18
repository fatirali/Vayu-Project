import { NextResponse } from "next/server";

export async function POST() {
  // TODO M10: verify Stripe signature, update actor Stripe status
  return NextResponse.json({ received: true });
}
