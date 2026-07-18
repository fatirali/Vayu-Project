-- ── Actor debriefs ────────────────────────────────────────────────────────────
-- After a session ends, the AI drafts a per-objective assessment (rating + note)
-- for the actor to review. The actor overrides ratings, adds commentary, picks
-- an overall verdict, and submits. Nothing is learner-visible until submitted.

CREATE TYPE debrief_rating  AS ENUM ('red', 'yellow', 'green');
CREATE TYPE debrief_verdict AS ENUM ('ready', 'almost', 'not_yet');
CREATE TYPE debrief_status  AS ENUM ('draft', 'submitted');

-- ── actor_debriefs ────────────────────────────────────────────────────────────
-- One per session. Created by the post-call pipeline (status 'draft').

CREATE TABLE actor_debriefs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  actor_id     UUID NOT NULL REFERENCES users(id),
  verdict      debrief_verdict,
  status       debrief_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actor_debriefs_actor ON actor_debriefs(actor_id);

-- ── debrief_assessments ──────────────────────────────────────────────────────
-- One per objective per debrief. ai_* columns are the frozen AI draft;
-- actor_* columns are the actor's final word. Kept separate so admins can
-- later see where actors disagreed with the AI.

CREATE TABLE debrief_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debrief_id    UUID NOT NULL REFERENCES actor_debriefs(id) ON DELETE CASCADE,
  objective_id  UUID NOT NULL REFERENCES objectives(id),
  ai_rating     debrief_rating,
  ai_note       TEXT,
  actor_rating  debrief_rating,
  actor_comment TEXT,
  UNIQUE (debrief_id, objective_id)
);

CREATE INDEX idx_debrief_assessments_debrief ON debrief_assessments(debrief_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE actor_debriefs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE debrief_assessments ENABLE ROW LEVEL SECURITY;

-- actor_debriefs

CREATE POLICY "actor_debriefs: actor read own" ON actor_debriefs
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "actor_debriefs: learner read submitted" ON actor_debriefs
  FOR SELECT TO authenticated
  USING (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = actor_debriefs.session_id AND s.learner_id = auth.uid()
    )
  );

CREATE POLICY "actor_debriefs: admin read all" ON actor_debriefs
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "actor_debriefs: service write" ON actor_debriefs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- debrief_assessments

CREATE POLICY "debrief_assessments: actor read own" ON debrief_assessments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actor_debriefs d
      WHERE d.id = debrief_assessments.debrief_id AND d.actor_id = auth.uid()
    )
  );

CREATE POLICY "debrief_assessments: learner read submitted" ON debrief_assessments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actor_debriefs d
      JOIN sessions s ON s.id = d.session_id
      WHERE d.id = debrief_assessments.debrief_id
        AND d.status = 'submitted'
        AND s.learner_id = auth.uid()
    )
  );

CREATE POLICY "debrief_assessments: admin read all" ON debrief_assessments
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "debrief_assessments: service write" ON debrief_assessments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
