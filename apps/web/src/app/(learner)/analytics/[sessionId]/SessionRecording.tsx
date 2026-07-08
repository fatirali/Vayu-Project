"use client";

import { useState, useEffect } from "react";

export function SessionRecording({ sessionId }: { sessionId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/recording/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setUrl(data.url);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-line-2)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">
            Session Recording
          </h3>
        </div>
        <div className="flex items-center justify-center h-40">
          <p className="text-xs text-[var(--color-ink-4)]">Loading recording…</p>
        </div>
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-line-2)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">
            Session Recording
          </h3>
        </div>
        <div className="flex items-center justify-center h-40">
          <p className="text-xs text-[var(--color-ink-4)]">Recording not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-line-2)]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)]">
          Session Recording
        </h3>
      </div>
      {url.includes(".ogg") ? (
        // Audio-only recordings (current format — see livekit webhook)
        <div className="px-4 py-6">
          <audio src={url} controls className="w-full" />
        </div>
      ) : (
        // Legacy video recordings
        <video
          src={url}
          controls
          className="w-full"
          style={{ maxHeight: 360, background: "#1a1a1a" }}
        />
      )}
    </div>
  );
}
