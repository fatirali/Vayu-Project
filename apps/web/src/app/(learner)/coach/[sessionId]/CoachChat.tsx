"use client";

import { useState, useEffect, useRef } from "react";
import { submitActorRating } from "./actions";

type Quote = { timestamp: string; speaker: string; text: string };
type Message = { role: "user" | "assistant"; content: string; quotes?: Quote[]; suggestions?: string[] };

type Props = {
  sessionId: string;
  hasRating: boolean;
};

export function CoachChat({ sessionId, hasRating }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(hasRating);
  const [hoverRating, setHoverRating] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-trigger Ada's opening message on mount
  useEffect(() => {
    sendMessage([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(history: Message[], userText?: string) {
    const newHistory: Message[] = userText
      ? [...history, { role: "user" as const, content: userText }]
      : history;

    if (userText) setMessages(newHistory);
    setLoading(true);

    // Build messages array for API (strip UI-only fields)
    const apiMessages = newHistory.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`/api/coach/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json() as { message: string; quotes: Quote[]; suggestions: string[] };

      const assistantMsg: Message = {
        role: "assistant",
        content: data.message ?? "",
        quotes: data.quotes ?? [],
        suggestions: data.suggestions ?? [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(messages, text);
  }

  async function handleRating(rating: number) {
    await submitActorRating(sessionId, rating);
    setRatingSubmitted(true);
  }

  const showRatingPanel = messages.some((m) => m.role === "assistant") && !ratingSubmitted;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[70%] bg-[var(--color-accent)] text-white rounded-[var(--radius-lg)] rounded-tr-sm px-4 py-2.5 text-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-[var(--color-accent-2)] border border-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--color-accent)]">A</span>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] rounded-tl-sm px-4 py-3 text-sm text-[var(--color-ink-2)] leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Transcript quotes */}
                  {msg.quotes && msg.quotes.length > 0 && (
                    <div className="space-y-2">
                      {msg.quotes.map((q, qi) => (
                        <blockquote
                          key={qi}
                          className="border-l-2 border-[var(--color-accent)] pl-3 py-1 bg-[var(--color-accent-2)] rounded-r-[var(--radius-md)]"
                        >
                          <p className="text-xs text-[var(--color-ink-2)] italic">&ldquo;{q.text}&rdquo;</p>
                          <p className="text-[10px] text-[var(--color-ink-4)] mt-0.5">
                            {q.speaker === "learner" ? "You" : "Actor"} · {q.timestamp}
                          </p>
                        </blockquote>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((s, si) => (
                        <span
                          key={si}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-warn-2)] text-[var(--color-warn)] text-[11px] font-medium"
                        >
                          <span className="text-[9px] font-bold uppercase tracking-wider">Try</span>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Thinking skeleton */}
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent-2)] border border-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-[var(--color-accent)]">A</span>
            </div>
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-4)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-4)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-4)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Actor rating panel — shown after first Ada message */}
        {showRatingPanel && (
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 max-w-sm">
            <p className="text-sm font-medium text-[var(--color-ink)] mb-1">Rate your actor</p>
            <p className="text-xs text-[var(--color-ink-4)] mb-3">How realistic and helpful was their performance?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= (hoverRating || 0) ? "var(--color-warn)" : "var(--color-chip)"}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-[var(--color-line)] px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask Ada a follow-up question…"
            disabled={loading}
            className="flex-1 text-sm bg-[var(--color-chip)] border border-[var(--color-line)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-[var(--radius-md)] disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
