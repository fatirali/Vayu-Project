-- =============================================================================
-- Rehearse — Initial Schema
-- Migration: 20260517000001_initial_schema.sql
-- =============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('learner', 'actor', 'ld_admin', 'ops_admin');
CREATE TYPE scenario_category AS ENUM ('termination', 'feedback', 'compensation', 'restructuring');
CREATE TYPE scenario_difficulty AS ENUM ('easy', 'medium', 'hard', 'hardest');
CREATE TYPE scenario_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE session_status AS ENUM ('booked', 'confirmed', 'live', 'completed', 'cancelled', 'no_show');
CREATE TYPE speaker AS ENUM ('learner', 'actor');
CREATE TYPE topic_coverage_status AS ENUM ('covered', 'partial', 'missed');
CREATE TYPE flagged_moment_type AS ENUM ('great', 'break', 'note');
CREATE TYPE flagged_moment_review_status AS ENUM ('pending', 'reviewed', 'dismissed');
CREATE TYPE actor_certification_status AS ENUM ('certified', 'in_training', 'not_assigned');
CREATE TYPE payout_status AS ENUM ('pending', 'transit', 'paid', 'failed');
CREATE TYPE session_payment_status AS ENUM ('pending', 'paid', 'flagged');
CREATE TYPE stage_rule_type AS ENUM ('do', 'dont');
CREATE TYPE cohort_status AS ENUM ('drafting', 'active', 'completed');
CREATE TYPE cohort_learner_status AS ENUM ('not_started', 'in_progress', 'at_risk', 'done');

-- ── users ─────────────────────────────────────────────────────────────────────
-- id matches auth.users.id (populated by handle_new_user trigger in next migration)

CREATE TABLE users (
  id                    UUID PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  role                  user_role NOT NULL,
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  -- Learner-only
  company               TEXT,
  job_title             TEXT,
  -- Actor-only
  linkedin_url          TEXT,
  actor_interests       TEXT[],
  referral_source       TEXT,
  approved_at           TIMESTAMPTZ,
  cal_com_username      TEXT,
  stripe_account_id     TEXT,
  stripe_payout_enabled TEXT,  -- 'true' | 'false' | NULL
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── scenarios ────────────────────────────────────────────────────────────────

CREATE TABLE scenarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  subtitle         TEXT NOT NULL,
  category         scenario_category NOT NULL,
  difficulty       scenario_difficulty NOT NULL,
  status           scenario_status NOT NULL DEFAULT 'draft',
  situation        TEXT NOT NULL,
  target_duration  TEXT NOT NULL,
  retry_policy     TEXT NOT NULL,
  session_rate     TEXT NOT NULL,  -- actor pay rate e.g. '54.00'
  improv_latitude  INT NOT NULL DEFAULT 50,
  max_pause_length INT NOT NULL DEFAULT 8,
  off_limits_topics TEXT,
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── personas ─────────────────────────────────────────────────────────────────

CREATE TABLE personas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     UUID NOT NULL UNIQUE REFERENCES scenarios(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  disposition     TEXT NOT NULL,
  emotional_state TEXT NOT NULL,
  backstory       JSONB NOT NULL DEFAULT '{}',
  motivation      TEXT NOT NULL,
  emotion_arc     TEXT NOT NULL,
  dont_list       TEXT[] NOT NULL DEFAULT '{}',
  allowed_facts   TEXT[] NOT NULL DEFAULT '{}',
  vocabulary_do   TEXT[] NOT NULL DEFAULT '{}',
  vocabulary_dont TEXT[] NOT NULL DEFAULT '{}'
);

-- ── dramatic_arc_phases ───────────────────────────────────────────────────────

CREATE TABLE dramatic_arc_phases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id       UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  phase_number      INT NOT NULL CHECK (phase_number BETWEEN 1 AND 4),
  name              TEXT NOT NULL,
  emotion           TEXT NOT NULL,
  stance            TEXT NOT NULL,
  moves_on_when     TEXT NOT NULL,
  duration_estimate TEXT NOT NULL,
  UNIQUE (scenario_id, phase_number)
);

-- ── objectives ───────────────────────────────────────────────────────────────

CREATE TABLE objectives (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  number      INT NOT NULL,
  text        TEXT NOT NULL,
  weight      INT NOT NULL CHECK (weight > 0 AND weight <= 100),
  UNIQUE (scenario_id, number)
);

-- ── legal_requirements ───────────────────────────────────────────────────────

CREATE TABLE legal_requirements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ── pushback_tiers ───────────────────────────────────────────────────────────
-- level: 0 = "Nailed it", 1 = Soft fumble, 2 = Challenge, 3 = Escalated

CREATE TABLE pushback_tiers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id          UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  level                INT NOT NULL CHECK (level BETWEEN 0 AND 3),
  level_label          TEXT NOT NULL,
  trigger              TEXT NOT NULL,
  requires_pre_approval BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (scenario_id, level)
);

-- ── pushback_responses ───────────────────────────────────────────────────────

CREATE TABLE pushback_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id         UUID NOT NULL REFERENCES pushback_tiers(id) ON DELETE CASCADE,
  letter          CHAR(1) NOT NULL,
  text            TEXT NOT NULL,
  stage_direction TEXT
);

-- ── coach_nudges ─────────────────────────────────────────────────────────────

CREATE TABLE coach_nudges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id       UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  trigger_condition TEXT NOT NULL,
  nudge_text        TEXT NOT NULL,
  sort_order        INT NOT NULL DEFAULT 0
);

-- ── stage_rules ──────────────────────────────────────────────────────────────

CREATE TABLE stage_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  type        stage_rule_type NOT NULL,
  text        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ── actor_certifications ─────────────────────────────────────────────────────

CREATE TABLE actor_certifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id  UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  status       actor_certification_status NOT NULL DEFAULT 'not_assigned',
  certified_at TIMESTAMPTZ,
  UNIQUE (actor_id, scenario_id)
);

-- ── sessions ─────────────────────────────────────────────────────────────────

CREATE TABLE sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id           UUID NOT NULL REFERENCES scenarios(id),
  learner_id            UUID NOT NULL REFERENCES users(id),
  actor_id              UUID NOT NULL REFERENCES users(id),
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration              INT NOT NULL,
  cal_com_booking_id    TEXT,
  livekit_room_id       TEXT,
  recording_path        TEXT,
  analytics_ready       TEXT,   -- 'true' | NULL
  analytics_error       TEXT,
  deepgram_request_id   TEXT,
  learner_speaker_index INT,    -- 0 or 1 from LiveKit participant order
  status                session_status NOT NULL DEFAULT 'booked',
  started_at            TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  recording_deleted_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── session_scores ───────────────────────────────────────────────────────────

CREATE TABLE session_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  overall_score   INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  filler_count    INT NOT NULL DEFAULT 0,
  pace_wpm        INT NOT NULL DEFAULT 0,
  talk_ratio      DECIMAL(4,3) NOT NULL,
  duration_actual INT NOT NULL DEFAULT 0
);

-- ── transcript_lines ─────────────────────────────────────────────────────────

CREATE TABLE transcript_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp    TEXT NOT NULL,
  speaker      speaker NOT NULL,
  text         TEXT NOT NULL,
  filler_words TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transcript_lines_session ON transcript_lines(session_id);

-- ── topic_coverage ───────────────────────────────────────────────────────────

CREATE TABLE topic_coverage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES objectives(id),
  status       topic_coverage_status NOT NULL,
  covered_at   TEXT
);

CREATE INDEX idx_topic_coverage_session ON topic_coverage(session_id);

-- ── flagged_moments ──────────────────────────────────────────────────────────

CREATE TABLE flagged_moments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  flagged_by    UUID NOT NULL REFERENCES users(id),
  type          flagged_moment_type NOT NULL,
  timestamp     TEXT NOT NULL,
  note          TEXT,
  review_status flagged_moment_review_status NOT NULL DEFAULT 'pending'
);

-- ── coach_conversations ──────────────────────────────────────────────────────

CREATE TABLE coach_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  messages   TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── cohorts ──────────────────────────────────────────────────────────────────

CREATE TABLE cohorts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  status     cohort_status NOT NULL DEFAULT 'drafting',
  due_date   DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── cohort_scenarios ─────────────────────────────────────────────────────────

CREATE TABLE cohort_scenarios (
  cohort_id   UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  PRIMARY KEY (cohort_id, scenario_id)
);

-- ── cohort_learners ──────────────────────────────────────────────────────────

CREATE TABLE cohort_learners (
  cohort_id  UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     cohort_learner_status NOT NULL DEFAULT 'not_started',
  PRIMARY KEY (cohort_id, learner_id)
);

-- ── payouts ──────────────────────────────────────────────────────────────────

CREATE TABLE payouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  recipient_count  INT NOT NULL DEFAULT 0,
  session_count    INT NOT NULL DEFAULT 0,
  total_amount     DECIMAL(10,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'CAD',
  stripe_batch_id  TEXT,
  status           payout_status NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── session_payments ─────────────────────────────────────────────────────────

CREATE TABLE session_payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id),
  actor_id   UUID NOT NULL REFERENCES users(id),
  payout_id  UUID REFERENCES payouts(id),
  rate       DECIMAL(8,2) NOT NULL,
  amount     DECIMAL(8,2) NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'CAD',
  status     session_payment_status NOT NULL DEFAULT 'pending'
);

-- ── audit_log ────────────────────────────────────────────────────────────────
-- Immutable: BEFORE UPDATE/DELETE trigger raises exception (see next migration)

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
