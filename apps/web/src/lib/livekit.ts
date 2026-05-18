import { AccessToken } from "livekit-server-sdk";

/**
 * Generates a LiveKit access token for a participant joining a room.
 * Server-only — never call from client components.
 */
export async function generateLivekitToken({
  roomName,
  participantIdentity,
  participantName,
  canPublish = true,
  canSubscribe = true,
}: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
}): Promise<string> {
  const apiKey = process.env["LIVEKIT_API_KEY"];
  const apiSecret = process.env["LIVEKIT_API_SECRET"];

  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: "2h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
    canPublishData: true,
  });

  return at.toJwt();
}
