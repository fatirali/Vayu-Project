"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function submitActorRating(sessionId: string, rating: number): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  await supabase
    .from("sessions")
    .update({ actor_rating: rating })
    .eq("id", sessionId)
    .eq("learner_id", user.id);
}
