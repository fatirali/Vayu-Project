import { NextResponse } from "next/server";

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // TODO M11: run 30-day A/V retention deletion logic
  return NextResponse.json({ ok: true });
}
