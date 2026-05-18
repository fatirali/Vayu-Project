"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { generateLivekitToken } from "@/lib/livekit";
import { requireAuth } from "@/lib/auth";

export async function joinSession(sessionId: string): Promise<{
  token: string;
  roomName: string;
  livekitUrl: string;
}> {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  // Verify this session belongs to the learner
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, livekit_room_id, status, learner_id")
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (error || !session) throw new Error("Session not found");
  if (session.status === "cancelled" || session.status === "completed") {
    throw new Error("Session is no longer active");
  }

  // Use or create the LiveKit room name
  let roomName = session.livekit_room_id;
  if (!roomName) {
    roomName = `rehearse-${sessionId}`;
    await supabase
      .from("sessions")
      .update({ livekit_room_id: roomName, status: "live", started_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  const token = await generateLivekitToken({
    roomName,
    participantIdentity: `learner-${user.id}`,
    participantName: `${user.firstName} ${user.lastName}`,
  });

  return {
    token,
    roomName,
    livekitUrl: process.env["NEXT_PUBLIC_LIVEKIT_URL"]!,
  };
}

export async function endSession(sessionId: string): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  await supabase
    .from("sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("learner_id", user.id);
}
