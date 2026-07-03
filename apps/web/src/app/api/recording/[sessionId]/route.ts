import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServiceClient();

  // Verify this session belongs to the learner and get the recording path
  const { data: session } = await supabase
    .from("sessions")
    .select("recording_path")
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (!session?.recording_path) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  // Generate a signed URL valid for 1 hour
  const { data, error } = await supabase.storage
    .from("recordings")
    .createSignedUrl(session.recording_path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
