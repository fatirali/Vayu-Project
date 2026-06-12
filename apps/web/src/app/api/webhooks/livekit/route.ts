import { NextResponse, type NextRequest } from "next/server";
import { WebhookReceiver, EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";
import { tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import type { postCallPipeline } from "@/trigger/post-call-pipeline";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const authHeader = req.headers.get("Authorization") ?? "";

  // Verify LiveKit webhook signature
  const receiver = new WebhookReceiver(
    process.env["LIVEKIT_API_KEY"]!,
    process.env["LIVEKIT_API_SECRET"]!
  );

  let event: Awaited<ReturnType<typeof receiver.receive>>;
  try {
    event = await receiver.receive(body, authHeader);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Start recording when the room is created and ready
  if (event.event === "room_started") {
    const roomName = event.room?.name ?? "";
    const sessionId = roomName.replace(/^rehearse-/, "");

    if (sessionId && roomName.startsWith("rehearse-")) {
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
        console.log("[livekit webhook] Egress started for room:", roomName);
      } catch (egressErr) {
        console.error("[livekit webhook] Failed to start egress:", egressErr);
      }
    }
  }

  // We care about egress_ended — that's when the recording is complete
  if (event.event === "egress_ended") {
    const egressInfo = event.egressInfo;
    if (!egressInfo) {
      return NextResponse.json({ received: true });
    }

    // Room name is `rehearse-{sessionId}`
    const roomName = egressInfo.roomName ?? "";
    const sessionId = roomName.replace(/^rehearse-/, "");

    if (!sessionId) {
      return NextResponse.json({ received: true });
    }

    // Save recording path to session
    const recordingPath = egressInfo.fileResults?.[0]?.filename ?? null;
    if (recordingPath) {
      const supabase = getServiceClient();
      await supabase
        .from("sessions")
        .update({ recording_path: recordingPath })
        .eq("livekit_room_id", roomName);
    }

    // Enqueue Trigger.dev post-call pipeline
    await tasks.trigger<typeof postCallPipeline>("post-call-pipeline", {
      sessionId,
    });
  }

  return NextResponse.json({ received: true });
}
