import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getServiceClient();
  const resend = new Resend(process.env["RESEND_API_KEY"]);
  const now = Date.now();

  let sent24h = 0;
  let sent1h = 0;
  let failed = 0;

  // ── 24-hour reminders ────────────────────────────────────────────────────────
  // Find sessions scheduled between 23h and 25h from now, reminder not yet sent

  const h24start = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const h24end   = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: sessions24h } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      scenarios ( title, target_duration ),
      learner:users!sessions_learner_id_fkey ( first_name, last_name, email ),
      actor:users!sessions_actor_id_fkey ( first_name, last_name, email )
    `)
    .in("status", ["booked", "confirmed"])
    .gte("scheduled_at", h24start)
    .lte("scheduled_at", h24end)
    .eq("reminder_24h_sent", false);

  for (const session of sessions24h ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const learner = (Array.isArray(session.learner) ? session.learner[0] : session.learner) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actor = (Array.isArray(session.actor) ? session.actor[0] : session.actor) as any;

    const formattedTime = formatDateTime(session.scheduled_at);
    const sessionTitle = scenario?.title ?? "Practice session";

    const emails: { to: string; subject: string; body: string }[] = [];

    if (learner?.email) {
      emails.push({
        to: learner.email,
        subject: `Reminder: Your Rehearse session is tomorrow`,
        body: `Hi ${learner.first_name},\n\nJust a reminder that your session "${sessionTitle}" is scheduled for ${formattedTime}.\n\nLog in to Rehearse to review your briefing before the session.\n\n— The Rehearse team`,
      });
    }

    if (actor?.email) {
      emails.push({
        to: actor.email,
        subject: `Reminder: You have a Rehearse session tomorrow`,
        body: `Hi ${actor.first_name},\n\nReminder: you have a session for "${sessionTitle}" scheduled for ${formattedTime}.\n\nPlease review your character brief and pushback playbook beforehand.\n\n— The Rehearse team`,
      });
    }

    let allSent = true;
    for (const email of emails) {
      const { error } = await resend.emails.send({
        from: "Rehearse <reminders@rehearse.app>",
        to: email.to,
        subject: email.subject,
        text: email.body,
      });
      if (error) {
        console.error(`Failed to send 24h reminder for session ${session.id}:`, error);
        allSent = false;
        failed++;
      }
    }

    if (allSent) {
      await supabase
        .from("sessions")
        .update({ reminder_24h_sent: true })
        .eq("id", session.id);
      sent24h++;
    }
  }

  // ── 1-hour reminders ─────────────────────────────────────────────────────────
  // Find sessions scheduled between 50 and 70 minutes from now

  const h1start = new Date(now + 50 * 60 * 1000).toISOString();
  const h1end   = new Date(now + 70 * 60 * 1000).toISOString();

  const { data: sessions1h } = await supabase
    .from("sessions")
    .select(`
      id,
      scheduled_at,
      scenarios ( title ),
      learner:users!sessions_learner_id_fkey ( first_name, last_name, email ),
      actor:users!sessions_actor_id_fkey ( first_name, last_name, email )
    `)
    .in("status", ["booked", "confirmed"])
    .gte("scheduled_at", h1start)
    .lte("scheduled_at", h1end)
    .eq("reminder_1h_sent", false);

  for (const session of sessions1h ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scenario = (Array.isArray(session.scenarios) ? session.scenarios[0] : session.scenarios) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const learner = (Array.isArray(session.learner) ? session.learner[0] : session.learner) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actor = (Array.isArray(session.actor) ? session.actor[0] : session.actor) as any;

    const formattedTime = formatDateTime(session.scheduled_at);
    const sessionTitle = scenario?.title ?? "Practice session";

    const emails: { to: string; subject: string; body: string }[] = [];

    if (learner?.email) {
      emails.push({
        to: learner.email,
        subject: `Your Rehearse session starts in 1 hour`,
        body: `Hi ${learner.first_name},\n\nYour session "${sessionTitle}" starts at ${formattedTime} — in about an hour.\n\nHead to Rehearse to join when it's time.\n\n— The Rehearse team`,
      });
    }

    if (actor?.email) {
      emails.push({
        to: actor.email,
        subject: `Your Rehearse session starts in 1 hour`,
        body: `Hi ${actor.first_name},\n\nReminder: your session for "${sessionTitle}" starts at ${formattedTime} — in about an hour.\n\nMake sure you're ready to join.\n\n— The Rehearse team`,
      });
    }

    let allSent = true;
    for (const email of emails) {
      const { error } = await resend.emails.send({
        from: "Rehearse <reminders@rehearse.app>",
        to: email.to,
        subject: email.subject,
        text: email.body,
      });
      if (error) {
        console.error(`Failed to send 1h reminder for session ${session.id}:`, error);
        allSent = false;
        failed++;
      }
    }

    if (allSent) {
      await supabase
        .from("sessions")
        .update({ reminder_1h_sent: true })
        .eq("id", session.id);
      sent1h++;
    }
  }

  // Audit log
  await supabase.from("audit_log").insert({
    action: "reminders.cron.completed",
    metadata: { sent24h, sent1h, failed, run_at: new Date().toISOString() },
  });

  return NextResponse.json({ ok: true, sent24h, sent1h, failed });
}
