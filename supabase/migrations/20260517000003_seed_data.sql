-- =============================================================================
-- Rehearse — Seed Data
-- Migration: 20260517000003_seed_data.sql
--
-- Seeds 4 published scenarios with full content, 4 actor users,
-- actor_certifications, and 2 stub (draft) scenarios.
-- All from SCEN_DATA in wireframe discovery.
-- =============================================================================

-- ── Seed admin user (system actor for created_by FK) ─────────────────────────
-- This is a system user only — never a real auth.users row.
-- Scenarios reference this as their creator.
-- ops_admin accounts are provisioned separately via Supabase dashboard.

INSERT INTO users (id, email, role, first_name, last_name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system@rehearse.app',
  'ops_admin',
  'System',
  'Rehearse',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ── Seed actor accounts ───────────────────────────────────────────────────────
-- These map to the ACTORS array from Rehearse.html:2005–2010
-- Real auth.users entries must be created separately in Supabase Auth;
-- these rows cover the public.users data.

INSERT INTO users (id, email, role, first_name, last_name, approved_at, created_at) VALUES
  ('00000000-0000-0000-0000-000000000010', 'jordan@rehearse.app',  'actor', 'Jordan', 'Hall',  NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'amara@rehearse.app',   'actor', 'Amara',  'Osei',  NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'sam@rehearse.app',     'actor', 'Sam',    'Torres',NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', 'priya@rehearse.app',   'actor', 'Priya',  'Mehta', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Scenario 1: Performance Termination ──────────────────────────────────────

INSERT INTO scenarios (id, slug, title, subtitle, category, difficulty, status,
  situation, target_duration, retry_policy, session_rate, improv_latitude,
  max_pause_length, created_by)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'termination',
  'Performance termination',
  'End-of-PIP separation',
  'termination',
  'hardest',
  'published',
  'Josh has been on a Performance Improvement Plan for 90 days. Goals were clear, written, and reviewed weekly. He met 2 of 6 milestones. Legal and HR have signed off on separation. Today''s conversation is about <strong>ending his employment respectfully, clearly, and without ambiguity</strong>.',
  '18–25 min',
  '1 take',
  '54.00',
  40,
  8,
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO personas (scenario_id, name, role, disposition, emotional_state, backstory,
  motivation, emotion_arc, dont_list, allowed_facts, vocabulary_do, vocabulary_dont)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Josh Halpern',
  'Senior PM · 4 yrs at company',
  'Likely defensive',
  'Josh is holding it together on the surface but is bracing for bad news. He''s been on the PIP for 90 days and knows he''s underperformed, but is hoping the conversation is a check-in, not a termination.',
  '{"team": "Product, 12 people. Josh was the most senior IC.", "milestones": "Missed 4 of 6 PIP milestones. Delivered 2 features late with significant rework.", "outsideView": "Well-liked by peers but known to over-promise. Manager gave him multiple chances.", "homeLife": "Recently married, just bought a house. This job loss is devastating timing."}',
  'Josh wants to keep his job. Failing that, he wants clarity, dignity, and a fair severance.',
  'Composed → Stunned → Pushback → Resigned',
  ARRAY['cry', 'threaten legal action', 'forgive too quickly', 'beg'],
  ARRAY['The PIP goals were documented', 'He met 2 of 6 milestones', 'Severance is 8 weeks', 'Last day is end of month', 'Benefits continue through the month'],
  ARRAY['I understand', 'I hear you', 'I want to be clear'],
  ARRAY['just', 'kind of', 'sort of', 'like I said']
);

INSERT INTO dramatic_arc_phases (scenario_id, phase_number, name, emotion, stance, moves_on_when, duration_estimate)
VALUES
  ('10000000-0000-0000-0000-000000000001', 1, 'Composed',  'Calm / professional',        'Wait for the learner to deliver news. Don''t fill silence. Respond minimally.',             'Learner states the decision clearly.',               '~2 min'),
  ('10000000-0000-0000-0000-000000000001', 2, 'Stunned',   'Shock / processing',          'Let the news land. Respond with short phrases: "Okay." "…alright." Allow silences.',       'Learner gives Josh space to react.',                 '~3 min'),
  ('10000000-0000-0000-0000-000000000001', 3, 'Pushback',  'Challenge / resistance',      'Push back on severance terms, process fairness, or ambiguity. Use calibrated tier.',       'Learner handles pushback with clarity and empathy.', '~5 min'),
  ('10000000-0000-0000-0000-000000000001', 4, 'Resigned',  'Acceptance / practical mode', 'Shift to practical questions: laptop, references, announcement, benefits end date.',        'Learner confirms logistics cleanly.',                '~5 min');

INSERT INTO objectives (scenario_id, number, text, weight) VALUES
  ('10000000-0000-0000-0000-000000000001', 1, 'State the decision within the first 90 seconds.', 25),
  ('10000000-0000-0000-0000-000000000001', 2, 'Reference the PIP and specific milestones missed.', 20),
  ('10000000-0000-0000-0000-000000000001', 3, 'Explain severance, benefits, and final day.', 20),
  ('10000000-0000-0000-0000-000000000001', 4, 'Give Josh space to react — don''t over-explain.', 20),
  ('10000000-0000-0000-0000-000000000001', 5, 'Confirm logistics: laptop, access, announcement.', 15);

INSERT INTO legal_requirements (scenario_id, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Reference the signed PIP document.', 1),
  ('10000000-0000-0000-0000-000000000001', 'Disclose severance in writing, not verbally alone.', 2),
  ('10000000-0000-0000-0000-000000000001', 'Offer COBRA / benefits continuation.', 3),
  ('10000000-0000-0000-0000-000000000001', 'No references to protected class.', 4),
  ('10000000-0000-0000-0000-000000000001', 'Read the separation letter verbatim.', 5);

INSERT INTO pushback_tiers (id, scenario_id, level, level_label, trigger, requires_pre_approval) VALUES
  ('t1000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0, 'Nailed it',    'Learner opens with the decision clearly and gives Josh space to react.',        false),
  ('t1000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'Soft fumble',  'Learner hedges the opening or buries the decision in context.',                 false),
  ('t1000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 2, 'Challenge',    'Learner is vague on severance terms or avoids specific PIP milestones.',        false),
  ('t1000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 3, 'Escalated',    'Learner fails to name the decision, avoids legal requirements, or over-hedges.', true);

INSERT INTO pushback_responses (tier_id, letter, text, stage_direction) VALUES
  ('t1000001-0000-0000-0000-000000000001', 'A', 'Okay. I appreciate you telling me directly.', 'Settle. Shift to practical mode.'),
  ('t1000001-0000-0000-0000-000000000002', 'A', 'Wait — are you saying this is about the PIP? Or something else?', 'Confused, seeking clarity.'),
  ('t1000001-0000-0000-0000-000000000002', 'B', 'I''m not sure I understand what you''re telling me.', 'Flat, slightly frustrated.'),
  ('t1000001-0000-0000-0000-000000000003', 'A', 'Eight weeks — is that the standard? I''ve been here four years.', 'Measured challenge. Not angry yet.'),
  ('t1000001-0000-0000-0000-000000000003', 'B', 'Which milestones exactly? I thought the last review went okay.', 'Pushing back on specifics.'),
  ('t1000001-0000-0000-0000-000000000003', 'C', 'I feel like this is coming out of nowhere.', 'Hurt and confused.'),
  ('t1000001-0000-0000-0000-000000000004', 'A', 'I''m going to need you to be very clear with me. Am I being fired?', 'Firm, direct, slightly raised voice.'),
  ('t1000001-0000-0000-0000-000000000004', 'B', 'I''d like to have HR on this call if we''re going to have this conversation.', 'Assertive. Defensive.'),
  ('t1000001-0000-0000-0000-000000000004', 'C', 'I''m not signing anything today.', 'Guarded. Arms crossed energy.');

INSERT INTO stage_rules (scenario_id, type, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'do',   'Wait for the learner to speak first.', 1),
  ('10000000-0000-0000-0000-000000000001', 'do',   'Let silences breathe — don''t fill them.', 2),
  ('10000000-0000-0000-0000-000000000001', 'do',   'Match the learner''s emotional register.', 3),
  ('10000000-0000-0000-0000-000000000001', 'do',   'Shift to practical questions in phase 4.', 4),
  ('10000000-0000-0000-0000-000000000001', 'do',   'Use short responses in phase 2 (stunned).', 5),
  ('10000000-0000-0000-0000-000000000001', 'dont', 'Don''t cry.', 1),
  ('10000000-0000-0000-0000-000000000001', 'dont', 'Don''t threaten legal action (level 3 only with L&D approval).', 2),
  ('10000000-0000-0000-0000-000000000001', 'dont', 'Don''t forgive or accept too quickly before phase 4.', 3),
  ('10000000-0000-0000-0000-000000000001', 'dont', 'Don''t reference protected characteristics.', 4),
  ('10000000-0000-0000-0000-000000000001', 'dont', 'Don''t break character to coach or help the learner.', 5);

INSERT INTO coach_nudges (scenario_id, trigger_condition, nudge_text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Learner has not stated the decision in the first 90 seconds', 'Lead with the decision. Say it plainly, then explain.', 1),
  ('10000000-0000-0000-0000-000000000001', 'Filler words exceed 8 in 60 seconds', 'Slow down. Land your sentences before continuing.', 2),
  ('10000000-0000-0000-0000-000000000001', 'Learner has not mentioned severance after 8 minutes', 'Cover severance terms now — benefits, final day, written letter.', 3);

-- ── Scenario 2: PIP Kickoff ───────────────────────────────────────────────────

INSERT INTO scenarios (id, slug, title, subtitle, category, difficulty, status,
  situation, target_duration, retry_policy, session_rate, improv_latitude,
  max_pause_length, created_by)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'pip',
  'Performance Improvement Plan',
  'Kickoff the PIP',
  'feedback',
  'hard',
  'published',
  'Sam has missed 3 sprint commitments and received mixed peer feedback. You''ve decided to put them on a 60-day PIP with concrete, measurable goals. Today''s conversation is about <strong>being clear it''s serious, being clear it''s survivable, and being specific about what success looks like</strong>.',
  '15–20 min',
  'retries ok',
  '48.00',
  50,
  10,
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO personas (scenario_id, name, role, disposition, emotional_state, backstory,
  motivation, emotion_arc, dont_list, allowed_facts, vocabulary_do, vocabulary_dont)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'Sam Ortiz',
  'Engineer II · 18 mo at company',
  'Likely surprised',
  'Sam is caught off guard. They knew performance wasn''t perfect but didn''t expect a formal PIP. There''s anxiety under the surface, but they''re trying to stay professional and understand what''s happening.',
  '{"team": "Engineering, 8 people. Sam is mid-level, not a strong performer but not a bad one.", "milestones": "Missed 3 of last 4 sprint commitments. Peer feedback cited communication and pairing gaps.", "outsideView": "Colleagues like Sam personally but feel they sometimes disappear. Manager has had 2 informal check-ins already.", "homeLife": "Single, no major life complications. Fairly early career — this feels existential."}',
  'Sam wants to understand what went wrong and whether they can survive this.',
  'Composed → Stunned → Pushback → Resigned',
  ARRAY['walk out', 'become hostile', 'deny all facts entirely'],
  ARRAY['3 sprint misses documented', '60-day plan', '4 measurable goals', 'HR is aware', 'Weekly check-ins planned'],
  ARRAY['I understand', 'That''s fair', 'What do I need to do'],
  ARRAY['whatever', 'fine', 'if you say so']
);

INSERT INTO dramatic_arc_phases (scenario_id, phase_number, name, emotion, stance, moves_on_when, duration_estimate)
VALUES
  ('10000000-0000-0000-0000-000000000002', 1, 'Composed',  'Professional / wary',    'Cooperative but watchful. Short responses. Wait for the full picture.',                  'Learner names the PIP explicitly.',                   '~2 min'),
  ('10000000-0000-0000-0000-000000000002', 2, 'Stunned',   'Shock / quiet',           'Process. Ask clarifying questions. "Why a PIP and not a conversation?"',                 'Learner gives concrete examples.',                    '~3 min'),
  ('10000000-0000-0000-0000-000000000002', 3, 'Pushback',  'Confused / pushing back', 'Challenge vague or missing goal details. Ask what happens if they succeed or fail.',      'Learner covers goals, timeline, and consequences.',   '~5 min'),
  ('10000000-0000-0000-0000-000000000002', 4, 'Resigned',  'Acceptance / focused',    'Accept the plan. Shift to "what do I need to do?" Ask about resources and check-ins.',   'Learner commits to support and cadence.',             '~5 min');

INSERT INTO objectives (scenario_id, number, text, weight) VALUES
  ('10000000-0000-0000-0000-000000000002', 1, 'Name the PIP explicitly — don''t call it a "coaching plan".', 20),
  ('10000000-0000-0000-0000-000000000002', 2, 'Give 2–3 specific examples, not generalities.', 25),
  ('10000000-0000-0000-0000-000000000002', 3, 'Define the 4 measurable goals and dates.', 25),
  ('10000000-0000-0000-0000-000000000002', 4, 'Confirm the weekly check-in cadence.', 15),
  ('10000000-0000-0000-0000-000000000002', 5, 'Make clear that the intent is success, not exit.', 15);

INSERT INTO legal_requirements (scenario_id, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Document the conversation in writing within 24 hours.', 1),
  ('10000000-0000-0000-0000-000000000002', 'Reference the performance policy section.', 2),
  ('10000000-0000-0000-0000-000000000002', 'Note that HR is aware and in support.', 3),
  ('10000000-0000-0000-0000-000000000002', 'No promises of outcome beyond the 60 days.', 4);

INSERT INTO pushback_tiers (id, scenario_id, level, level_label, trigger, requires_pre_approval) VALUES
  ('t2000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 0, 'Nailed it',   'Learner names PIP explicitly, gives specific examples, covers all 4 goals.',  false),
  ('t2000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, 'Soft fumble', 'Learner calls it a "development plan" or "coaching conversation".',            false),
  ('t2000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 2, 'Challenge',   'Learner gives vague goals or doesn''t clarify the consequence of failure.',    false),
  ('t2000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 3, 'Escalated',   'Learner avoids naming the plan or gets defensive when Sam pushes for specifics.', true);

INSERT INTO pushback_responses (tier_id, letter, text, stage_direction) VALUES
  ('t2000001-0000-0000-0000-000000000001', 'A', 'Okay. Thank you for being straight with me. What do I need to do?', 'Settled. Ready to work.'),
  ('t2000001-0000-0000-0000-000000000002', 'A', 'Is this a PIP? I want to make sure I understand what we''re talking about.', 'Calm but precise.'),
  ('t2000001-0000-0000-0000-000000000002', 'B', 'Are there formal consequences if I don''t hit these goals?', 'Direct. Wants clarity.'),
  ('t2000001-0000-0000-0000-000000000003', 'A', 'What happens if I hit 3 of 4 goals? Is that a pass or a fail?', 'Genuinely asking.'),
  ('t2000001-0000-0000-0000-000000000003', 'B', 'You said "measurable goals" — can you be specific? I need to know exactly what I''m being measured on.', 'Pushing for precision.'),
  ('t2000001-0000-0000-0000-000000000004', 'A', 'I''d like to have HR join this conversation if this is a formal PIP.', 'Firm. Slightly defensive.'),
  ('t2000001-0000-0000-0000-000000000004', 'B', 'I''m not sure I agree with the characterisation of my performance.', 'Controlled pushback.');

INSERT INTO stage_rules (scenario_id, type, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000002', 'do',   'Stay professional throughout — this is Sam''s first PIP.', 1),
  ('10000000-0000-0000-0000-000000000002', 'do',   'Ask clarifying questions when the learner is vague.', 2),
  ('10000000-0000-0000-0000-000000000002', 'do',   'Shift to practical/constructive in phase 4.', 3),
  ('10000000-0000-0000-0000-000000000002', 'dont', 'Don''t walk out or become hostile.', 1),
  ('10000000-0000-0000-0000-000000000002', 'dont', 'Don''t deny documented facts.', 2),
  ('10000000-0000-0000-0000-000000000002', 'dont', 'Don''t break character to reassure the learner.', 3);

INSERT INTO coach_nudges (scenario_id, trigger_condition, nudge_text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Learner has not used the word "PIP" in the first 2 minutes', 'Name it explicitly. Say "Performance Improvement Plan."', 1),
  ('10000000-0000-0000-0000-000000000002', 'Learner gives no specific examples in first 5 minutes', 'Give concrete examples now — sprint names, numbers, dates.', 2),
  ('10000000-0000-0000-0000-000000000002', 'Learner has not addressed consequences after 10 minutes', 'State the consequence of not meeting goals. Sam needs both sides.', 3);

-- ── Scenario 3: Layoff — No Fault ────────────────────────────────────────────

INSERT INTO scenarios (id, slug, title, subtitle, category, difficulty, status,
  situation, target_duration, retry_policy, session_rate, improv_latitude,
  max_pause_length, created_by)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'layoff',
  'Layoff — no fault',
  'Individual layoff due to restructuring',
  'termination',
  'hard',
  'published',
  'Priya''s role is being eliminated as part of a restructure. Her performance has been strong. Today''s conversation is about <strong>making it clear this is not about her, delivering the news with dignity, and handling severance and references generously</strong>.',
  '10–15 min',
  '1 take',
  '54.00',
  45,
  8,
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO personas (scenario_id, name, role, disposition, emotional_state, backstory,
  motivation, emotion_arc, dont_list, allowed_facts, vocabulary_do, vocabulary_dont)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'Priya Desai',
  'Designer · 3 yrs at company',
  'Likely shocked',
  'Priya had no idea this was coming. She was just praised in her last review. The news feels deeply unfair even though she understands it''s a business decision. She needs the "not your fault" message to land before she can process anything practical.',
  '{"team": "Design, 6 people. Priya was a senior IC with strong performance reviews.", "milestones": "Led 2 major product redesigns. Recently received a spot bonus.", "outsideView": "Known for quality work and positive attitude. Team favourite.", "homeLife": "Supporting a parent financially. This job loss has real financial stakes."}',
  'Priya wants to understand why and to feel that her years of work were valued.',
  'Composed → Stunned → Pushback → Resigned',
  ARRAY['become angry', 'accuse of discrimination', 'storm out'],
  ARRAY['Role eliminated, not performance', '8 weeks severance', 'Benefits through end of next month', 'LinkedIn recommendation offered', 'Outplacement services available'],
  ARRAY['I''m sorry', 'I want to be honest', 'This isn''t about your work'],
  ARRAY['restructure', 'business decision', 'out of my hands']
);

INSERT INTO dramatic_arc_phases (scenario_id, phase_number, name, emotion, stance, moves_on_when, duration_estimate)
VALUES
  ('10000000-0000-0000-0000-000000000003', 1, 'Composed',  'Unsuspecting / professional', 'Normal meeting energy. Priya doesn''t know what''s coming.',                                    'Learner delivers the news.',                              '~1 min'),
  ('10000000-0000-0000-0000-000000000003', 2, 'Stunned',   'Shock / quiet processing',    '"Oh." Long pause. Short phrases. Let it land.',                                                  'Learner gives Priya space.',                              '~3 min'),
  ('10000000-0000-0000-0000-000000000003', 3, 'Pushback',  'Hurt / seeking meaning',      'Priya asks why her role specifically. Needs to understand the decision, not just accept it.',    'Learner explains clearly without deflecting.',            '~4 min'),
  ('10000000-0000-0000-0000-000000000003', 4, 'Resigned',  'Acceptance / practical',      'Priya shifts to logistics: severance, references, final day, announcement.',                     'Learner covers severance, references, and next steps.',   '~4 min');

INSERT INTO objectives (scenario_id, number, text, weight) VALUES
  ('10000000-0000-0000-0000-000000000003', 1, 'Make it explicit: this is not about performance.', 25),
  ('10000000-0000-0000-0000-000000000003', 2, 'Say it plainly and early.', 20),
  ('10000000-0000-0000-0000-000000000003', 3, 'Cover severance, benefits, and references.', 25),
  ('10000000-0000-0000-0000-000000000003', 4, 'Offer outplacement and LinkedIn recommendation.', 15),
  ('10000000-0000-0000-0000-000000000003', 5, 'Keep the conversation under 15 minutes.', 15);

INSERT INTO legal_requirements (scenario_id, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000003', 'Disclose severance in writing at the end of the call.', 1),
  ('10000000-0000-0000-0000-000000000003', 'Offer COBRA / benefits continuation.', 2),
  ('10000000-0000-0000-0000-000000000003', 'Confirm WARN Act notice if applicable.', 3),
  ('10000000-0000-0000-0000-000000000003', 'No references to protected class.', 4),
  ('10000000-0000-0000-0000-000000000003', 'Send separation letter same day.', 5);

INSERT INTO pushback_tiers (id, scenario_id, level, level_label, trigger, requires_pre_approval) VALUES
  ('t3000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 0, 'Nailed it',   'Learner opens with "not about performance," delivers news plainly, covers severance.',     false),
  ('t3000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 1, 'Soft fumble', 'Learner hedges the "not your fault" message or buries it after logistics.',                false),
  ('t3000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 2, 'Challenge',   'Learner is vague about severance amount or avoids specifics.',                              false),
  ('t3000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 3, 'Escalated',   'Learner fails to state the decision early or deflects Priya''s questions about why.',       true);

INSERT INTO pushback_responses (tier_id, letter, text, stage_direction) VALUES
  ('t3000001-0000-0000-0000-000000000001', 'A', '…okay. Thank you for telling me that first. Can you walk me through what this means?', 'Absorbing. Beginning to process.'),
  ('t3000001-0000-0000-0000-000000000002', 'A', 'I just want to make sure I understand — is this about my performance?', 'Quiet but direct.'),
  ('t3000001-0000-0000-0000-000000000002', 'B', 'I''m confused. My last review was positive.', 'Genuinely confused.'),
  ('t3000001-0000-0000-0000-000000000003', 'A', 'How many weeks of severance? I want the exact number.', 'Composed. Needs specifics.'),
  ('t3000001-0000-0000-0000-000000000003', 'B', 'What does "competitive severance" mean exactly?', 'Gently pressing.'),
  ('t3000001-0000-0000-0000-000000000004', 'A', 'Why my role specifically? There are other designers.', 'Hurt. Needs an answer.'),
  ('t3000001-0000-0000-0000-000000000004', 'B', 'I''d like to understand the criteria used to select roles for elimination.', 'Controlled. Formal.'),
  ('t3000001-0000-0000-0000-000000000004', 'C', 'Is there any appeal process?', 'Searching for options.');

INSERT INTO stage_rules (scenario_id, type, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000003', 'do',   'Give the "not performance" message time to land before moving on.', 1),
  ('10000000-0000-0000-0000-000000000003', 'do',   'Allow silences in phase 2 — this news is hard.', 2),
  ('10000000-0000-0000-0000-000000000003', 'do',   'Be warm but not patronising.', 3),
  ('10000000-0000-0000-0000-000000000003', 'dont', 'Don''t hint at the news before stating it.', 1),
  ('10000000-0000-0000-0000-000000000003', 'dont', 'Don''t reference other employees or roles.', 2),
  ('10000000-0000-0000-0000-000000000003', 'dont', 'Don''t become hostile or accusatory.', 3);

INSERT INTO coach_nudges (scenario_id, trigger_condition, nudge_text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000003', 'Learner has not said "not about your performance" in first 2 minutes', 'Say it explicitly: "This is not about your performance."', 1),
  ('10000000-0000-0000-0000-000000000003', 'Learner gives vague severance amount', 'Give the exact number. Ambiguity about money is cruel here.', 2);

-- ── Scenario 4: Promotion Declined ───────────────────────────────────────────

INSERT INTO scenarios (id, slug, title, subtitle, category, difficulty, status,
  situation, target_duration, retry_policy, session_rate, improv_latitude,
  max_pause_length, created_by)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  'promotion_denial',
  'Promotion declined',
  'Telling a strong performer no',
  'feedback',
  'medium',
  'published',
  'Taylor submitted a strong promotion packet. The committee declined — not because of Taylor, but because the scope bar moved for this cycle. Today''s conversation is about <strong>giving the decision clearly, making Taylor feel seen, and giving a credible path for next cycle</strong>.',
  '12–18 min',
  'retries ok',
  '42.00',
  60,
  12,
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO personas (scenario_id, name, role, disposition, emotional_state, backstory,
  motivation, emotion_arc, dont_list, allowed_facts, vocabulary_do, vocabulary_dont)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  'Taylor Kim',
  'Senior Analyst · 2 yrs in role',
  'Expecting a yes',
  'Taylor walked in confident. They worked hard on this packet and genuinely believed this was their cycle. The news will sting, but Taylor is a mature professional — they won''t fall apart. They need honesty, not spin.',
  '{"team": "Analytics, 10 people. Taylor is respected and often informally mentors juniors.", "milestones": "Delivered 3 major cross-functional projects this year. Strong 360 feedback.", "outsideView": "Seen as ''next in line.'' Peers expected this promotion.", "homeLife": "Ambitious. Has been planning financially and personally around this promotion."}',
  'Taylor wants to understand exactly why, and what they need to do to get it next cycle.',
  'Composed → Stunned → Pushback → Resigned',
  ARRAY['accuse the manager of bias', 'threaten to quit immediately', 'shut down completely'],
  ARRAY['Promotion packet was strong', 'Bar moved this cycle', 'Decision was committee-level', 'Two specific growth areas identified', 'Next cycle timeline is 6 months'],
  ARRAY['I appreciate your work', 'Let me be specific', 'This isn''t a reflection of your value'],
  ARRAY['keep trying', 'it''ll happen', 'just be patient']
);

INSERT INTO dramatic_arc_phases (scenario_id, phase_number, name, emotion, stance, moves_on_when, duration_estimate)
VALUES
  ('10000000-0000-0000-0000-000000000004', 1, 'Composed',  'Confident / expectant',    'Taylor is upbeat. Brief small talk energy. Waiting for good news.',                         'Learner delivers the decision.',                             '~1 min'),
  ('10000000-0000-0000-0000-000000000004', 2, 'Stunned',   'Deflated / processing',    '"Okay." Short. Absorbing. Maybe a quiet "I wasn''t expecting that."',                       'Learner gives Taylor space and explains the reason.',        '~3 min'),
  ('10000000-0000-0000-0000-000000000004', 3, 'Pushback',  'Seeking clarity / probing','Ask what specifically fell short. Push back gently if the reason feels like a moving target.', 'Learner gives 2–3 specific, actionable growth areas.',    '~5 min'),
  ('10000000-0000-0000-0000-000000000004', 4, 'Resigned',  'Accepted / future-focused','Shift to "okay, what do I need to do?" Ask for a concrete next-cycle commitment.',          'Learner commits to a specific follow-up timeline.',          '~4 min');

INSERT INTO objectives (scenario_id, number, text, weight) VALUES
  ('10000000-0000-0000-0000-000000000004', 1, 'State the decision within 2 minutes.', 20),
  ('10000000-0000-0000-0000-000000000004', 2, 'Explain the why without blaming the committee.', 20),
  ('10000000-0000-0000-0000-000000000004', 3, 'Give 2–3 concrete things that would change the outcome.', 30),
  ('10000000-0000-0000-0000-000000000004', 4, 'Acknowledge the work that went into the packet.', 15),
  ('10000000-0000-0000-0000-000000000004', 5, 'Commit to a specific next-cycle follow-up.', 15);

-- No legal requirements for promotion denial
-- (legal array is empty in SCEN_DATA)

INSERT INTO pushback_tiers (id, scenario_id, level, level_label, trigger, requires_pre_approval) VALUES
  ('t4000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 0, 'Nailed it',   'Learner states decision clearly, owns the bar, gives specific growth areas.',             false),
  ('t4000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 1, 'Soft fumble', 'Learner throws the committee under the bus or gives vague growth feedback.',              false),
  ('t4000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 2, 'Challenge',   'Learner can''t name specific growth areas or is vague about the next-cycle path.',        false),
  ('t4000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 3, 'Escalated',   'Learner deflects all of Taylor''s direct questions or contradicts themselves.',            true);

INSERT INTO pushback_responses (tier_id, letter, text, stage_direction) VALUES
  ('t4000001-0000-0000-0000-000000000001', 'A', 'Okay. I appreciate you being direct. What specifically do I need to do differently?', 'Focused. Ready to work.'),
  ('t4000001-0000-0000-0000-000000000002', 'A', 'What did the committee say exactly? I''d like to understand the feedback directly.', 'Calm but wants specifics.'),
  ('t4000001-0000-0000-0000-000000000002', 'B', 'It sounds like the bar shifted after I submitted. Is that what happened?', 'Gently testing the explanation.'),
  ('t4000001-0000-0000-0000-000000000003', 'A', 'I need more than "cross-team scope." What does that look like concretely?', 'Direct. Slightly frustrated.'),
  ('t4000001-0000-0000-0000-000000000003', 'B', 'What would a strong packet look like next cycle? Can you show me an example?', 'Constructive but pushing.'),
  ('t4000001-0000-0000-0000-000000000004', 'A', 'I want to understand — is this a timing issue, a performance issue, or something else?', 'Precise. Needs a straight answer.'),
  ('t4000001-0000-0000-0000-000000000004', 'B', 'I''m going to be honest — this feels inconsistent with the feedback I''ve been getting.', 'Measured frustration.');

INSERT INTO stage_rules (scenario_id, type, text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000004', 'do',   'Let Taylor ask follow-up questions in phase 3.', 1),
  ('10000000-0000-0000-0000-000000000004', 'do',   'Be genuinely warm — this is a person who worked hard.', 2),
  ('10000000-0000-0000-0000-000000000004', 'do',   'Shift to future-focused in phase 4.', 3),
  ('10000000-0000-0000-0000-000000000004', 'dont', 'Don''t accuse the manager of bias.', 1),
  ('10000000-0000-0000-0000-000000000004', 'dont', 'Don''t threaten to leave immediately.', 2),
  ('10000000-0000-0000-0000-000000000004', 'dont', 'Don''t give vague reassurances ("it''ll happen next time").', 3);

INSERT INTO coach_nudges (scenario_id, trigger_condition, nudge_text, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000004', 'Learner blames the committee rather than owning the bar', 'Own the bar. Don''t deflect to the committee — it undercuts the path forward.', 1),
  ('10000000-0000-0000-0000-000000000004', 'Learner has not given specific growth areas after 7 minutes', 'Give 2 concrete, actionable growth areas now. Taylor needs specifics.', 2),
  ('10000000-0000-0000-0000-000000000004', 'Learner has not committed to a next-cycle timeline', 'Commit to a date. "Let''s check in again in 6 months" is the minimum.', 3);

-- ── Stub scenarios (draft — no persona or objectives yet) ─────────────────────

INSERT INTO scenarios (id, slug, title, subtitle, category, difficulty, status,
  situation, target_duration, retry_policy, session_rate, improv_latitude,
  max_pause_length, created_by)
VALUES
  (
    '10000000-0000-0000-0000-000000000005',
    'raise_denial',
    'Denying an off-cycle raise',
    'Hold the line, stay warm',
    'compensation',
    'medium',
    'draft',
    'Alex asked for an out-of-band salary increase. Budget constraints and policy prevent it this cycle. Today''s conversation is about holding the line while keeping Alex engaged and respected.',
    '10 min',
    'retries ok',
    '42.00',
    60,
    10,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'peer_conflict',
    'Two-directs conflict',
    'Don''t pick a side — set a process',
    'feedback',
    'medium',
    'draft',
    'Two senior engineers are clashing on architecture. You manage both. Today''s conversation is with one of them — the goal is to surface the conflict, stay neutral, and establish a resolution process.',
    '15 min',
    'retries ok',
    '42.00',
    65,
    12,
    '00000000-0000-0000-0000-000000000001'
  );

-- ── Actor certifications ──────────────────────────────────────────────────────
-- From ACTORS array in DISCOVERY.md §3

INSERT INTO actor_certifications (actor_id, scenario_id, status, certified_at) VALUES
  -- Jordan Hall: Termination, Layoff, PIP
  ('00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'certified', NOW()),
  ('00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'certified', NOW()),
  ('00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'certified', NOW()),
  -- Amara Osei: PIP, Promo denial
  ('00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'certified', NOW()),
  ('00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'certified', NOW()),
  -- Sam Torres: Promo denial, Layoff
  ('00000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'certified', NOW()),
  ('00000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'certified', NOW()),
  -- Priya Mehta: Termination
  ('00000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'certified', NOW())
ON CONFLICT (actor_id, scenario_id) DO NOTHING;
