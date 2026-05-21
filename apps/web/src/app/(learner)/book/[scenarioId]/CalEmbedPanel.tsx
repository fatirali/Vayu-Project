"use client";

import { useState } from "react";

type Actor = {
  id: string;
  firstName: string;
  lastName: string;
  calComUsername: string | null;
  rating: number;
  sessionCount: number;
};

type Props = {
  actors: Actor[];
  learnerId: string;
  learnerEmail: string;
  learnerName: string;
  scenarioId: string;
  scenarioTitle: string;
};

export function CalEmbedPanel({
  actors,
  learnerId,
  learnerEmail,
  learnerName,
  scenarioId,
  scenarioTitle,
}: Props) {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(
    actors.length === 1 ? (actors[0]?.id ?? null) : null
  );

  const selectedActor = actors.find((a) => a.id === selectedActorId) ?? null;

  // Cal.com embed URL for the actor's calendar
  // Passes learner name, email, and scenario title as pre-fill params
  const calUrl = selectedActor?.calComUsername
    ? `https://cal.com/${selectedActor.calComUsername}?` +
      new URLSearchParams({
        name: learnerName,
        email: learnerEmail,
        notes: `Rehearse session — ${scenarioTitle}`,
        embed: "true",
        // Passed through to Cal.com webhook metadata so we can create the session
        "metadata[scenarioId]": scenarioId,
        "metadata[learnerId]": learnerId,
        "metadata[actorId]": selectedActor.id,
      }).toString()
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Actor roster */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-4)] mb-3">
          Choose an actor
        </p>
        <div className="space-y-2">
          {actors.length === 0 && (
            <p className="text-sm text-[var(--color-ink-4)] py-4 text-center">
              No certified actors available for this scenario yet.
            </p>
          )}
          {actors.map((actor) => (
            <button
              key={actor.id}
              onClick={() => setSelectedActorId(actor.id)}
              className={`w-full text-left p-3 rounded-[var(--radius-lg)] border transition-all ${
                selectedActorId === actor.id
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-2)]"
                  : "border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-accent)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--color-chip)] flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-[var(--color-ink-3)]">
                    {actor.firstName[0]}{actor.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                    {actor.firstName} {actor.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={actor.rating} />
                    <span className="text-[10px] text-[var(--color-ink-4)]">
                      {actor.sessionCount} sessions
                    </span>
                  </div>
                </div>
                {selectedActorId === actor.id && (
                  <CheckIcon />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cal.com embed or placeholder */}
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden min-h-[500px] flex flex-col">
        {calUrl ? (
          <iframe
            src={calUrl}
            className="w-full flex-1 border-0"
            style={{ minHeight: 520 }}
            title={`Book a session with ${selectedActor?.firstName} ${selectedActor?.lastName}`}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            {actors.length === 0 ? (
              <>
                <div className="w-10 h-10 rounded-full bg-[var(--color-chip)] flex items-center justify-center mb-3">
                  <ActorIcon />
                </div>
                <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
                  No actors available
                </p>
                <p className="text-xs text-[var(--color-ink-4)]">
                  Actors are being certified for this scenario.
                  Check back soon.
                </p>
              </>
            ) : selectedActor && !selectedActor.calComUsername ? (
              <>
                <div className="w-10 h-10 rounded-full bg-[var(--color-chip)] flex items-center justify-center mb-3">
                  <CalendarIcon />
                </div>
                <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
                  Calendar not configured
                </p>
                <p className="text-xs text-[var(--color-ink-4)]">
                  {selectedActor.firstName} hasn&apos;t connected their Cal.com account yet.
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[var(--color-chip)] flex items-center justify-center mb-3">
                  <CalendarIcon />
                </div>
                <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
                  Select an actor to continue
                </p>
                <p className="text-xs text-[var(--color-ink-4)]">
                  Choose an actor from the list to see their availability.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  if (rating === 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-[var(--color-warn)]">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
        <path d="M4.5 0.5L5.59 3.17H8.5L6.27 4.87L7.04 7.83L4.5 6.06L1.96 7.83L2.73 4.87L0.5 3.17H3.41L4.5 0.5Z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-accent)" strokeWidth="2">
      <path d="M2.5 7L5.5 10L11.5 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-ink-4)" strokeWidth="1.5">
      <rect x="2" y="3" width="14" height="13" rx="1.5" />
      <path d="M6 2v2M12 2v2M2 7.5h14" />
    </svg>
  );
}

function ActorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-ink-4)" strokeWidth="1.5">
      <circle cx="9" cy="6.5" r="3" />
      <path d="M2.5 15.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    </svg>
  );
}
