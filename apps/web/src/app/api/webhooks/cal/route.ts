import { createSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Cal.com webhook handler.
 * Receives BOOKING_CREATED / BOOKING_CANCELLED / BOOKING_RESCHEDULED events
 * and keeps the sessions table in sync.
 *
 * Configure in Cal.com → Settings → Developer → Webhooks:
 *   URL: https://your-domain.com/api/webhooks/cal
 *   Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const triggerEvent = body["triggerEvent"] as string | undefined;
  const payload = body["payload"] as Record<string, unknown> | undefined;

  if (!triggerEvent || !payload) {
    return Response.json({ error: "Missing triggerEvent or payload" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();

  // ── BOOKING_CREATED ────────────────────────────────────────────────────────
  if (triggerEvent === "BOOKING_CREATED") {
    const metadata = (payload["metadata"] ?? {}) as Record<string, string>;
    const scenarioId = metadata["scenarioId"];
    const learnerId = metadata["learnerId"];
    const calBookingUid = payload["uid"] as string | undefined;
    const scheduledAt = payload["startTime"] as string | undefined;
    const endTime = payload["endTime"] as string | undefined;
    const organizer = (payload["organizer"] ?? {}) as Record<string, string>;
    const organizerEmail = organizer["email"];

    if (!scenarioId || !learnerId || !scheduledAt || !organizerEmail) {
      // Log missing fields but return 200 so Cal.com doesn't retry forever
      console.error("[cal webhook] Missing required fields", {
        scenarioId, learnerId, scheduledAt, organizerEmail,
      });
      return Response.json({ ok: true, warning: "Missing required metadata — session not created" });
    }

    // Derive duration from start/end times (seconds)
    const durationSecs = scheduledAt && endTime
      ? Math.round((new Date(endTime).getTime() - new Date(scheduledAt).getTime()) / 1000)
      : 1800; // fallback: 30 min

    // Look up actor by organizer email
    const { data: actor } = await supabase
      .from("users")
      .select("id")
      .eq("email", organizerEmail)
      .eq("role", "actor")
      .maybeSingle();

    if (!actor) {
      console.error("[cal webhook] Actor not found for email:", organizerEmail);
      return Response.json({ ok: true, warning: "Actor not found — session not created" });
    }

    const { error } = await supabase.from("sessions").insert({
      learner_id: learnerId,
      actor_id: actor.id,
      scenario_id: scenarioId,
      scheduled_at: scheduledAt,
      duration: durationSecs,
      cal_com_booking_id: calBookingUid ?? null,
      status: "booked",
    });

    if (error) {
      console.error("[cal webhook] Failed to create session:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  // ── BOOKING_CANCELLED ─────────────────────────────────────────────────────
  if (triggerEvent === "BOOKING_CANCELLED") {
    const calBookingUid = payload["uid"] as string | undefined;
    if (!calBookingUid) return Response.json({ ok: true });

    await supabase
      .from("sessions")
      .update({ status: "cancelled" })
      .eq("cal_com_booking_id", calBookingUid);

    return Response.json({ ok: true });
  }

  // ── BOOKING_RESCHEDULED ───────────────────────────────────────────────────
  if (triggerEvent === "BOOKING_RESCHEDULED") {
    const calBookingUid = payload["uid"] as string | undefined;
    const scheduledAt = payload["startTime"] as string | undefined;
    const endTime = payload["endTime"] as string | undefined;
    if (!calBookingUid || !scheduledAt) return Response.json({ ok: true });

    const durationSecs = endTime
      ? Math.round((new Date(endTime).getTime() - new Date(scheduledAt).getTime()) / 1000)
      : undefined;

    await supabase
      .from("sessions")
      .update({
        scheduled_at: scheduledAt,
        ...(durationSecs !== undefined ? { duration: durationSecs } : {}),
        status: "booked",
      })
      .eq("cal_com_booking_id", calBookingUid);

    return Response.json({ ok: true });
  }

  // Unknown event — acknowledge so Cal.com stops retrying
  return Response.json({ ok: true });
}
