-- ── Grants for actor debrief tables ─────────────────────────────────────────
-- RLS policies gate row visibility, but Postgres still requires table-level
-- privileges. The 20260715 migration was applied via the CLI login role, so
-- the project's default privileges (which auto-grant to authenticated /
-- service_role for dashboard-created objects) did not apply. Without these,
-- the learner's RLS client gets "permission denied for table actor_debriefs"
-- and the analytics page silently hides the debrief card.

-- Reads are RLS-gated (actor own / learner submitted-only / admin).
GRANT SELECT ON actor_debriefs      TO authenticated;
GRANT SELECT ON debrief_assessments TO authenticated;

-- Writes go exclusively through server actions / the pipeline.
GRANT ALL ON actor_debriefs      TO service_role;
GRANT ALL ON debrief_assessments TO service_role;
