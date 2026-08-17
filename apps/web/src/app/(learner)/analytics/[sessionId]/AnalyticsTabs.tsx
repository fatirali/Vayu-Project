"use client";

import { useState, type ReactNode } from "react";

type Tab = "overview" | "reflection" | "transcript";

type Props = {
  overview: ReactNode;
  reflection: ReactNode;
  transcript: ReactNode;
};

export function AnalyticsTabs({ overview, reflection, transcript }: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <div className="flex gap-0.5 border-b border-[var(--color-line)] mb-5">
        {(
          [
            ["overview", "Overview"],
            ["reflection", "My reflection"],
            ["transcript", "Transcript"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
              tab === key
                ? "text-[var(--color-accent)] border-[var(--color-accent)]"
                : "text-[var(--color-ink-3)] border-transparent hover:text-[var(--color-ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={tab === "overview" ? "" : "hidden"}>{overview}</div>
      <div className={tab === "reflection" ? "" : "hidden"}>{reflection}</div>
      <div className={tab === "transcript" ? "" : "hidden"}>{transcript}</div>
    </div>
  );
}
