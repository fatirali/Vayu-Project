"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference, formatChatMessageLinks } from "@livekit/components-react";
import { useState, useCallback } from "react";
import { actorJoinSession, flagMoment } from "./actions";
import { DebriefLoader } from "./DebriefLoader";
import type { SceneContext, ArcPhase, PushbackTier } from "./page";

type Props = {
  sessionId: string;
  sceneContext: SceneContext;
};

type RoomCreds = { token: string; livekitUrl: string };
type PanelTab = "arc" | "pushback" | "ref";

const PHASE_COLORS = [
  { ring: "border-[var(--color-accent)]", bg: "bg-[var(--color-accent-2)]", text: "text-[var(--color-accent)]" },
  { ring: "border-[var(--color-warn)]",   bg: "bg-[var(--color-warn-2)]",   text: "text-[var(--color-warn)]"   },
  { ring: "border-[var(--color-bad)]",    bg: "bg-[var(--color-bad-2)]",    text: "text-[var(--color-bad)]"    },
  { ring: "border-[var(--color-actor)]",  bg: "bg-[var(--color-actor-2)]",  text: "text-[var(--color-actor)]"  },
];

const TIER_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  0: { bg: "bg-[var(--color-good-2)]",   border: "border-[var(--color-good)]",   text: "text-[var(--color-good)]",   label: "Nailed it"    },
  1: { bg: "bg-[var(--color-accent-2)]", border: "border-[var(--color-accent)]", text: "text-[var(--color-accent)]", label: "Soft fumble"  },
  2: { bg: "bg-[var(--color-warn-2)]",   border: "border-[var(--color-warn)]",   text: "text-[var(--color-warn)]",   label: "Challenge"    },
  3: { bg: "bg-[var(--color-bad-2)]",    border: "border-[var(--color-bad)]",    text: "text-[var(--color-bad)]",    label: "Escalated"    },
};

export function ActorSessionRoom({ sessionId, sceneContext }: Props) {
  const [creds, setCreds] = useState<RoomCreds | null>(null);
  const [callEnded, setCallEnded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Phase tracker
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("arc");
  const [copied, setCopied] = useState<string | null>(null);

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

  // Call ended → show the AI-analysis loader instead of leaving. The loader
  // polls for the debrief and routes to it when the pipeline finishes.
  const handleDisconnected = useCallback(() => {
    setCallEnded(true);
  }, []);

  async function handleFlag(type: "great" | "break" | "note") {
    setFlagging(true);
    // Timestamp is computed server-side from session started_at
    await flagMoment(sessionId, type, type === "note" ? flagNote : undefined);
    setFlagging(false);
    setShowFlagModal(false);
    setFlagNote("");
  }

  async function copyResponse(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (callEnded) {
    return <DebriefLoader sessionId={sessionId} />;
  }

  if (creds) {
    const maxPhase = sceneContext.arcPhases.length - 1;

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
        <div className="absolute bottom-20 left-4 flex flex-col gap-2 z-50">
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

        {/* Panel toggle */}
        <button
          onClick={() => setShowPanel((v) => !v)}
          className="absolute top-4 right-4 z-50 px-2.5 py-1.5 bg-black/70 text-white text-[11px] font-medium rounded-[var(--radius)] hover:bg-black/90 backdrop-blur-sm"
        >
          {showPanel ? "Hide guide" : "Show guide"}
        </button>

        {/* Scene guide panel */}
        {showPanel && (
          <div className="absolute top-14 right-4 bottom-4 w-72 z-40 flex flex-col bg-white/95 backdrop-blur-sm rounded-[var(--radius-lg)] shadow-2xl overflow-hidden border border-[var(--color-line)]">
            {/* Tabs */}
            <div className="flex border-b border-[var(--color-line)] shrink-0">
              {(["arc", "pushback", "ref"] as PanelTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
                    activeTab === tab
                      ? "text-[var(--color-actor)] border-b-2 border-[var(--color-actor)]"
                      : "text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)]"
                  }`}
                >
                  {tab === "arc" ? "Arc" : tab === "pushback" ? "Pushback" : "Ref"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Arc phase tracker */}
              {activeTab === "arc" && (
                <div className="p-3 space-y-2">
                  {sceneContext.arcPhases.length === 0 ? (
                    <p className="text-xs text-[var(--color-ink-4)] text-center py-4">No arc phases defined.</p>
                  ) : (
                    <>
                      {sceneContext.arcPhases.map((phase: ArcPhase, i: number) => {
                        const colors = PHASE_COLORS[i % PHASE_COLORS.length]!;
                        const isActive = i === currentPhase;
                        const isPast = i < currentPhase;
                        return (
                          <button
                            key={phase.phase_number}
                            onClick={() => setCurrentPhase(i)}
                            className={`w-full text-left rounded-[var(--radius)] border p-3 transition-all ${
                              isActive
                                ? `${colors.bg} ${colors.ring} shadow-sm`
                                : isPast
                                ? "bg-[var(--color-chip)] border-transparent opacity-60"
                                : "bg-white border-[var(--color-line-2)] hover:border-[var(--color-line)]"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isActive ? `${colors.bg} ${colors.text}` : "bg-[var(--color-chip)] text-[var(--color-ink-4)]"
                              }`}>
                                {phase.phase_number}
                              </span>
                              <span className={`text-xs font-semibold ${isActive ? colors.text : "text-[var(--color-ink-3)]"}`}>
                                {phase.name}
                              </span>
                              {phase.duration_estimate && (
                                <span className="ml-auto text-[10px] text-[var(--color-ink-4)]">{phase.duration_estimate}</span>
                              )}
                            </div>
                            {isActive && (
                              <div className="space-y-0.5 pl-7">
                                <p className="text-[11px] text-[var(--color-ink-3)]">
                                  <span className="font-medium">Feel:</span> {phase.emotion}
                                </p>
                                <p className="text-[11px] text-[var(--color-ink-3)]">
                                  <span className="font-medium">Stance:</span> {phase.stance}
                                </p>
                                <p className="text-[11px] text-[var(--color-ink-4)] italic mt-1">
                                  Move on when: {phase.moves_on_when}
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setCurrentPhase((p) => Math.max(0, p - 1))}
                          disabled={currentPhase === 0}
                          className="flex-1 py-1.5 text-[11px] font-medium bg-[var(--color-chip)] text-[var(--color-ink-3)] rounded-[var(--radius)] hover:bg-[var(--color-line)] disabled:opacity-40"
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => setCurrentPhase((p) => Math.min(maxPhase, p + 1))}
                          disabled={currentPhase === maxPhase}
                          className="flex-1 py-1.5 text-[11px] font-medium bg-[var(--color-actor)] text-white rounded-[var(--radius)] hover:opacity-90 disabled:opacity-40"
                        >
                          Next phase →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Pushback bank */}
              {activeTab === "pushback" && (
                <div className="p-3 space-y-3">
                  {sceneContext.pushbackTiers.length === 0 ? (
                    <p className="text-xs text-[var(--color-ink-4)] text-center py-4">No pushback tiers defined.</p>
                  ) : (
                    sceneContext.pushbackTiers.map((tier: PushbackTier) => {
                      const colors = TIER_COLORS[tier.level] ?? TIER_COLORS[1]!;
                      return (
                        <div key={tier.level} className={`${colors.bg} border ${colors.border} rounded-[var(--radius)] p-3`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>
                              {tier.level_label}
                            </span>
                            {tier.requires_pre_approval && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-warn)] bg-[var(--color-warn-2)] px-1.5 py-0.5 rounded-full">
                                L&D approval
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--color-ink-4)] mb-2 italic">{tier.trigger}</p>
                          <div className="space-y-1.5">
                            {tier.pushback_responses.map((resp) => {
                              const key = `${tier.level}-${resp.letter}`;
                              return (
                                <button
                                  key={resp.letter}
                                  onClick={() => copyResponse(resp.text, key)}
                                  className="w-full text-left bg-white border border-[var(--color-line)] rounded-[var(--radius)] p-2 hover:shadow-sm transition-all group"
                                >
                                  <div className="flex gap-2">
                                    <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--color-chip)] text-[9px] font-bold text-[var(--color-ink-3)] flex items-center justify-center">
                                      {resp.letter.toUpperCase()}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] text-[var(--color-ink)] leading-relaxed">&ldquo;{resp.text}&rdquo;</p>
                                      {resp.stage_direction && (
                                        <p className="text-[10px] italic text-[var(--color-ink-4)] mt-0.5">{resp.stage_direction}</p>
                                      )}
                                    </div>
                                    <span className={`shrink-0 text-[9px] font-semibold mt-0.5 ${copied === key ? "text-[var(--color-good)]" : "text-[var(--color-ink-4)] group-hover:text-[var(--color-ink-3)]"}`}>
                                      {copied === key ? "✓" : "Copy"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Quick ref */}
              {activeTab === "ref" && (
                <div className="p-3 space-y-3">
                  {/* Safeword */}
                  <div className="bg-[var(--color-bad-2)] border border-[var(--color-bad)] rounded-[var(--radius)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-bad)] mb-1">Safeword</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">&ldquo;Pause scene&rdquo;</p>
                    <p className="text-[10px] text-[var(--color-ink-4)] mt-1">Either party can say this to pause the session.</p>
                  </div>

                  {/* Emotional state */}
                  {sceneContext.emotionalState && (
                    <div className="bg-[var(--color-warn-2)] border border-[var(--color-warn)] rounded-[var(--radius)] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-warn)] mb-1">Your emotional state</p>
                      <p className="text-xs text-[var(--color-ink-2)]">{sceneContext.emotionalState}</p>
                    </div>
                  )}

                  {/* Don&apos;t list */}
                  {sceneContext.dontList.length > 0 && (
                    <div className="bg-white border border-[var(--color-line)] rounded-[var(--radius)] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-4)] mb-2">Never do</p>
                      <ul className="space-y-1">
                        {sceneContext.dontList.map((item: string, i: number) => (
                          <li key={i} className="text-[11px] text-[var(--color-ink-2)] flex gap-1.5">
                            <span className="text-[var(--color-bad)] shrink-0">✕</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Allowed facts */}
                  {sceneContext.allowedFacts.length > 0 && (
                    <div className="bg-[var(--color-good-2)] border border-[var(--color-good)] rounded-[var(--radius)] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-good)] mb-2">Allowed facts to share</p>
                      <ul className="space-y-1">
                        {sceneContext.allowedFacts.map((fact: string, i: number) => (
                          <li key={i} className="text-[11px] text-[var(--color-ink-2)] flex gap-1.5">
                            <span className="text-[var(--color-good)] shrink-0">✓</span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!sceneContext.emotionalState && sceneContext.dontList.length === 0 && sceneContext.allowedFacts.length === 0 && (
                    <p className="text-xs text-[var(--color-ink-4)] text-center py-4">No reference data defined for this scenario.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
        <p className="text-[var(--color-ink-4)] text-xs mb-1">
          {sceneContext.scenarioTitle || "Practice session"}
        </p>
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
