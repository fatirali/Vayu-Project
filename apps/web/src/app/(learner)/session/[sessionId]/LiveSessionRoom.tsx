"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
  useToken,
} from "@livekit/components-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { joinSession, endSession } from "./actions";

type Props = {
  sessionId: string;
};

type RoomCredentials = {
  token: string;
  roomName: string;
  livekitUrl: string;
};

export function LiveSessionRoom({ sessionId }: Props) {
  const router = useRouter();
  const [creds, setCreds] = useState<RoomCredentials | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const result = await joinSession(sessionId);
      setCreds(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join session");
      setJoining(false);
    }
  }

  const handleDisconnected = useCallback(async () => {
    if (ended) return;
    setEnded(true);
    await endSession(sessionId);
    router.push(`/analytics/${sessionId}`);
  }, [ended, sessionId, router]);

  if (ended) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-ink)]">
        <div className="text-center">
          <p className="text-white text-sm mb-2">Session ended</p>
          <p className="text-[var(--color-ink-4)] text-xs">
            Redirecting to your analytics…
          </p>
        </div>
      </div>
    );
  }

  if (creds) {
    return (
      <div className="h-screen" style={{ background: "#1a1a1a" }}>
        <LiveKitRoom
          video
          audio
          token={creds.token}
          serverUrl={creds.livekitUrl}
          data-lk-theme="default"
          style={{ height: "100dvh" }}
          onDisconnected={handleDisconnected}
        >
          <VideoConference
            chatMessageFormatter={formatChatMessageLinks}
          />
        </LiveKitRoom>
      </div>
    );
  }

  // Pre-join screen
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-ink)]">
      <div className="text-center max-w-sm px-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-4">
          <VideoIcon />
        </div>
        <h2 className="text-white text-base font-semibold mb-1">
          Ready to rehearse?
        </h2>
        <p className="text-[var(--color-ink-4)] text-xs mb-6">
          Your actor is waiting. Make sure your camera and microphone are on.
        </p>

        {error && (
          <p className="text-[var(--color-bad)] text-xs bg-[var(--color-bad-2)] px-3 py-2 rounded-[var(--radius)] mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={joining}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition"
        >
          {joining ? (
            <>
              <span className="animate-spin">⟳</span>
              Connecting…
            </>
          ) : (
            "Join session"
          )}
        </button>
      </div>
    </div>
  );
}

// Token-only hook export for actor side (not used here, but exported for reuse)
export { useToken };

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5">
      <rect x="1.5" y="5" width="12" height="10" rx="1.5" />
      <path d="M13.5 8.5L18.5 6v8L13.5 11.5" />
    </svg>
  );
}
