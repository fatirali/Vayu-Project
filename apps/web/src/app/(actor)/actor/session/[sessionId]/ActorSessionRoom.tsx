"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference, formatChatMessageLinks } from "@livekit/components-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { actorJoinSession, flagMoment } from "./actions";

type Props = { sessionId: string };

type RoomCreds = { token: string; livekitUrl: string };

export function ActorSessionRoom({ sessionId }: Props) {
  const router = useRouter();
  const [creds, setCreds] = useState<RoomCreds | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [showFlagModal, setShowFlagModal] = useState(false);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const result = await actorJoinSession(sessionId);
      setCreds({ token: result.token, livekitUrl: result.livekitUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
      setJoining(false);
    }
  }

  const handleDisconnected = useCallback(() => {
    router.push("/actor/dashboard");
  }, [router]);

  async function handleFlag(type: "great" | "break" | "note") {
    setFlagging(true);
    // Approximate timestamp from elapsed time
    const now = new Date().toTimeString().slice(0, 5);
    await flagMoment(sessionId, type, now, type === "note" ? flagNote : undefined);
    setFlagging(false);
    setShowFlagModal(false);
    setFlagNote("");
  }

  if (creds) {
    return (
      <div className="h-screen relative" style={{ background: "#1a1a1a" }}>
        <LiveKitRoom
          video
          audio
          token={creds.token}
          serverUrl={creds.livekitUrl}
          data-lk-theme="default"
          style={{ height: "100dvh" }}
          onDisconnected={handleDisconnected}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
        </LiveKitRoom>

        {/* Flag moment overlay */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-50">
          <button
            onClick={() => handleFlag("great")}
            disabled={flagging}
            className="px-3 py-1.5 bg-[var(--color-good)] text-white text-xs font-medium rounded-[var(--radius)] shadow-lg hover:opacity-90 disabled:opacity-50"
          >
            ★ Great moment
          </button>
          <button
            onClick={() => setShowFlagModal(true)}
            className="px-3 py-1.5 bg-[var(--color-warn)] text-white text-xs font-medium rounded-[var(--radius)] shadow-lg hover:opacity-90"
          >
            ⚑ Flag moment
          </button>
        </div>

        {/* Flag note modal */}
        {showFlagModal && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[var(--color-paper)] rounded-[var(--radius-lg)] p-4 w-72 shadow-xl">
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Add a note</p>
              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="What happened?"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-warn)] mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleFlag("note")}
                  disabled={flagging}
                  className="flex-1 py-1.5 text-xs font-medium bg-[var(--color-warn)] text-white rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50"
                >
                  Save note
                </button>
                <button
                  onClick={() => { setShowFlagModal(false); setFlagNote(""); }}
                  className="flex-1 py-1.5 text-xs font-medium bg-[var(--color-chip)] text-[var(--color-ink-3)] rounded-[var(--radius)] hover:bg-[var(--color-line)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-ink)]">
      <div className="text-center max-w-sm px-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-actor)] flex items-center justify-center mx-auto mb-4">
          <ActorIcon />
        </div>
        <h2 className="text-white text-base font-semibold mb-1">Ready to perform?</h2>
        <p className="text-[var(--color-ink-4)] text-xs mb-6">
          Check your character brief before joining.
        </p>
        {error && (
          <p className="text-[var(--color-bad)] text-xs bg-[var(--color-bad-2)] px-3 py-2 rounded-[var(--radius)] mb-4">
            {error}
          </p>
        )}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-actor)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition"
        >
          {joining ? "Connecting…" : "Join session"}
        </button>
      </div>
    </div>
  );
}

function ActorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5">
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3 17c0-4 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}
