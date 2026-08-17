"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type ReflectionInput = {
  feel: string;
  hardest: string;
  wentWell: string;
  differently: string;
};

// Saves the learner's post-call reflection and marks it submitted (which locks
// it — see the update RLS policy and the /reflect page redirect). Ownership is
// enforced here since writes go through the service client.
export async function saveReflection(
  sessionId: string,
  input: ReflectionInput
): Promise<void> {
  const user = await requireAuth();

  if (!input.feel.trim()) {
    throw new Error("The 'How did that feel?' reflection is required.");
  }

  const supabase = await createSupabaseServiceClient();

  // Verify the session belongs to this learner before writing.
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, learner_id")
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (sessionError || !session) throw new Error("Session not found");

  const now = new Date().toISOString();

  const { error } = await supabase.from("session_reflections").upsert(
    {
      session_id: sessionId,
      learner_id: user.id,
      feel: input.feel.trim(),
      hardest: input.hardest.trim() || null,
      went_well: input.wentWell.trim() || null,
      differently: input.differently.trim() || null,
      submitted_at: now,
      updated_at: now,
    },
    { onConflict: "session_id" }
  );

  if (error) throw new Error("Could not save your reflection. Please try again.");
}
