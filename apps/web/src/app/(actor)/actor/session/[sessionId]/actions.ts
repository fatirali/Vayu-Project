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

export async function flagMoment(
  sessionId: string,
  type: "great" | "break" | "note",
  timestamp: string,
  note?: string
) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  await supabase.from("flagged_moments").insert({
    session_id: sessionId,
    flagged_by: user.id,
    type,
    timestamp,
    note: note ?? null,
  });
}
