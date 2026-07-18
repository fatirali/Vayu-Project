import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// ── Supabase service client (no cookies in background task) ─────────────────

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    {
      // Node <22 has no native WebSocket — provide the ws package so the
      // Supabase realtime client can initialise without throwing.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      realtime: { transport: ws as any },
    }
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type DeepgramWord = {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker: number;
  punctuated_word?: string;
};

type DeepgramAlternative = {
  transcript: string;
  words: DeepgramWord[];
};

type DeepgramChannel = {
  alternatives: DeepgramAlternative[];
};

type DeepgramResult = {
  results: {
    channels: DeepgramChannel[];
  };
};

// Single-token fillers. "like"/"actually"/"literally" were removed — they flag
// legitimate usage ("I'd like to discuss…") far more often than actual filler.
const FILLER_WORDS = new Set(["um", "uh", "basically"]);

// Two-word filler phrases, matched across consecutive words.
const FILLER_PHRASES = new Set(["you know", "i mean", "sort of", "kind of"]);

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, "");
}

// Extract fillers from an utterance, matching two-word phrases first.
function extractFillers(words: { word: string }[]): string[] {
  const fillers: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w1 = normalizeWord(words[i]!.word);
    if (i + 1 < words.length) {
      const phrase = `${w1} ${normalizeWord(words[i + 1]!.word)}`;
      if (FILLER_PHRASES.has(phrase)) {
        fillers.push(phrase);
        i++; // consume both words
        continue;
      }
    }
    if (FILLER_WORDS.has(w1)) fillers.push(w1);
  }
  return fillers;
}

// ── Actor debrief creation ───────────────────────────────────────────────────
// Creates the debrief shell + one assessment row per objective. Idempotent:
// if a debrief already exists for the session (pipeline re-run), it's left
// untouched so actor edits are never clobbered.

async function createActorDebrief(
  supabase: ReturnType<typeof getServiceClient>,
  args: {
    sessionId: string;
    actorId: string;
    objectives: Array<{ id: string; number: number }>;
    // null = AI unavailable (no recording / drafting failed)
    drafts: Array<{
      number: number;
      rating: "red" | "yellow" | "green" | null;
      note: string | null;
    }> | null;
  }
) {
  const { data: existing } = await supabase
    .from("actor_debriefs")
    .select("id")
    .eq("session_id", args.sessionId)
    .single();

  if (existing) {
    logger.warn("Debrief already exists — skipping creation", {
      sessionId: args.sessionId,
    });
    return;
  }

  const { data: debrief, error: debriefError } = await supabase
    .from("actor_debriefs")
    .insert({
      session_id: args.sessionId,
      actor_id: args.actorId,
      status: "draft",
    })
    .select("id")
    .single();

  if (debriefError || !debrief) {
    throw new Error(`Failed to create actor debrief: ${debriefError?.message}`);
  }

  const rows = args.objectives.map((obj) => {
    const draft = args.drafts?.find((d) => d.number === obj.number);
    return {
      debrief_id: debrief.id,
      objective_id: obj.id,
      ai_rating: draft?.rating ?? null,
      ai_note: draft?.note ?? null,
      // Actor rating starts as the AI's suggestion; actor can override
      actor_rating: draft?.rating ?? null,
      actor_comment: null,
    };
  });

  if (rows.length > 0) {
    const { error: assessError } = await supabase
      .from("debrief_assessments")
      .insert(rows);
    if (assessError) {
      throw new Error(`Failed to create assessments: ${assessError.message}`);
    }
  }
}

// ── Pipeline task ────────────────────────────────────────────────────────────

export const postCallPipeline = task({
  id: "post-call-pipeline",
  maxDuration: 600, // 10 min max

  run: async (payload: { sessionId: string }) => {
    const { sessionId } = payload;
    const supabase = getServiceClient();

    logger.info("Starting post-call pipeline", { sessionId });

    // ── Step 1: Fetch session + scenario ──────────────────────────────────────

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        id,
        learner_id,
        actor_id,
        learner_speaker_index,
        recording_path,
        scenarios (
          id,
          objectives (
            id,
            number,
            text,
            weight
          )
        )
      `)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Guard against running twice for the same session
    const { data: existingScores } = await supabase
      .from("session_scores")
      .select("session_id")
      .eq("session_id", sessionId)
      .single();

    if (existingScores) {
      logger.warn("Analytics already exist for session — skipping", { sessionId });
      return { skipped: true, reason: "already_processed" };
    }

    if (!session.recording_path) {
      logger.warn("No recording path — skipping transcription", { sessionId });
      // Still create an empty debrief so the actor can assess manually
      // (assessment cards will show "AI draft unavailable").
      await createActorDebrief(supabase, {
        sessionId,
        actorId: session.actor_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        objectives: ((Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any)?.objectives ?? [],
        drafts: null,
      });
      return { skipped: true, reason: "no_recording" };
    }

    // ── Step 2: Download recording from Supabase Storage ─────────────────────

    logger.info("Downloading recording", { path: session.recording_path });

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("recordings")
      .download(session.recording_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download recording: ${downloadError?.message}`);
    }

    const audioBuffer = await fileData.arrayBuffer();

    // ── Step 3: Submit to Deepgram Nova-3 batch ───────────────────────────────

    logger.info("Submitting to Deepgram", { sessionId });

    const dgRes = await fetch(
      "https://api.deepgram.com/v1/listen?" +
        new URLSearchParams({
          model: "nova-3",
          diarize: "true",
          filler_words: "true",
          punctuate: "true",
          utterances: "true",
          smart_format: "true",
        }),
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env["DEEPGRAM_API_KEY"]}`,
          "Content-Type": session.recording_path.endsWith(".ogg")
            ? "audio/ogg"
            : "video/mp4",
        },
        body: audioBuffer,
      }
    );

    if (!dgRes.ok) {
      throw new Error(`Deepgram error: ${dgRes.status} ${await dgRes.text()}`);
    }

    const dgData = (await dgRes.json()) as DeepgramResult;
    const words = dgData.results?.channels[0]?.alternatives[0]?.words ?? [];

    // ── Step 4: Parse transcript → transcript_lines ───────────────────────────

    logger.info("Parsing transcript", { wordCount: words.length });

    // Group words into utterances by speaker + silence gaps
    type Utterance = {
      speaker: number;
      start: number;
      end: number;
      words: DeepgramWord[];
    };

    const utterances: Utterance[] = [];
    let current: Utterance | null = null;
    const GAP_THRESHOLD = 1.5; // seconds

    for (const word of words) {
      if (
        !current ||
        current.speaker !== word.speaker ||
        word.start - current.end > GAP_THRESHOLD
      ) {
        if (current) utterances.push(current);
        current = { speaker: word.speaker, start: word.start, end: word.end, words: [word] };
      } else {
        current.words.push(word);
        current.end = word.end;
      }
    }
    if (current) utterances.push(current);

    // Format timestamp as MM:SS
    function fmt(sec: number) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    // ── Step 5: Claude Sonnet analysis ───────────────────────────────────────
    // Runs BEFORE transcript labeling: Deepgram's diarized speaker indices are
    // assigned by voice-detection order (whoever talks first = speaker 0) and
    // have no relationship to who the learner is. Claude identifies the learner
    // from conversation content, and that mapping drives all labels + metrics.

    logger.info("Running Claude analysis", { sessionId });

    const scenarios = Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objectives = (scenarios as any)?.objectives ?? [];

    const objectivesText = objectives
      .map((o: { number: number; text: string; weight: number }) => `${o.number}. ${o.text} (weight: ${o.weight}%)`)
      .join("\n");

    // Neutral speaker labels — Claude determines which one is the learner
    const neutralTranscript = utterances
      .map((u) => {
        const text = u.words.map((w) => w.punctuated_word ?? w.word).join(" ");
        return `[${fmt(u.start)}] Speaker ${u.speaker}: ${text}`;
      })
      .join("\n");

    const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

    const analysisResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are evaluating a manager's performance in a high-stakes workplace conversation rehearsal. One speaker is the manager (the learner being evaluated); the other is a trained actor playing the employee.

Objectives the MANAGER must accomplish (weighted):
${objectivesText}

Transcript (diarized, speaker identity unknown):
${neutralTranscript}

Tasks:
1. Determine which speaker number is the MANAGER (the one delivering the message, running the conversation, and pursuing the objectives above). The other speaker is the employee (actor).
2. For each objective, assess whether the MANAGER covered it: covered, partial, or missed. Treat abbreviations and their expansions as equivalent (e.g. "PIP" = "performance improvement plan", "sev" = "severance").
3. Provide an overall score from 0-100 for the manager's performance.

Respond in JSON with this exact structure:
{
  "learner_speaker": <speaker number of the manager>,
  "overall_score": <number 0-100>,
  "objectives": [
    { "number": <n>, "status": "covered"|"partial"|"missed", "covered_at": "<MM:SS or null>" }
  ]
}`,
        },
      ],
    });

    let analysisResult: {
      learner_speaker?: number;
      overall_score: number;
      objectives: Array<{ number: number; status: string; covered_at: string | null }>;
    };

    try {
      const content = analysisResponse.content[0];
      const rawText = content?.type === "text" ? content.text : "{}";
      // Extract JSON from possible markdown code block
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      analysisResult = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      logger.warn("Failed to parse Claude response, using defaults", { sessionId });
      analysisResult = {
        overall_score: 50,
        objectives: objectives.map((o: { number: number }) => ({
          number: o.number,
          status: "partial",
          covered_at: null,
        })),
      };
    }

    // Resolve learner speaker: Claude's content inference, falling back to any
    // previously stored index, then 0.
    const learnerSpeaker =
      typeof analysisResult.learner_speaker === "number"
        ? analysisResult.learner_speaker
        : session.learner_speaker_index ?? 0;

    logger.info("Speaker mapping resolved", { sessionId, learnerSpeaker });

    // ── Step 5b: Build + save transcript with resolved labels ─────────────────

    const transcriptRows = utterances.map((u) => {
      const text = u.words.map((w) => w.punctuated_word ?? w.word).join(" ");
      const isLearner = u.speaker === learnerSpeaker;
      return {
        session_id: sessionId,
        timestamp: fmt(u.start),
        speaker: isLearner ? "learner" : "actor",
        text,
        // Fillers are a learner coaching metric — actor lines are not flagged
        filler_words: isLearner ? extractFillers(u.words) : [],
      };
    });

    const { error: transcriptError } = await supabase
      .from("transcript_lines")
      .insert(transcriptRows);

    if (transcriptError) {
      throw new Error(`Failed to save transcript: ${transcriptError.message}`);
    }

    // ── Step 5c: Calculate metrics (learner-only where relevant) ──────────────

    const learnerWords = words.filter((w) => w.speaker === learnerSpeaker);

    // Actual speaking time = sum of utterance durations per speaker.
    // (Previously measured first-to-last-word SPAN, which includes the other
    // person's turns and silences — both spans ≈ call length, so talk ratio
    // always collapsed to ~50:50 and pace was massively understated.)
    const speakingTime = (isLearner: boolean) =>
      utterances
        .filter((u) => (u.speaker === learnerSpeaker) === isLearner)
        .reduce((sum, u) => sum + (u.end - u.start), 0);

    const learnerDuration = speakingTime(true);
    const actorDuration = speakingTime(false);
    const totalDuration = learnerDuration + actorDuration;

    // Wall-clock call duration (first word to last word across both speakers)
    const callDuration =
      words.length > 0 ? words[words.length - 1]!.end - words[0]!.start : 0;

    const paceWpm =
      learnerDuration > 0
        ? Math.round((learnerWords.length / learnerDuration) * 60)
        : 0;

    const talkRatio =
      totalDuration > 0
        ? parseFloat((learnerDuration / totalDuration).toFixed(3))
        : 0.5;

    // Total filler count across all learner lines (phrases count as one)
    const fillerCount = transcriptRows
      .filter((r) => r.speaker === "learner")
      .reduce((sum, r) => sum + r.filler_words.length, 0);

    // ── Step 6: Write session_scores + topic_coverage ─────────────────────────

    logger.info("Writing scores and coverage", { sessionId });

    const { error: scoreError } = await supabase.from("session_scores").upsert({
      session_id: sessionId,
      overall_score: Math.max(0, Math.min(100, analysisResult.overall_score ?? 50)),
      filler_count: fillerCount,
      pace_wpm: paceWpm,
      talk_ratio: talkRatio,
      duration_actual: Math.round(callDuration),
    }, { onConflict: "session_id" });

    if (scoreError) {
      throw new Error(`Failed to save scores: ${scoreError.message}`);
    }

    const coverageRows = analysisResult.objectives
      .map((obj) => {
        const dbObj = objectives.find((o: { number: number }) => o.number === obj.number);
        if (!dbObj) return null;
        return {
          session_id: sessionId,
          objective_id: dbObj.id,
          status: obj.status as "covered" | "partial" | "missed",
          covered_at: obj.covered_at,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (coverageRows.length > 0) {
      await supabase.from("topic_coverage").insert(coverageRows);
    }

    // ── Step 6b: Draft actor debrief ──────────────────────────────────────────
    // Ratings map directly from topic coverage (covered→green, partial→yellow,
    // missed→red) so the actor and learner views never disagree. One extra
    // Claude call drafts actor-facing notes; if it fails, the debrief is still
    // created with ratings but no notes (actor assesses manually).

    logger.info("Drafting actor debrief", { sessionId });

    const statusToRating: Record<string, "red" | "yellow" | "green"> = {
      covered: "green",
      partial: "yellow",
      missed: "red",
    };

    let aiNotes: Map<number, string> = new Map();
    try {
      const { data: flags } = await supabase
        .from("flagged_moments")
        .select("type, timestamp, note")
        .eq("session_id", sessionId);

      const flagsText =
        (flags ?? [])
          .map((f) => `[${f.timestamp}] ${f.type}${f.note ? `: ${f.note}` : ""}`)
          .join("\n") || "(none)";

      const coverageText = analysisResult.objectives
        .map((o) => {
          const dbObj = objectives.find((x: { number: number }) => x.number === o.number);
          return `${o.number}. ${dbObj?.text ?? ""} — ${o.status}${o.covered_at ? ` at ${o.covered_at}` : ""}`;
        })
        .join("\n");

      const labeledTranscript = transcriptRows
        .map((r) => `[${r.timestamp}] ${r.speaker === "learner" ? "MANAGER" : "ACTOR"}: ${r.text}`)
        .join("\n");

      const noteResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are drafting debrief notes for a trained ACTOR who just played the employee in a manager's rehearsal of a difficult workplace conversation. The actor will review your notes, agree or disagree, and add their own commentary.

Objectives the manager had to accomplish, with the AI coverage assessment:
${coverageText}

Moments the actor flagged live during the call:
${flagsText}

Transcript:
${labeledTranscript}

For each objective, write ONE note (max 2 sentences) addressed to the actor. Reference specific moments or quotes with timestamps where possible. Be concrete about what the manager did or failed to do — the actor was in the room and will spot vague filler.

Respond in JSON only:
{ "notes": [ { "number": <objective number>, "note": "<text>" } ] }`,
          },
        ],
      });

      const noteContent = noteResponse.content[0];
      const noteRaw = noteContent?.type === "text" ? noteContent.text : "{}";
      const noteJson = JSON.parse(noteRaw.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
        notes?: Array<{ number: number; note: string }>;
      };
      aiNotes = new Map((noteJson.notes ?? []).map((n) => [n.number, n.note]));
    } catch (err) {
      logger.warn("Actor note drafting failed — creating debrief without notes", {
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    await createActorDebrief(supabase, {
      sessionId,
      actorId: session.actor_id,
      objectives,
      drafts: analysisResult.objectives.map((o) => ({
        number: o.number,
        rating: statusToRating[o.status] ?? null,
        note: aiNotes.get(o.number) ?? null,
      })),
    });

    // ── Step 7: Mark analytics ready ─────────────────────────────────────────

    await supabase
      .from("sessions")
      .update({ analytics_ready: "true", learner_speaker_index: learnerSpeaker })
      .eq("id", sessionId);

    // ── Step 8: Audit log ─────────────────────────────────────────────────────

    await supabase.from("audit_log").insert({
      action: "pipeline.completed",
      target_type: "session",
      target_id: sessionId,
      metadata: {
        overall_score: analysisResult.overall_score,
        filler_count: fillerCount,
        pace_wpm: paceWpm,
      },
    });

    logger.info("Pipeline complete", { sessionId });
    return { success: true, sessionId };
  },
});
