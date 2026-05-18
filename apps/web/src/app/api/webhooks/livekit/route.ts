import { NextResponse } from "next/server";

export async function POST() {
  // TODO M6: verify LiveKit signature, enqueue Trigger.dev job
  return NextResponse.json({ received: true });
}
