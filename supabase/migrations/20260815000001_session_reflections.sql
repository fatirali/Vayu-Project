-- ── Session reflections ───────────────────────────────────────────────────────
-- The learner's own words, captured on the /reflect screen immediately after the
-- call and BEFORE any AI feedback is shown. One row per session, learner-owned
-- (contrast actor_debriefs, which are actor-owned). Surfaced read-only on the
-- analytics "My reflection" tab so learners can compare gut read vs. feedback.

CREATE TABLE session_reflections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  learner_id   UUID NOT NULL REFERENCES users(id),
  feel         TEXT,   -- required question ("How did that feel?")
  hardest      TEXT,   -- optional
  went_well    TEXT,   -- optional
  differently  TEXT,   -- optional
  submitted_at TIMESTAMPTZ,           -- set on submit; presence => locked (read-only)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_reflections_learner ON session_reflections(learner_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- App writes go through the service client, but these policies are the backstop
-- for any direct authenticated access. Every write policy carries WITH CHECK.

-- Table-level grants. Tables created by raw SQL do not inherit Supabase's
-- default role grants, so the authenticated role must be granted explicitly or
-- RLS policies never even get a chance to run (permission denied first).
-- Reads happen as `authenticated`; all writes go through the service client.
GRANT SELECT ON session_reflections TO authenticated;

ALTER TABLE session_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_reflections: learner read own" ON session_reflections
  FOR SELECT TO authenticated
  USING (learner_id = auth.uid());

CREATE POLICY "session_reflections: learner insert own" ON session_reflections
  FOR INSERT TO authenticated
  WITH CHECK (
    learner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_reflections.session_id AND s.learner_id = auth.uid()
    )
  );

-- Editable only while unsubmitted — enforces lock-after-submit at the DB layer.
CREATE POLICY "session_reflections: learner update own unsubmitted" ON session_reflections
  FOR UPDATE TO authenticated
  USING (learner_id = auth.uid() AND submitted_at IS NULL)
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY "session_reflections: admin read all" ON session_reflections
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "session_reflections: service write" ON session_reflections
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
