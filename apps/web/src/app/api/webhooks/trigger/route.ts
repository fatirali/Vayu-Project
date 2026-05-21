import { NextResponse } from "next/server";

export async function POST() {
  // TODO M7: handle Trigger.dev pipeline callbacks
  return NextResponse.json({ received: true });
}
