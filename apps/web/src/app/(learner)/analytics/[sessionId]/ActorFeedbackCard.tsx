"use client";

import { useState } from "react";

type Rating = "red" | "yellow" | "green";
type Verdict = "ready" | "almost" | "not_yet";

export type FeedbackItem = {
  objectiveId: string;
  number: number;
  title: string;
  aiNote: string | null;
  actorComment: string | null;
  rating: Rating | null; // actor's final rating — the human call
};

type Props = {
  actorFirstName: string;
  verdict: Verdict | null;
  items: FeedbackItem[];
};

const RATING_META: Record<Rating, { label: string; pill: string; dot: string; order: number }> = {
  green: {
    label: "Strong",
    pill: "text-[var(--color-good)] border-[var(--color-good)] bg-[var(--color-good-2)]",
    dot: "bg-[var(--color-good)]",
    order: 0,
  },
  yellow: {
    label: "Refine",
    pill: "text-[var(--color-warn)] border-[var(--color-warn)] bg-[var(--color-warn-2)]",
    dot: "bg-[var(--color-warn)]",
    order: 1,
  },
  red: {
    label: "Focus",
    pill: "text-[var(--color-bad)] border-[var(--color-bad)] bg-[var(--color-bad-2)]",
    dot: "bg-[var(--color-bad)]",
    order: 2,
  },
};

const VERDICT_META: Record<Verdict, { badge: string; badgeClass: string; note: string }> = {
  ready: {
    badge: "Ready",
    badgeClass: "text-[var(--color-good)] border-[var(--color-good)]",
    note: "Your actor's overall call: you could run this conversation for real.",
  },
  almost: {
    badge: "Refine",
    badgeClass: "text-[var(--color-warn)] border-[var(--color-warn)]",
    note: "Close — your actor's read is that one or two more rehearsals would land it.",
  },
  not_yet: {
    badge: "Not yet",
    badgeClass: "text-[var(--color-bad)] border-[var(--color-bad)]",
    note: "Your actor's read: this needs meaningful work before the real thing. The notes below show exactly where.",
  },
};

type Filter = "all" | "strengths" | "focus";

export function ActorFeedbackCard({ actorFirstName, verdict, items }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");

  const counts = { green: 0, yellow: 0, red: 0 };
  for (const i of items) if (i.rating) counts[i.rating]++;

  const sorted = [...items].sort((a, b) => {
    const oa = a.rating ? RATING_META[a.rating].order : 3;
    const ob = b.rating ? RATING_META[b.rating].order : 3;
    return oa - ob || a.number - b.number;
  });

  const visible = sorted.filter((i) => {
    if (filter === "all") return true;
    if (filter === "strengths") return i.rating === "green";
    return i.rating === "yellow" || i.rating === "red";
  });

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const initial = actorFirstName.charAt(0).toUpperCase() || "A";

  return (
    <div className="bg-[var(--color-paper)] border border-[var(--color-actor)] rounded-[var(--radius-lg)] p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-actor)] text-white flex items-center justify-center font-bold text-base shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Feedback from <span className="text-[var(--color-actor)]">{actorFirstName}</span> — the
            actor who played your counterpart
          </p>
          <p className="text-xs text-[var(--color-ink-3)] leading-relaxed mt-0.5 max-w-xl">
            Ada&apos;s AI drafted these notes from the transcript. {actorFirstName} reviewed every
            one and added what only the person across from you could catch — how the conversation
            actually felt from the other seat.
          </p>
        </div>
        <span className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-actor)] border border-[var(--color-actor)] bg-[var(--color-actor-2)] rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-actor)]" />
          human-reviewed
        </span>
      </div>

      {/* Verdict banner */}
      {verdict && (
        <div className="flex items-center gap-3.5 mt-4 px-4 py-3 border border-dashed border-[var(--color-actor)] rounded-[var(--radius)] bg-[var(--color-actor-2)]">
          <span
            className={`shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wider bg-[var(--color-paper)] border rounded-full px-3 py-1 ${VERDICT_META[verdict].badgeClass}`}
          >
            {VERDICT_META[verdict].badge}
          </span>
          <p className="text-xs leading-relaxed text-[var(--color-ink-2)]">
            {VERDICT_META[verdict].note}
          </p>
        </div>
      )}

      {/* Counts + filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 mb-2.5">
        <div className="flex gap-1.5">
          {(
            [
              ["all", "All"],
              ["strengths", "Strengths"],
              ["focus", "Focus areas"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`font-mono text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                filter === key
                  ? "bg-[var(--color-actor-2)] text-[var(--color-actor)] border-[var(--color-actor)] font-medium"
                  : "bg-[var(--color-paper)] text-[var(--color-ink-3)] border-[var(--color-line)] hover:border-[var(--color-ink-4)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] text-[var(--color-ink-4)]">
          <span className="text-[var(--color-good)]">
            {counts.green} strength{counts.green !== 1 ? "s" : ""}
          </span>{" "}
          ·{" "}
          <span className="text-[var(--color-warn)]">{counts.yellow} to refine</span> ·{" "}
          <span className="text-[var(--color-bad)]">
            {counts.red} focus area{counts.red !== 1 ? "s" : ""}
          </span>
        </p>
      </div>

      {/* Accordion */}
      <div className="border border-[var(--color-line)] rounded-[var(--radius)] overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-4 py-5 text-xs text-[var(--color-ink-4)] text-center">
            Nothing in this filter.
          </p>
        ) : (
          visible.map((item, idx) => {
            const open = openIds.has(item.objectiveId);
            const meta = item.rating ? RATING_META[item.rating] : null;
            return (
              <div
                key={item.objectiveId}
                className={idx > 0 ? "border-t border-[var(--color-line-2)]" : ""}
              >
                <button
                  onClick={() => toggle(item.objectiveId)}
                  className={`w-full grid grid-cols-[90px_1fr_20px] items-center gap-3.5 px-4 py-3 text-left transition-colors ${
                    open ? "bg-[var(--color-bg)]" : "hover:bg-[var(--color-bg)]"
                  }`}
                >
                  {meta ? (
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border justify-self-start ${meta.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--color-ink)] leading-snug">
                      {item.title}
                    </span>
                    {!open && (item.aiNote || item.actorComment) && (
                      <span className="block text-[11.5px] text-[var(--color-ink-3)] mt-0.5 truncate">
                        {item.aiNote ?? item.actorComment}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[var(--color-ink-4)] text-xs text-center transition-transform ${open ? "rotate-90" : ""}`}
                  >
                    ▸
                  </span>
                </button>

                {open && (
                  <div className="px-4 pb-4 pl-[122px]">
                    <div className="mt-1">
                      <p className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--color-accent)] mb-1">
                        Ada&apos;s read
                      </p>
                      <p className="text-xs leading-relaxed text-[var(--color-ink-2)]">
                        {item.aiNote ?? (
                          <span className="italic text-[var(--color-ink-4)]">
                            No AI note for this objective.
                          </span>
                        )}
                      </p>
                    </div>
                    {item.actorComment && (
                      <div className="mt-3 px-3.5 py-2.5 bg-[var(--color-actor-2)] border-l-[3px] border-[var(--color-actor)] rounded-r-[var(--radius)]">
                        <p className="text-xs leading-relaxed text-[var(--color-ink-2)] italic">
                          &ldquo;{item.actorComment}&rdquo;
                        </p>
                        <p className="font-mono text-[10px] text-[var(--color-actor)] mt-1.5">
                          — {actorFirstName}, in the room with you
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
