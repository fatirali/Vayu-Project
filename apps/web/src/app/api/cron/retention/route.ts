import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
}

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getServiceClient();

  // Find sessions with recordings older than 30 days not yet deleted
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, recording_path")
    .not("recording_path", "is", null)
    .lt("ended_at", cutoff)
    .is("recording_deleted_at", null);

  if (error) {
    console.error("Retention cron DB error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let deleted = 0;
  let failed = 0;

  for (const session of sessions ?? []) {
    if (!session.recording_path) continue;

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("recordings")
      .remove([session.recording_path]);

    if (storageError) {
      console.error(`Failed to delete recording for session ${session.id}:`, storageError);
      failed++;
      continue;
    }

    // Mark as deleted
    await supabase
      .from("sessions")
      .update({
        recording_deleted_at: new Date().toISOString(),
        recording_path: null,
      })
      .eq("id", session.id);

    // Audit log
    await supabase.from("audit_log").insert({
      action: "recording.deleted",
      target_type: "session",
      target_id: session.id,
      metadata: { reason: "30-day retention policy" },
    });

    deleted++;
  }

  // Log cron run
  await supabase.from("audit_log").insert({
    action: "retention.cron.completed",
    metadata: {
      deleted,
      failed,
      cutoff,
      run_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ ok: true, deleted, failed });
}
