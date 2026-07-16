"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { generateLivekitToken } from "@/lib/livekit";
import { requireAuth } from "@/lib/auth";

export async function actorJoinSession(sessionId: string) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, livekit_room_id, status, actor_id")
    .eq("id", sessionId)
    .eq("actor_id", user.id)
    .single();

  if (error || !session) throw new Error("Session not found");
  if (session.status === "cancelled" || session.status === "completed") {
    throw new Error("Session is no longer active");
  }

  const roomName = session.livekit_room_id ?? `rehearse-${sessionId}`;

  if (!session.livekit_room_id) {
    await supabase
      .from("sessions")
      .update({ livekit_room_id: roomName })
      .eq("id", sessionId);
  }

  const token = await generateLivekitToken({
    roomName,
    participantIdentity: `actor-${user.id}`,
    participantName: `${user.firstName} ${user.lastName}`,
  });

  return {
    token,
    roomName,
    livekitUrl: process.env["NEXT_PUBLIC_LIVEKIT_URL"]!,
  };
}

// Polled by the post-call loading overlay. The debrief row is created by the
// post-call pipeline, so its existence == "AI drafts are ready".
export async function getDebriefStatus(sessionId: string) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  const { data } = await supabase
    .from("actor_debriefs")
    .select("id, status")
    .eq("session_id", sessionId)
    .eq("actor_id", user.id)
    .single();

  return {
    ready: !!data,
    status: (data?.status as "draft" | "submitted" | undefined) ?? null,
  };
}

export async function flagMoment(
  sessionId: string,
  type: "great" | "break" | "note",
  note?: string
) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  // Session-relative timestamp (MM:SS since session start) so flags align
  // with the transcript timeline. Previously stored wall-clock time of day.
  // Scoped to actor_id: the service client bypasses RLS, so without this an
  // authenticated non-participant could inject flags into any session.
  const { data: session } = await supabase
    .from("sessions")
    .select("started_at")
    .eq("id", sessionId)
    .eq("actor_id", user.id)
    .single();

  if (!session) throw new Error("Session not found");

  let timestamp = "00:00";
  if (session?.started_at) {
    const elapsedSec = Math.max(
      0,
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    );
    const m = Math.floor(elapsedSec / 60);
    const s = Math.floor(elapsedSec % 60);
    timestamp = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  await supabase.from("flagged_moments").insert({
    session_id: sessionId,
    flagged_by: user.id,
    type,
    timestamp,
    note: note ?? null,
  });
}
