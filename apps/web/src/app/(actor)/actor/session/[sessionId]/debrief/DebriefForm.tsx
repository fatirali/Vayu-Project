"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveAssessment, saveVerdict, submitDebrief } from "./actions";
import type { DebriefData } from "./page";

type Rating = "red" | "yellow" | "green";
type Verdict = "ready" | "almost" | "not_yet";

const RATING_STYLES: Record<Rating, { on: string; label: string }> = {
  red: {
    on: "bg-[var(--color-bad-2)] text-[var(--color-bad)] border-[var(--color-bad)] font-semibold",
    label: "Red",
  },
  yellow: {
    on: "bg-[var(--color-warn-2)] text-[var(--color-warn)] border-[var(--color-warn)] font-semibold",
    label: "Yellow",
  },
  green: {
    on: "bg-[var(--color-good-2)] text-[var(--color-good)] border-[var(--color-good)] font-semibold",
    label: "Green",
  },
};

const VERDICTS: Array<{ value: Verdict; title: string; desc: string }> = [
  { value: "ready", title: "Ready", desc: "Could run this conversation for real tomorrow." },
  { value: "almost", title: "Almost", desc: "Close — one or two more rehearsals would land it." },
  { value: "not_yet", title: "Not yet", desc: "Needs meaningful work before the real thing." },
];

function formatDuration(secs: number | null) {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DebriefForm({ data }: { data: DebriefData }) {
  const router = useRouter();
  const readOnly = data.status === "submitted";

  const [ratings, setRatings] = useState<Record<string, Rating | null>>(
    Object.fromEntries(data.assessments.map((a) => [a.id, a.actorRating]))
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(data.assessments.map((a) => [a.id, a.actorComment ?? ""]))
  );
  const [verdict, setVerdict] = useState<Verdict | null>(data.verdict);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Unflushed edits, keyed by assessment id. Submit flushes these first so a
  // comment typed just before clicking Submit can't be lost to the debounce.
  const dirtyComments = useRef<Record<string, string>>({});
  const dirtyRatings = useRef<Record<string, Rating>>({});

  const flashSaved = useCallback(() => {
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  function setRating(assessmentId: string, rating: Rating) {
    if (readOnly) return;
    setRatings((prev) => ({ ...prev, [assessmentId]: rating }));
    dirtyRatings.current[assessmentId] = rating;
    setSaving(true);
    saveAssessment(data.debriefId, assessmentId, { actorRating: rating })
      .then(() => {
        // Only clear the dirty flag if the value didn't change mid-flight
        if (dirtyRatings.current[assessmentId] === rating) {
          delete dirtyRatings.current[assessmentId];
        }
        flashSaved();
      })
      .catch(() => setSaving(false));
  }

  function setComment(assessmentId: string, text: string) {
    if (readOnly) return;
    setComments((prev) => ({ ...prev, [assessmentId]: text }));
    dirtyComments.current[assessmentId] = text;
    // Debounced autosave — one timer per assessment
    clearTimeout(debounceTimers.current[assessmentId]);
    debounceTimers.current[assessmentId] = setTimeout(() => {
      setSaving(true);
      saveAssessment(data.debriefId, assessmentId, { actorComment: text })
        .then(() => {
          if (dirtyComments.current[assessmentId] === text) {
            delete dirtyComments.current[assessmentId];
          }
          flashSaved();
        })
        .catch(() => setSaving(false));
    }, 900);
  }

  function pickVerdict(v: Verdict) {
    if (readOnly) return;
    setVerdict(v);
    setSaving(true);
    saveVerdict(data.debriefId, v).then(flashSaved).catch(() => setSaving(false));
  }

  async function handleSubmit() {
    if (!verdict) {
      setSubmitError("Choose an overall verdict before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Flush unsaved edits before locking the debrief — otherwise a comment
      // typed within the debounce window would be rejected post-submit.
      Object.values(debounceTimers.current).forEach(clearTimeout);
      const pending: Promise<void>[] = [];
      for (const [id, text] of Object.entries(dirtyComments.current)) {
        pending.push(saveAssessment(data.debriefId, id, { actorComment: text }));
      }
      for (const [id, rating] of Object.entries(dirtyRatings.current)) {
        pending.push(saveAssessment(data.debriefId, id, { actorRating: rating }));
      }
      await Promise.all(pending);
      dirtyComments.current = {};
      dirtyRatings.current = {};

      await submitDebrief(data.debriefId);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/actor/dashboard"
            className="text-xs text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)]"
          >
            ← Dashboard
          </Link>
          <span className="text-sm font-semibold text-[var(--color-ink)]">Session debrief</span>
          {readOnly && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-good)] bg-[var(--color-good-2)] px-2 py-0.5 rounded-full">
              Submitted
            </span>
          )}
        </div>
        {!readOnly && (
          <span className="text-[11px] text-[var(--color-ink-4)] font-mono min-w-[60px] text-right">
            {saving ? "Saving…" : savedFlash ? "✓ Saved" : ""}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Recap bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius)]">
            <RecapItem label="Learner" value={data.learnerName} />
            <RecapDivider />
            <RecapItem label="Scenario" value={data.scenarioTitle} />
            <RecapDivider />
            <RecapItem label="Duration" value={formatDuration(data.durationSeconds)} />
            <RecapDivider />
            <RecapItem label="Date" value={formatDate(data.sessionDate)} />
            <RecapDivider />
            <RecapItem label="Flagged moments" value={String(data.flaggedCount)} />
          </div>

          {/* AI banner */}
          <div className="flex gap-3 items-start px-4 py-3.5 border border-dashed border-[var(--color-actor)] rounded-[var(--radius)] bg-[var(--color-actor-2)]">
            <span className="text-lg leading-tight text-[var(--color-actor)]">✦</span>
            <p className="text-xs leading-relaxed text-[var(--color-ink-2)]">
              <b className="text-[var(--color-actor)] font-semibold">Ada drafted this assessment</b>{" "}
              from the transcript and the moments you flagged live. Review each
              objective — agree, override the rating, and add your own read.
              Your judgment is the final call. Nothing reaches the learner until
              you submit.
            </p>
          </div>

          {/* Assessment cards */}
          <div className="space-y-4">
            {data.assessments.map((a) => {
              const currentRating = ratings[a.id] ?? null;
              return (
                <div
                  key={a.id}
                  className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] px-5 py-4"
                >
                  {/* Title + RYG */}
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="text-sm font-semibold text-[var(--color-ink)] leading-snug">
                      <span className="text-[var(--color-ink-4)] font-mono text-[11px] mr-2">
                        {a.objectiveNumber}.
                      </span>
                      {a.objectiveText}
                      <span className="ml-2 text-[10px] font-normal text-[var(--color-ink-4)]">
                        {a.objectiveWeight}%
                      </span>
                    </p>
                    <div className="flex gap-1 shrink-0">
                      {(Object.keys(RATING_STYLES) as Rating[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRating(a.id, r)}
                          disabled={readOnly}
                          className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide rounded-full border transition-all ${
                            currentRating === r
                              ? RATING_STYLES[r].on
                              : "bg-[var(--color-bg)] text-[var(--color-ink-4)] border-[var(--color-line)] hover:border-[var(--color-ink-4)]"
                          } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {RATING_STYLES[r].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI draft */}
                  <div className="mt-3 px-3.5 py-3 bg-[var(--color-bg)] border border-[var(--color-line-2)] rounded-[var(--radius)]">
                    <p className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[var(--color-ink-4)] mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[var(--color-actor)] bg-[var(--color-actor-2)] border border-[var(--color-actor)] rounded px-1.5 py-px">
                        ✦ AI draft
                      </span>
                      {a.aiRating && (
                        <span>suggested: {a.aiRating}</span>
                      )}
                    </p>
                    <p className="text-xs leading-relaxed text-[var(--color-ink-2)]">
                      {a.aiNote ?? (
                        <span className="italic text-[var(--color-ink-4)]">
                          AI draft unavailable for this session — assess from your own read.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Your take */}
                  <div className="mt-3">
                    <p className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[var(--color-ink-3)] mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-actor)]" />
                      Your take
                    </p>
                    {readOnly ? (
                      <p className="text-xs leading-relaxed text-[var(--color-ink-2)] px-3.5 py-2.5 bg-[var(--color-bg)] rounded-[var(--radius)]">
                        {comments[a.id] || (
                          <span className="italic text-[var(--color-ink-4)]">No commentary added.</span>
                        )}
                      </p>
                    ) : (
                      <textarea
                        value={comments[a.id]}
                        onChange={(e) => setComment(a.id, e.target.value)}
                        placeholder="What did you feel in the room? Anything the transcript can't show…"
                        rows={2}
                        maxLength={4000}
                        className="w-full px-3 py-2 text-xs leading-relaxed bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius)] resize-y min-h-[58px] focus:outline-none focus:border-[var(--color-actor)] focus:ring-[3px] focus:ring-[var(--color-actor-2)] placeholder:text-[var(--color-ink-4)]"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verdict */}
          <div className="border border-[var(--color-actor)] bg-[var(--color-actor-2)] rounded-[var(--radius-lg)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-1">Overall verdict</h3>
            <p className="text-[11px] text-[var(--color-ink-3)] mb-3">
              If this had been the real conversation, where does the learner stand?
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {VERDICTS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => pickVerdict(v.value)}
                  disabled={readOnly}
                  className={`text-left px-3.5 py-3 rounded-[var(--radius)] border bg-[var(--color-paper)] transition-all ${
                    verdict === v.value
                      ? "border-[var(--color-actor)] ring-2 ring-[var(--color-actor)]"
                      : "border-[var(--color-line)] hover:border-[var(--color-actor)]"
                  } ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
                >
                  <p className={`text-[13px] font-bold ${verdict === v.value ? "text-[var(--color-actor)]" : "text-[var(--color-ink)]"}`}>
                    {v.title}
                  </p>
                  <p className="text-[10.5px] text-[var(--color-ink-3)] mt-0.5 leading-snug">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          {!readOnly && (
            <div className="flex items-center justify-end gap-3 pb-8">
              {submitError && (
                <p className="text-xs text-[var(--color-bad)]">{submitError}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-[var(--color-actor)] text-white text-sm font-semibold rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? "Submitting…" : "Submit debrief"}
              </button>
            </div>
          )}

          {readOnly && (
            <p className="text-xs text-[var(--color-ink-4)] text-center pb-8">
              This debrief was submitted and shared with the learner and L&amp;D team.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecapItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-px">
      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-[var(--color-ink)]">{value}</span>
    </div>
  );
}

function RecapDivider() {
  return <div className="w-px self-stretch bg-[var(--color-line)] hidden sm:block" />;
}
