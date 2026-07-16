"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDebriefStatus } from "./actions";

const POLL_INTERVAL_MS = 4_000;
const TIMEOUT_MS = 5 * 60 * 1_000;

// Staged status lines shown while the pipeline runs. Progress is
// presentational (the pipeline reports no granular progress) — it advances
// through stages over time and caps at 90% until the debrief actually exists.
const STAGES = [
  { at: 0, pct: 12, label: "Uploading recording…" },
  { at: 15_000, pct: 34, label: "Transcribing audio…" },
  { at: 45_000, pct: 58, label: "Mapping objectives…" },
  { at: 90_000, pct: 78, label: "Drafting AI assessment…" },
  { at: 150_000, pct: 90, label: "Finalising your debrief…" },
];

type Props = { sessionId: string };

export function DebriefLoader({ sessionId }: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);
  const startedAt = useRef<number | null>(null);

  // Elapsed ticker drives the staged progress display
  useEffect(() => {
    startedAt.current = Date.now();
    const t = setInterval(
      () => setElapsed(Date.now() - (startedAt.current ?? Date.now())),
      1_000
    );
    return () => clearInterval(t);
  }, []);

  // Poll for debrief readiness
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const { ready: isReady } = await getDebriefStatus(sessionId);
        if (!cancelled && isReady) {
          setReady(true);
          // Brief beat at 100% so the completion registers, then navigate
          setTimeout(() => router.push(`/actor/session/${sessionId}/debrief`), 600);
          return;
        }
      } catch {
        // Transient network error — keep polling
      }
      if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
  }, [sessionId, router]);

  const timedOut = elapsed > TIMEOUT_MS && !ready;
  const stage = [...STAGES].reverse().find((s) => elapsed >= s.at) ?? STAGES[0]!;
  const pct = ready ? 100 : stage.pct;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-10 bg-[rgba(30,28,34,0.42)] backdrop-blur-md">
      <div className="w-full max-w-lg bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-8 pt-8 pb-7 shadow-2xl text-center">
        {timedOut ? (
          <>
            <div className="w-11 h-11 mx-auto mb-4 rounded-full bg-[var(--color-warn-2)] flex items-center justify-center text-[var(--color-warn)] text-lg font-bold">
              !
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-ink)] mb-2">
              Taking longer than usual
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-ink-3)] max-w-sm mx-auto mb-6">
              The AI is still working on your debrief. You can safely leave —
              it will be waiting on your dashboard under{" "}
              <b className="text-[var(--color-ink)] font-semibold">Debrief pending</b>.
            </p>
            <button
              onClick={() => router.push("/actor/dashboard")}
              className="px-5 py-2 bg-[var(--color-actor)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90"
            >
              Back to dashboard
            </button>
          </>
        ) : (
          <>
            <div
              className="w-11 h-11 mx-auto mb-4 rounded-full border-[3px] border-[var(--color-actor-2)] border-t-[var(--color-actor)] animate-spin"
              aria-hidden
            />
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-ink)] mb-2">
              {ready ? "Debrief ready" : "Building your debrief…"}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-ink-3)] max-w-sm mx-auto">
              The AI is analysing the session — transcript, objectives, and the
              moments you flagged. Hang tight; you&apos;ll review its draft
              assessment and{" "}
              <b className="text-[var(--color-ink)] font-semibold">
                add your own comments
              </b>{" "}
              in a moment.
            </p>
            <div className="h-[5px] bg-[var(--color-line-2)] rounded-full overflow-hidden mt-6 mb-3">
              <div
                className="h-full bg-[var(--color-actor)] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-[var(--color-actor)] min-h-[15px]">
              {ready ? "Done — taking you there…" : stage.label}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
