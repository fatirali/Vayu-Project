"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReflection } from "./actions";

type QuestionKey = "feel" | "hardest" | "wentWell" | "differently";

type Question = {
  key: QuestionKey;
  label: string;
  q: string;
  help: string;
  placeholder: string;
  required?: boolean;
  chips?: string[];
};

// Ported from the offline prototype (JOURNAL_Q). "feel" is required; the rest
// are optional prompts to help the learner surface a gut read before feedback.
const QUESTIONS: Question[] = [
  {
    key: "feel",
    label: "How it felt",
    q: "How did that feel?",
    help: "First gut read, before you overthink it.",
    placeholder: "e.g. shakier than I hoped, but I got through it",
    required: true,
    chips: [
      "Better than expected",
      "About what I expected",
      "Harder than I thought",
      "Still processing",
    ],
  },
  {
    key: "hardest",
    label: "Hardest moment",
    q: "What felt hardest in the moment?",
    help: "The point where you noticed yourself struggle.",
    placeholder: "e.g. when he pushed back and I started explaining too much",
  },
  {
    key: "wentWell",
    label: "Went well",
    q: "What went better than you expected?",
    help: "Give yourself credit where it's due.",
    placeholder: "e.g. I stayed calm when the conversation got tense",
  },
  {
    key: "differently",
    label: "Next time",
    q: "What would you do differently next time?",
    help: "One concrete thing, while it's fresh.",
    placeholder: "e.g. state the decision up front instead of burying it",
  },
];

type Props = { sessionId: string };

export function ReflectionForm({ sessionId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<QuestionKey, string>>({
    feel: "",
    hardest: "",
    wentWell: "",
    differently: "",
  });

  const set = (key: QuestionKey, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const canSubmit = answers.feel.trim().length > 0 && !pending;

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await saveReflection(sessionId, {
          feel: answers.feel,
          hardest: answers.hardest,
          wentWell: answers.wentWell,
          differently: answers.differently,
        });
        router.push(`/analytics/${sessionId}`);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Something went wrong. Please try again."
        );
      }
    });
  }

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-[10px] bg-[var(--color-accent)] text-white grid place-items-center font-bold text-lg">
            ✎
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-ink)]">
              Take a minute to reflect
            </h1>
            <p className="text-[13px] text-[var(--color-ink-3)] mt-0.5">
              Jot this down before you see any feedback — you&apos;ll compare it
              against the analytics in a moment.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {QUESTIONS.map((question) => (
          <div
            key={question.key}
            className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
          >
            <label
              htmlFor={`refl-${question.key}`}
              className="block text-[13px] font-medium text-[var(--color-ink)]"
            >
              {question.q}
              {question.required && (
                <span className="text-[var(--color-accent)]"> *</span>
              )}
            </label>
            <p className="text-[11px] text-[var(--color-ink-4)] mt-0.5">
              {question.help}
            </p>

            {question.chips && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {question.chips.map((chip) => {
                  const active = answers[question.key] === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => set(question.key, chip)}
                      className={`px-2.5 py-1 rounded-full text-[12px] border transition-colors ${
                        active
                          ? "text-[var(--color-accent)] border-[var(--color-accent)] bg-[var(--color-accent-2)]"
                          : "text-[var(--color-ink-3)] border-[var(--color-line)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}

            <textarea
              id={`refl-${question.key}`}
              value={answers[question.key]}
              onChange={(e) => set(question.key, e.target.value)}
              placeholder={question.placeholder}
              rows={2}
              className="mt-2.5 w-full resize-y rounded-[8px] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-[13px] text-[var(--color-bad)]">{error}</p>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[12px] text-[var(--color-ink-4)]">
          {answers.feel.trim()
            ? "Your feedback is ready when you are."
            : "Answer the first question to continue."}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 rounded-[8px] text-[13px] font-medium bg-[var(--color-accent)] text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Saving…" : "Save & see feedback"}
        </button>
      </div>
    </div>
  );
}
