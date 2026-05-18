import { NextResponse } from "next/server";

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // TODO M10: run weekly payout logic
  return NextResponse.json({ ok: true });
}
