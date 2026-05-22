"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { generateLivekitToken } from "@/lib/livekit";
import { requireAuth } from "@/lib/auth";
import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";

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
  const isNewRoom = !session.livekit_room_id;
  let roomName = session.livekit_room_id;
  if (isNewRoom) {
    roomName = `rehearse-${sessionId}`;
    await supabase
      .from("sessions")
      .update({ livekit_room_id: roomName, status: "live", started_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Start egress (recording) to Supabase S3
    try {
      const egressClient = new EgressClient(
        process.env["NEXT_PUBLIC_LIVEKIT_URL"]!.replace("wss://", "https://"),
        process.env["LIVEKIT_API_KEY"]!,
        process.env["LIVEKIT_API_SECRET"]!
      );

      const fileOutput = new EncodedFileOutput({
        filepath: `${sessionId}.mp4`,
        fileType: EncodedFileType.MP4,
        output: {
          case: "s3",
          value: new S3Upload({
            accessKey: process.env["SUPABASE_S3_ACCESS_KEY"]!,
            secret: process.env["SUPABASE_S3_SECRET_KEY"]!,
            bucket: process.env["SUPABASE_S3_BUCKET"]!,
            region: process.env["SUPABASE_S3_REGION"]!,
            endpoint: `${process.env["NEXT_PUBLIC_SUPABASE_URL"]!}/storage/v1/s3`,
            forcePathStyle: true,
          }),
        },
      });

      await egressClient.startRoomCompositeEgress(roomName, fileOutput);
    } catch (egressErr) {
      // Log but don't block the session — analytics will be skipped if recording fails
      console.error("[joinSession] Failed to start egress:", egressErr);
    }
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
