"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

type Rating = "red" | "yellow" | "green";
type Verdict = "ready" | "almost" | "not_yet";

// Verifies the debrief belongs to the authenticated actor and is still
// editable. Returns the debrief row or throws.
async function requireOwnDraftDebrief(
  supabase: Awaited<ReturnType<typeof createSupabaseServiceClient>>,
  debriefId: string,
  actorId: string
) {
  const { data: debrief } = await supabase
    .from("actor_debriefs")
    .select("id, actor_id, status")
    .eq("id", debriefId)
    .eq("actor_id", actorId)
    .single();

  if (!debrief) throw new Error("Debrief not found");
  if (debrief.status === "submitted") throw new Error("Debrief already submitted");
  return debrief;
}

// Autosave a single assessment (rating override and/or commentary).
export async function saveAssessment(
  debriefId: string,
  assessmentId: string,
  patch: { actorRating?: Rating; actorComment?: string }
) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  await requireOwnDraftDebrief(supabase, debriefId, user.id);

  const update: Record<string, unknown> = {};
  if (patch.actorRating !== undefined) update["actor_rating"] = patch.actorRating;
  // Cap length server-side — client maxLength is advisory only
  if (patch.actorComment !== undefined)
    update["actor_comment"] = patch.actorComment.slice(0, 4000);
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("debrief_assessments")
    .update(update)
    .eq("id", assessmentId)
    .eq("debrief_id", debriefId);

  if (error) throw new Error(`Failed to save assessment: ${error.message}`);

  await supabase
    .from("actor_debriefs")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", debriefId);
}

// Autosave the overall verdict without submitting.
export async function saveVerdict(debriefId: string, verdict: Verdict) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  await requireOwnDraftDebrief(supabase, debriefId, user.id);

  const { error } = await supabase
    .from("actor_debriefs")
    .update({ verdict, updated_at: new Date().toISOString() })
    .eq("id", debriefId);

  if (error) throw new Error(`Failed to save verdict: ${error.message}`);
}

// Final submission — locks the debrief and makes it learner-visible.
export async function submitDebrief(debriefId: string) {
  const user = await requireAuth();
  const supabase = await createSupabaseServiceClient();

  const debrief = await requireOwnDraftDebrief(supabase, debriefId, user.id);

  // Verdict is required to submit
  const { data: full } = await supabase
    .from("actor_debriefs")
    .select("verdict")
    .eq("id", debrief.id)
    .single();

  if (!full?.verdict) throw new Error("Choose an overall verdict before submitting");

  const { error } = await supabase
    .from("actor_debriefs")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", debriefId)
    .eq("status", "draft"); // double-submit guard: no-op if already submitted

  if (error) throw new Error(`Failed to submit debrief: ${error.message}`);

  await supabase.from("audit_log").insert({
    action: "debrief.submitted",
    target_type: "session",
    target_id: debriefId,
    metadata: { actor_id: user.id },
  });
}
