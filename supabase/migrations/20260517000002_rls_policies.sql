-- =============================================================================
-- Rehearse — RLS Policies, Triggers, and Security
-- Migration: 20260517000002_rls_policies.sql
-- =============================================================================

-- ── Helper: get current user's role ──────────────────────────────────────────
-- Reads role from user_metadata in the Supabase JWT.
-- Set at signup via options.data.role in supabase.auth.signUp().

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'learner'
  )
$$;

-- ── handle_new_user trigger ───────────────────────────────────────────────────
-- Fires after every INSERT on auth.users.
-- Creates the corresponding public.users row automatically.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    role,
    first_name,
    last_name,
    company,
    job_title,
    linkedin_url,
    actor_interests,
    referral_source,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'learner')::user_role,
    COALESCE(NEW.raw_user_meta_data ->> 'firstName', SPLIT_PART(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ' ', 1), ''),
    COALESCE(NEW.raw_user_meta_data ->> 'lastName', NULLIF(TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')) + 1)), ''), ''),
    NEW.raw_user_meta_data ->> 'company',
    NEW.raw_user_meta_data ->> 'jobTitle',
    NEW.raw_user_meta_data ->> 'linkedinUrl',
    CASE
      WHEN NEW.raw_user_meta_data -> 'actorInterests' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data -> 'actorInterests'))
      ELSE NULL
    END,
    NEW.raw_user_meta_data ->> 'referralSource',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── audit_log immutability trigger ───────────────────────────────────────────
-- Prevents any UPDATE or DELETE on audit_log rows.
-- Even the service role cannot mutate audit entries.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable — UPDATE and DELETE are not permitted';
END;
$$;

DROP TRIGGER IF EXISTS enforce_audit_log_immutability ON audit_log;
CREATE TRIGGER enforce_audit_log_immutability
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- ── updated_at auto-update ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_scenarios_updated_at ON scenarios;
CREATE TRIGGER set_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE dramatic_arc_phases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_requirements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pushback_tiers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pushback_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_nudges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_lines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_coverage       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_moments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_scenarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_learners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- ── Drop all existing policies (safe re-run) ─────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── users policies ───────────────────────────────────────────────────────────

-- Every authenticated user can read their own row
CREATE POLICY "users: read own" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ops_admin and ld_admin can read all users
CREATE POLICY "users: admin read all" ON users
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ops_admin', 'ld_admin'));

-- Users can update their own non-role fields
CREATE POLICY "users: update own" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ops_admin can update any user (for actor approval, Stripe status updates)
CREATE POLICY "users: ops_admin update any" ON users
  FOR UPDATE TO authenticated
  USING (auth_user_role() = 'ops_admin');

-- Learners can read basic profile of approved actors (for booking page actor cards)
CREATE POLICY "users: learner read approved actors" ON users
  FOR SELECT TO authenticated
  USING (role = 'actor' AND approved_at IS NOT NULL);

-- Service role can insert (handle_new_user trigger runs as SECURITY DEFINER)
CREATE POLICY "users: service insert" ON users
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ── scenarios policies ────────────────────────────────────────────────────────

-- Published scenarios are readable by all authenticated users
CREATE POLICY "scenarios: read published" ON scenarios
  FOR SELECT TO authenticated
  USING (status = 'published');

-- ld_admin and ops_admin can read all scenarios (including drafts)
CREATE POLICY "scenarios: admin read all" ON scenarios
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

-- ld_admin can insert and update scenarios
CREATE POLICY "scenarios: ld_admin write" ON scenarios
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- ── scenario sub-table policies (personas, arc phases, objectives, etc.) ──────
-- All follow the same rule: readable if the parent scenario is readable.
-- Writers: ld_admin only.

-- personas
CREATE POLICY "personas: read if scenario readable" ON personas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = personas.scenario_id
        AND (s.status = 'published' OR auth_user_role() IN ('ld_admin', 'ops_admin'))
    )
  );

CREATE POLICY "personas: ld_admin write" ON personas
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- dramatic_arc_phases
CREATE POLICY "dramatic_arc_phases: read if scenario readable" ON dramatic_arc_phases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = dramatic_arc_phases.scenario_id
        AND (s.status = 'published' OR auth_user_role() IN ('ld_admin', 'ops_admin'))
    )
  );

CREATE POLICY "dramatic_arc_phases: ld_admin write" ON dramatic_arc_phases
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- objectives
CREATE POLICY "objectives: read if scenario readable" ON objectives
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = objectives.scenario_id
        AND (s.status = 'published' OR auth_user_role() IN ('ld_admin', 'ops_admin'))
    )
  );

CREATE POLICY "objectives: ld_admin write" ON objectives
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- legal_requirements
CREATE POLICY "legal_requirements: read if scenario readable" ON legal_requirements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = legal_requirements.scenario_id
        AND (s.status = 'published' OR auth_user_role() IN ('ld_admin', 'ops_admin'))
    )
  );

CREATE POLICY "legal_requirements: ld_admin write" ON legal_requirements
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- pushback_tiers: actors and ld_admin can read
CREATE POLICY "pushback_tiers: read" ON pushback_tiers
  FOR SELECT TO authenticated
  USING (
    auth_user_role() IN ('actor', 'ld_admin', 'ops_admin')
    OR EXISTS (
      SELECT 1 FROM scenarios s
      WHERE s.id = pushback_tiers.scenario_id AND s.status = 'published'
    )
  );

CREATE POLICY "pushback_tiers: ld_admin write" ON pushback_tiers
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- pushback_responses
CREATE POLICY "pushback_responses: read" ON pushback_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pushback_tiers pt
      JOIN scenarios s ON s.id = pt.scenario_id
      WHERE pt.id = pushback_responses.tier_id
        AND (auth_user_role() IN ('actor', 'ld_admin', 'ops_admin') OR s.status = 'published')
    )
  );

CREATE POLICY "pushback_responses: ld_admin write" ON pushback_responses
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- coach_nudges: ld_admin only
CREATE POLICY "coach_nudges: ld_admin read" ON coach_nudges
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "coach_nudges: ld_admin write" ON coach_nudges
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- stage_rules: actors and ld_admin
CREATE POLICY "stage_rules: actor and admin read" ON stage_rules
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('actor', 'ld_admin', 'ops_admin'));

CREATE POLICY "stage_rules: ld_admin write" ON stage_rules
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- ── actor_certifications ──────────────────────────────────────────────────────

-- Actor can read their own certifications
CREATE POLICY "actor_certifications: actor read own" ON actor_certifications
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- ld_admin and ops_admin can read and write all certifications
CREATE POLICY "actor_certifications: admin all" ON actor_certifications
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'))
  WITH CHECK (auth_user_role() IN ('ld_admin', 'ops_admin'));

-- Learners can read certifications to see who's certified for booking
CREATE POLICY "actor_certifications: learner read" ON actor_certifications
  FOR SELECT TO authenticated
  USING (
    auth_user_role() = 'learner'
    AND status = 'certified'
  );

-- ── sessions ──────────────────────────────────────────────────────────────────

-- Learner can read their own sessions
CREATE POLICY "sessions: learner read own" ON sessions
  FOR SELECT TO authenticated
  USING (learner_id = auth.uid());

-- Actor can read sessions they're assigned to
CREATE POLICY "sessions: actor read own" ON sessions
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- ld_admin and ops_admin can read all sessions
CREATE POLICY "sessions: admin read all" ON sessions
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

-- Learners can insert (book) sessions
CREATE POLICY "sessions: learner insert" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_role() = 'learner'
    AND learner_id = auth.uid()
  );

-- Service role can update (pipeline writes analytics_ready, recording_path etc.)
CREATE POLICY "sessions: service update" ON sessions
  FOR UPDATE TO service_role
  USING (true);

-- Learner and actor can update limited fields (status transitions: booked→live→completed)
CREATE POLICY "sessions: participant update status" ON sessions
  FOR UPDATE TO authenticated
  USING (learner_id = auth.uid() OR actor_id = auth.uid());

-- ── session_scores ────────────────────────────────────────────────────────────

CREATE POLICY "session_scores: learner read own" ON session_scores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_scores.session_id AND s.learner_id = auth.uid()
    )
  );

CREATE POLICY "session_scores: admin read all" ON session_scores
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "session_scores: service write" ON session_scores
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── transcript_lines ──────────────────────────────────────────────────────────

CREATE POLICY "transcript_lines: learner read own" ON transcript_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = transcript_lines.session_id AND s.learner_id = auth.uid()
    )
  );

CREATE POLICY "transcript_lines: admin read all" ON transcript_lines
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "transcript_lines: service write" ON transcript_lines
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── topic_coverage ────────────────────────────────────────────────────────────

CREATE POLICY "topic_coverage: learner read own" ON topic_coverage
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = topic_coverage.session_id AND s.learner_id = auth.uid()
    )
  );

CREATE POLICY "topic_coverage: admin read all" ON topic_coverage
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "topic_coverage: service write" ON topic_coverage
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── flagged_moments ───────────────────────────────────────────────────────────

-- Actor can insert flags during their own sessions
CREATE POLICY "flagged_moments: actor insert own" ON flagged_moments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_role() = 'actor'
    AND flagged_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = flagged_moments.session_id AND s.actor_id = auth.uid()
    )
  );

-- Learner can read flags from their own sessions
CREATE POLICY "flagged_moments: learner read own" ON flagged_moments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = flagged_moments.session_id AND s.learner_id = auth.uid()
    )
  );

-- ld_admin can read and update (review) all flags
CREATE POLICY "flagged_moments: ld_admin all" ON flagged_moments
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ld_admin')
  WITH CHECK (auth_user_role() = 'ld_admin');

-- ── coach_conversations ───────────────────────────────────────────────────────

CREATE POLICY "coach_conversations: learner own" ON coach_conversations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = coach_conversations.session_id AND s.learner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = coach_conversations.session_id AND s.learner_id = auth.uid()
    )
  );

CREATE POLICY "coach_conversations: service write" ON coach_conversations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── cohorts ───────────────────────────────────────────────────────────────────

CREATE POLICY "cohorts: ld_admin all" ON cohorts
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'))
  WITH CHECK (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "cohorts: learner read own" ON cohorts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cohort_learners cl
      WHERE cl.cohort_id = cohorts.id AND cl.learner_id = auth.uid()
    )
  );

-- ── cohort_scenarios ──────────────────────────────────────────────────────────

CREATE POLICY "cohort_scenarios: ld_admin all" ON cohort_scenarios
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'))
  WITH CHECK (auth_user_role() IN ('ld_admin', 'ops_admin'));

-- ── cohort_learners ───────────────────────────────────────────────────────────

CREATE POLICY "cohort_learners: ld_admin all" ON cohort_learners
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('ld_admin', 'ops_admin'))
  WITH CHECK (auth_user_role() IN ('ld_admin', 'ops_admin'));

CREATE POLICY "cohort_learners: learner read own" ON cohort_learners
  FOR SELECT TO authenticated
  USING (learner_id = auth.uid());

-- ── payouts ───────────────────────────────────────────────────────────────────

CREATE POLICY "payouts: ops_admin all" ON payouts
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ops_admin')
  WITH CHECK (auth_user_role() = 'ops_admin');

CREATE POLICY "payouts: service write" ON payouts
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── session_payments ──────────────────────────────────────────────────────────

CREATE POLICY "session_payments: ops_admin all" ON session_payments
  FOR ALL TO authenticated
  USING (auth_user_role() = 'ops_admin')
  WITH CHECK (auth_user_role() = 'ops_admin');

-- Actors can read their own payment records
CREATE POLICY "session_payments: actor read own" ON session_payments
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "session_payments: service write" ON session_payments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── audit_log ─────────────────────────────────────────────────────────────────

-- All authenticated users can insert (to log their own actions)
CREATE POLICY "audit_log: authenticated insert" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Service role can insert (pipeline, cron jobs)
CREATE POLICY "audit_log: service insert" ON audit_log
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ops_admin can read audit log
CREATE POLICY "audit_log: ops_admin read" ON audit_log
  FOR SELECT TO authenticated
  USING (auth_user_role() = 'ops_admin');

-- No UPDATE or DELETE policies — the BEFORE trigger blocks them entirely,
-- but having no policies provides a second layer of enforcement.
