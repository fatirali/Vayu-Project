import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

type Message = { role: "user" | "assistant"; content: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  // Fetch session context
  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id,
      analytics_ready,
      learner_id,
      scenarios (
        title,
        objectives ( number, text, weight )
      ),
      session_scores ( overall_score, filler_count, pace_wpm, talk_ratio, duration_actual ),
      topic_coverage ( objective_id, status, covered_at ),
      transcript_lines ( timestamp, speaker, text )
    `)
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.analytics_ready) {
    return NextResponse.json({ error: "Analytics not ready" }, { status: 400 });
  }

  const body = await req.json() as { messages: Message[] };
  const messages: Message[] = body.messages ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = (Array.isArray(session.session_scores) ? session.session_scores[0] : session.session_scores) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectives: any[] = Array.isArray(scenario?.objectives) ? scenario.objectives : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coverage: any[] = Array.isArray(session.topic_coverage) ? session.topic_coverage : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transcript: any[] = Array.isArray(session.transcript_lines)
    ? [...session.transcript_lines].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    : [];

  const objectivesText = objectives
    .sort((a, b) => a.number - b.number)
    .map((o) => {
      const cov = coverage.find((c) => c.objective_id === o.id);
      const status = cov?.status ?? "missed";
      return `${o.number}. ${o.text} (${o.weight}%) — ${status}${cov?.covered_at ? ` at ${cov.covered_at}` : ""}`;
    })
    .join("\n");

  const transcriptText = transcript
    .map((l) => `[${l.timestamp}] ${l.speaker === "learner" ? "You" : "Actor"}: ${l.text}`)
    .join("\n");

  const systemPrompt = `You are Ada, an executive coach on Rehearse — a platform where managers practise high-stakes workplace conversations with human actors.

The learner just completed a practice session. Your role is to give specific, actionable, transcript-grounded coaching. Be warm but direct. Reference exact moments from the transcript using timestamps. Don't be vague.

Scenario: ${scenario?.title ?? "Unknown"}
Overall score: ${scores?.overall_score ?? "N/A"}/100
Filler words: ${scores?.filler_count ?? 0}
Talk ratio: ${scores?.talk_ratio ? Math.round(scores.talk_ratio * 100) : 50}% (you speaking)
Pace: ${scores?.pace_wpm ?? 0} wpm

Objectives:
${objectivesText}

Full transcript:
${transcriptText || "(no transcript available)"}

Return ONLY valid JSON with this exact structure — no markdown, no commentary:
{
  "message": "your coaching message as prose",
  "quotes": [{"timestamp": "MM:SS", "speaker": "learner|actor", "text": "exact quote"}],
  "suggestions": ["short actionable suggestion", "..."]
}

For follow-up turns, maintain continuity. Reference prior coaching if relevant.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.length > 0 ? messages : [
      { role: "user", content: "Please give me your opening coaching feedback on my session." }
    ],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  let result: { message: string; quotes: { timestamp: string; speaker: string; text: string }[]; suggestions: string[] };
  try {
    result = JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    result = { message: raw, quotes: [], suggestions: [] };
  }

  return NextResponse.json(result);
}
