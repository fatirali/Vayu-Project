# Rehearse — Product Requirements Document (PRD)

> Version: 2.0  
> Date: 2026-05-17  
> Status: Draft  
> Author: Fatir Ali  
> Informed by: Wireframe discovery + CTO architecture session (May 1, 2026)

---

## 1. Executive Summary

**Rehearse** is an SMB self-serve SaaS platform where managers practice high-stakes workplace conversations — terminations, PIPs, layoffs, and promotion denials — with trained human actors over live video. After each session, AI-powered analytics and coaching help learners identify patterns and improve.

**Key differentiator:** Human actors (not AI) portray realistic emotional responses using a scripted dramatic arc with calibrated pushback tiers. The emotional realism of a trained actor cannot be replicated by chatbots or peer role-play.

**Go-to-market:** SMB self-serve. Individual managers and small L&D teams sign up, book sessions, and pay per use. No enterprise sales motion, no SAML/SSO, no SOC 2 certification at launch.

**Launch scale:** ~10 sessions/week. Infrastructure budget ~$70-90/month.

---

## 2. Problem Statement

Managers face high-stakes conversations (terminations, PIPs, layoffs, delivering bad news) with zero safe practice environment. The consequences of poor delivery include:

- Legal exposure from imprecise language
- Employee distress from unclear or overly hedged messaging
- Manager avoidance leading to delayed/undelivered feedback
- Organizational trust erosion from poorly handled separations

Current solutions (reading articles, HR coaching sessions, peer role-play) lack emotional realism. Managers need to feel the weight of a real human reaction before they deliver these conversations to actual employees.

---

## 3. Target Users

### 3.1 Learners (Primary buyer)

| Persona | Description |
|---------|-------------|
| **People Manager** | First-time or experienced managers delivering difficult conversations |
| **Director, People Ops** | Senior leaders who deliver or coach others on these conversations |
| **HR Business Partner** | Advisors who need to model best-practice delivery |
| **L&D Manager** | Training professionals building organizational capability |
| **VP / C-suite** | Executives handling sensitive communications at scale |

**Acquisition:** Self-serve signup. No sales call required. Free trial or first-session-free model (pricing TBD).

### 3.2 Actors (Supply side)

Trained improvisational actors or coaches who portray realistic counterpart characters. They follow scripted dramatic arcs, calibrated pushback systems, and scenario-specific stage rules. Actors are independent contractors paid per session via Stripe Connect Standard.

**Onboarding:** Self-apply via signup form (LinkedIn URL for verification). Reviewed and approved within 2 business days.

### 3.3 L&D Administrators

Internal L&D teams who author scenarios, manage actor certifications, assign cohorts of learners, and monitor organizational progress.

### 3.4 Platform Operators (Payments & Ops)

Internal team managing actor onboarding, session payments, payout cycles, and financial reporting.

---

## 4. Product Goals & Success Metrics

### Goals

1. **Learner competence** — Measurably improve manager confidence and skill in delivering high-stakes conversations
2. **Emotional realism** — Create practice experiences that feel authentic through trained human actors
3. **Structured progression** — Provide clear skill development paths with session-over-session tracking
4. **Self-serve simplicity** — Learner can go from signup to booked session in under 5 minutes
5. **Actor quality** — Maintain a certified actor bench with consistent performance standards

### Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Learner score improvement | +15pts avg over 5 sessions | Pre/post objective scores |
| Session completion rate | >90% | Booked vs completed |
| Learner return rate | >60% book 2nd session within 14 days | Booking data |
| Actor rating | >4.5/5.0 average | Post-session learner ratings |
| Signup-to-first-booking | <5 min median | Product analytics |
| No-show rate | <10% | Booking vs attendance |

---

## 5. User Journeys

### 5.1 Learner Journey

```
Sign up (instant, email or Google) → Browse scenario library → Book session via Cal.com
→ Read briefing (persona, objectives, legal) → Join live video rehearsal (LiveKit)
→ Session recorded → End session → Post-call transcription + analysis pipeline runs
→ Review analytics (scores, topic coverage, moments) → Chat with AI coach (Ada)
→ Track progress over time
```

### 5.2 Actor Journey

```
Apply (reviewed in 2 business days) → Get certified on scenarios
→ Review character brief + pushback playbook + stage rules
→ See booked sessions on dashboard (via Cal.com availability)
→ Join live session (LiveKit) → Follow dramatic arc + pushback tiers
→ Flag notable moments → Receive weekly payouts via Stripe Connect
```

### 5.3 L&D Admin Journey

```
Author scenario (builder with 7 sections) → Define dramatic arc + pushback tiers
→ Set learner objectives with weights → Configure post-call analysis rules
→ Manage actor certifications (casting matrix) → Create cohorts
→ Assign scenarios to cohorts → Monitor learner progress + insights
→ Review flagged in-session moments
```

---

## 6. Architectural Constraints (from CTO session)

These decisions are locked and inform all feature requirements:

| Decision | Implication |
|----------|-------------|
| **Human actors only** (no AI counterpart) | No realtime AI voice/avatar stack. Off-the-shelf WebRTC + async AI for analytics. |
| **SMB self-serve** (not enterprise B2B) | No SAML/SSO, no SOC 2 day one, no data residency toggles. Supabase Auth is sufficient. |
| **No live transcript during call** | Post-call transcription only (~$0.13/session batch). No real-time nudges, no live filler counting during session. |
| **A/V retention: 30/90 days then transcripts only** | Lifecycle deletion policy mandatory. Privacy-first approach for sensitive conversation recordings. |
| **Cal.com for booking** | No custom calendar/scheduling system. Embed Cal.com with actor availability. |
| **10 sessions/week at launch** | Start on free/Pro tiers everywhere. No reserved capacity needed. |
| **LiveKit Cloud for video** | Not Zoom. LiveKit handles WebRTC + recording egress to storage. Future-proof for AI counterpart mode (LiveKit Agents). |
| **Deepgram Nova-3 batch** | Post-call transcription with diarization. Speaker labels. ~$0.13/session. |
| **Anthropic Claude for coach** | Sonnet for analysis pipeline, Opus for final coach summary. Not OpenAI. |
| **Trigger.dev for background jobs** | Post-call pipeline (download → transcribe → analyze → store). Retries + observability. |

### Key Risks (documented)

1. **Lifecycle deletion is non-negotiable** — Termination convos are extremely sensitive. Alert if the 30/90-day delete job hasn't run in 25 hours.
2. **Two-sided marketplace cold start** — Cal.com must show real actor availability per scenario. If slots are empty, learners bounce.
3. **WebRTC fails in corporate networks** — Need clear fallback UX ("switch networks / use mobile hotspot").
4. **Vendor concentration on Supabase** — DB + auth + storage. Acceptable at this stage; revisit at Series A.
5. **No SOC 2 yet** — Build with audit-friendly patterns from day 1 (immutable audit_log table, no hard deletes on session metadata, just on A/V blobs).

---

## 7. Feature Requirements

### 7.1 Authentication & Onboarding

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| AUTH-1 | Email/password sign-in | P0 | Supabase Auth |
| AUTH-2 | Google OAuth | P0 | Supabase Auth provider |
| AUTH-3 | LinkedIn OAuth | P1 | Supabase Auth provider |
| AUTH-4 | Role selection at signup (Learner vs Actor) | P0 | Determines portal access and signup flow |
| AUTH-5 | Learner instant activation | P0 | No approval required |
| AUTH-6 | Actor application + review flow | P0 | 2 business day review SLA; admin surface in Ops portal |
| AUTH-7 | Actor-specific signup fields (LinkedIn URL, scenario interests, referral) | P0 | LinkedIn URL for verification |
| AUTH-8 | Learner-specific signup fields (company, role) | P1 | Optional company field |
| AUTH-9 | Password reset flow | P1 | Supabase Auth built-in |
| AUTH-10 | Email verification | P1 | Supabase Auth built-in |
| AUTH-11 | Row-Level Security policies | P0 | Learner sees own data only; actor sees own sessions; admin sees org |

### 7.2 Learner App — Scenario Library

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| LIB-1 | Scenario card grid with search | P0 | 3-column layout with title, difficulty, description |
| LIB-2 | Category filter chips | P0 | Terminations, Feedback, Compensation, Restructuring, custom |
| LIB-3 | Difficulty indicators | P1 | Visual scale (dots or similar) |
| LIB-4 | Session metadata (duration, retry policy) | P1 | e.g., "15 min, 1 take" |

### 7.3 Learner App — Booking

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| BOOK-1 | Actor selection with certification display | P0 | Show only actors certified for selected scenario |
| BOOK-2 | Cal.com embed with actor availability | P0 | Real-time availability per actor per scenario |
| BOOK-3 | Booking confirmation panel | P0 | Scenario + actor + date/time + duration |
| BOOK-4 | Post-booking confirmation state | P1 | "You're booked!" with session details + calendar invite |
| BOOK-5 | No-overlap enforcement | P0 | 15 min buffer between actor sessions |
| BOOK-6 | Booking reminder emails | P1 | Via Resend, 24h and 1h before session |

### 7.4 Learner App — Briefing

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| BRIEF-1 | Persona card (name, role, disposition) | P0 | Character the actor will portray |
| BRIEF-2 | Situation description | P0 | Context for the conversation |
| BRIEF-3 | Numbered objectives list | P0 | What the learner should accomplish |
| BRIEF-4 | Legal requirements sidebar | P0 | Compliance guardrails |
| BRIEF-5 | Tone guidelines | P1 | Stylistic guidance |
| BRIEF-6 | "Join session" button (when time arrives) | P0 | Launches LiveKit room |

### 7.5 Learner App — Live Rehearsal

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| CALL-1 | 2-person video stage (LiveKit) | P0 | Actor + learner video tiles, WebRTC |
| CALL-2 | Stage controls (mic, cam, end session) | P0 | Standard video call controls |
| CALL-3 | Session timer | P0 | Duration tracking visible to learner |
| CALL-4 | Session recording (LiveKit egress) | P0 | Automatic, saved to Supabase Storage |
| CALL-5 | Network quality indicator | P1 | Warn if connection is degrading |
| CALL-6 | Fallback UX for corporate networks | P1 | "Switch networks / use mobile hotspot" guidance |
| ~~CALL-7~~ | ~~Live transcript~~ | ~~Deferred~~ | ~~Post-call only per CTO decision~~ |
| ~~CALL-8~~ | ~~Real-time nudge cards~~ | ~~Deferred~~ | ~~Requires live STT; revisit when live transcript ships~~ |

### 7.6 Learner App — Post-Session Analytics

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ANA-1 | KPI cards (overall score, fillers, pace, talk/listen) | P0 | Computed by post-call pipeline |
| ANA-2 | Call timeline with speaker track + flags | P0 | Visual playback representation from transcript |
| ANA-3 | Topic coverage checklist (covered/partial/missed) | P0 | Maps to objectives, computed by Claude Sonnet |
| ANA-4 | Top moments with quotes | P1 | Notable positive/negative moments from transcript |
| ANA-5 | Sentiment tracks | P2 | Emotional arc visualization |
| ANA-6 | Talk/listen ratio donut chart | P1 | Computed from diarization timestamps |
| ANA-7 | "Analytics ready" notification | P0 | Email + in-app when pipeline completes (~2-5 min post-session) |

### 7.7 Learner App — AI Coach (Ada)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| COACH-1 | Chat interface with AI coach | P0 | Powered by Anthropic Claude Opus |
| COACH-2 | Quote cards referencing transcript timestamps | P0 | Coach cites specific moments |
| COACH-3 | "TRY THIS" suggestion cards | P0 | Actionable reframe suggestions |
| COACH-4 | Improvement focus sidebar | P1 | Primary + secondary focus areas |
| COACH-5 | Export options (PDF, Slack, playbook) | P2 | Sharing debrief with stakeholders |
| COACH-6 | Actor rating prompt | P0 | After first coach message, prompt learner to rate actor (1-5) |

### 7.8 Learner App — Progress

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| PROG-1 | Score trend sparkline | P0 | Session-over-session trajectory |
| PROG-2 | Session streak heatmap | P1 | 12-week engagement visualization |
| PROG-3 | Skill progress bars (before/after) | P0 | Per-skill improvement tracking |
| PROG-4 | Session history table | P0 | All past sessions with metadata |

### 7.9 L&D Studio — Scenario Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| LD-1 | Scenario library (card grid) with status | P0 | Published/draft/archived states |
| LD-2 | Scenario builder (7-section form) | P0 | Setup, arc, objectives, character, pushback, rules, nudges |
| LD-3 | Dramatic arc editor (4 phases) | P0 | Phase name, emotion, stance, transition trigger, duration |
| LD-4 | Weighted objectives with 100% sum | P0 | Numbered objectives with percentage weights |
| LD-5 | Character brief editor | P0 | Name, role, backstory, motivation, emotion arc, vocabulary rules |
| LD-6 | Pushback playbook editor (3 tiers + "nailed it") | P0 | Trigger conditions + lettered response options |
| LD-7 | Stage rules (do/don't grid) | P0 | Improv latitude slider, max pause, off-limits topics |
| LD-8 | Post-call analysis rules (trigger → scoring) | P1 | Define how transcript maps to objective scoring |
| LD-9 | Scenario publish/archive workflow | P1 | Status transitions |
| LD-10 | Session rate per scenario | P1 | Actor pay rate configuration |

### 7.10 L&D Studio — Actor Coaching

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| LDACT-1 | Casting matrix (actor x scenario) | P0 | Certified / in-training / not-assigned states |
| LDACT-2 | Notes thread (L&D ↔ actor) | P1 | Communication channel |
| LDACT-3 | Review queue for flagged moments | P0 | Approve/review/comment actions |
| LDACT-4 | Actor roster summary | P1 | Overview of all actors |

### 7.11 L&D Studio — Cohorts

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| COH-1 | Cohort list with selection | P0 | Browse and manage cohorts |
| COH-2 | Assign scenarios to cohort | P0 | Multi-scenario assignment |
| COH-3 | Learner progress table | P0 | Per-learner: progress, avg score, status |
| COH-4 | Cohort due dates | P1 | Deadline tracking |

### 7.12 L&D Studio — Insights

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| INS-1 | Aggregate KPIs (sessions, avg score, avg duration, phase-4 rate) | P0 | Summary cards |
| INS-2 | Phase heatmap (where learners stall) | P1 | Visual pattern detection |
| INS-3 | Common stumble patterns | P1 | Frequency analysis |
| INS-4 | Top scenarios by completion | P1 | Ranked list |

### 7.13 Actor Portal

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ACT-1 | Session dashboard (today + this week) | P0 | Upcoming sessions with details |
| ACT-2 | Character brief view (read-only) | P0 | Persona, emotional state, backstory |
| ACT-3 | Pushback playbook view (read-only) | P0 | Tiered responses with stage directions |
| ACT-4 | Stage rules view (do/don't + when to stop) | P0 | Safety protocols including safeword |
| ACT-5 | In-session view (phase tracker + script suggestions) | P0 | Live guidance during session |
| ACT-6 | Flag-moment button | P0 | Mark notable moments during session |
| ACT-7 | Quick reference sidebar (emotion, don'ts, facts, safeword) | P0 | Glanceable reference |
| ACT-8 | Pushback bank (tap-to-copy responses) | P1 | Quick access to scripted lines |
| ACT-9 | Actor stats (sessions, rating, no-show rate, certifications) | P1 | Personal performance metrics |
| ACT-10 | Next payout summary | P1 | Earnings visibility |
| ACT-11 | Cal.com availability management | P0 | Actors set their own availability |

### 7.14 Payments & Ops

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| PAY-1 | Stripe Connect Standard integration | P0 | Actor payout infrastructure |
| PAY-2 | Payments overview with KPIs | P0 | MTD paid, pending, sessions, flagged |
| PAY-3 | Earnings by week chart | P1 | Visual trend |
| PAY-4 | Session log with status (paid/pending/flagged) | P0 | Per-session payment tracking |
| PAY-5 | Actor roster with Stripe status | P0 | Connected/pending/invited states |
| PAY-6 | Stripe onboarding flow (invite → account → verify → payout) | P0 | 4-step onboarding |
| PAY-7 | Payout history with batch IDs | P0 | Weekly payout batches (Monday cron) |
| PAY-8 | Manual payout trigger | P1 | Ad hoc payout capability |
| PAY-9 | Export CSV (session log + payout history) | P1 | Reporting |
| PAY-10 | Actor application review queue | P0 | Approve/reject actor applications |
| PAY-11 | Per-scenario session rate configuration | P1 | Rate per scenario type |

### 7.15 Post-Call Analysis Pipeline

This is a new feature category driven by the "no live transcript" decision. All intelligence runs asynchronously after session end.

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| PIPE-1 | Automatic recording download from LiveKit egress | P0 | Trigger.dev job on session end |
| PIPE-2 | Deepgram batch transcription with diarization | P0 | Speaker-labeled transcript, ~$0.13/session |
| PIPE-3 | Filler word detection | P0 | From Deepgram transcript metadata |
| PIPE-4 | WPM / pace calculation | P0 | From transcript timestamps |
| PIPE-5 | Talk/listen ratio | P0 | From diarization speaker durations |
| PIPE-6 | Objective/topic coverage scoring | P0 | Claude Sonnet evaluates transcript against objectives |
| PIPE-7 | Top moments extraction | P1 | Claude Sonnet identifies notable quotes |
| PIPE-8 | Overall score calculation | P0 | Weighted objective completion → 0-100 |
| PIPE-9 | Pipeline completion notification | P0 | Email + in-app "Your results are ready" |
| PIPE-10 | Pipeline retry on failure | P0 | Trigger.dev built-in retries with alerting |
| PIPE-11 | Pipeline observability | P1 | Logs + duration tracking per step |

### 7.16 Data Retention & Privacy

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| RET-1 | A/V recordings deleted after 30 days (default) | P0 | Supabase Storage lifecycle policy |
| RET-2 | Configurable retention (30 or 90 days) | P1 | Per-organization setting |
| RET-3 | Transcripts retained indefinitely | P0 | Text-only, no PII in transcript itself |
| RET-4 | Deletion job health alert | P0 | Alert if job hasn't run in 25 hours |
| RET-5 | Immutable audit_log table | P0 | No hard deletes on session metadata |
| RET-6 | Soft delete on session metadata, hard delete on A/V blobs only | P0 | Audit-friendly pattern |

---

## 8. Scenario Content Model

Each scenario contains structured content that flows across all portals:

### 8.1 Initial Scenario Types (Seed Content)

| Scenario | Difficulty | Duration | Counterpart | Actor Rate |
|----------|-----------|----------|-------------|-----------|
| Performance termination (end-of-PIP) | Hardest | 15 min, 1 take | Josh Halpern, Senior PM | $54 |
| PIP kickoff | Hard | 15 min, retries ok | Sam Ortiz, Engineer II | $48 |
| Layoff — no fault | Hard | 10 min, 1 take | Priya Desai, Designer | $54 |
| Promotion declined | Medium | 12 min, retries ok | Taylor Kim, Senior Analyst | $42 |
| Denying off-cycle raise | Medium | 10 min | (stub, not fully authored) | TBD |
| Two-directs conflict | Medium | 15 min | (stub, not fully authored) | TBD |

### 8.2 Dramatic Arc System

Every scenario has a 4-phase dramatic arc the actor follows:

1. **Composed** — Calm, professional (actor waits for learner to deliver news)
2. **Stunned** — Shock, processing (triggered by the decision being stated)
3. **Pushback** — Challenge, resistance (calibrated by pushback tiers)
4. **Resigned** — Acceptance, questions about next steps

### 8.3 Pushback Tier System

| Level | Name | Trigger | Pre-approval |
|-------|------|---------|--------------|
| 1 | Soft fumble | Learner hedges or goes off-script | No |
| 2 | Challenge | Learner is unclear or avoids specifics | No |
| 3 | Escalated | Learner fails multiple objectives | Yes (L&D) |
| "Nailed it" | Good response | Learner handles well | No |

---

## 9. Non-Functional Requirements

| Category | Requirement | Notes |
|----------|-------------|-------|
| **Performance** | Video call join <3s | LiveKit SDK pre-initialized on briefing page |
| **Availability** | 99.5% uptime | Acceptable for SMB self-serve at launch |
| **Scalability** | 10 concurrent sessions at launch | Grows with actor bench; LiveKit Cloud scales automatically |
| **Security** | Audit-friendly patterns from day 1 | Immutable audit log, no hard deletes on metadata; SOC 2 deferred to Series A |
| **Privacy** | Recordings encrypted at rest and in transit | Supabase Storage encryption + TLS |
| **Retention** | A/V hard-deleted after 30/90 days | Automated lifecycle policy with health alerting |
| **Accessibility** | WCAG 2.1 AA | Web application standard |
| **Browser support** | Chrome, Safari, Firefox (latest 2 versions) | Modern browsers only; WebRTC required |
| **Network** | Clear fallback UX for corporate firewalls | "Switch networks / use mobile hotspot" guidance |
| **Pipeline latency** | Analytics ready <5 min post-session | Transcription + analysis pipeline target |

---

## 10. Infrastructure & Cost Estimate

### At launch (10 sessions/week)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel | Pro | $20 |
| Supabase | Pro (DB + Auth + Storage) | $25 |
| LiveKit Cloud | Pay-as-you-go | ~$8 |
| Deepgram Nova-3 (batch) | Pay-as-you-go (~40 sessions) | ~$5 |
| Anthropic Claude (coach + analysis) | Pay-as-you-go | ~$10 |
| Trigger.dev | Free tier | $0 |
| Cal.com | Team plan | $12 |
| Stripe Connect | Standard (no platform fee) | $0 |
| Resend | Free tier | $0 |
| Sentry + PostHog | Free tiers | $0 |
| **Total** | | **~$80/mo** |

**Stays under $200/mo until ~200 sessions/week.**

---

## 11. Open Questions & Decisions Needed

| # | Question | Impact | Proposed Resolution |
|---|----------|--------|---------------------|
| 1 | Where does learner rate the actor post-session? | UX gap — no rating UI in wireframes | Prompt in coach chat after first AI message |
| 2 | Scoring: 0-100 (learner) vs 0-5 (L&D/ops)? | Data model confusion | 0-100 is objective score (computed); 0-5 is actor rating (manual). Different metrics. |
| 3 | Safeword "Pause scene" — what's the resume flow? | Safety protocol gap | Actor calls pause → recording stops → both stay on call → actor clicks "Resume" to restart |
| 4 | Level 3 pre-approval — per-session or global? | Workflow design | Per-scenario setting (L&D builder toggle), not per-session |
| 5 | Cohort enrollment — how are learners added? | L&D workflow gap | Manual invite by email + optional company-domain auto-enroll |
| 6 | Currency handling — always CAD? | Financial architecture | Per-actor based on Stripe account country; display in local currency |
| 7 | Pricing model for learners | Revenue model | Per-session, subscription, or credits? TBD. |
| 8 | Cal.com ↔ scenario linking | Booking UX | How does Cal.com know which scenario was selected? Custom booking flow needed. |
| 9 | Pipeline failure → learner experience | Error handling | Show "Processing taking longer than expected" after 10 min; manual retry in ops |
| 10 | WebRTC TURN server for corporate networks | Reliability | LiveKit provides TURN, but test with major enterprise firewalls |

---

## 12. Phased Delivery Plan

### Phase 1 — MVP (Weeks 1-8)

**Goal:** First learner completes a session and sees analytics.

- Auth (email/password + Google OAuth via Supabase)
- Scenario library (4 seed scenarios, read-only)
- Booking via Cal.com embed (actor selection + availability)
- Briefing view (persona, objectives, legal)
- Live video session (LiveKit, 2-person, recorded)
- Post-call pipeline (Trigger.dev → Deepgram → Claude Sonnet → scores)
- Post-session analytics (KPIs + topic coverage + moments)
- Actor portal (dashboard + character brief + pushback playbook + stage rules)
- Stripe Connect actor payouts (weekly cron)
- Data retention lifecycle (30-day A/V deletion)

**Not in Phase 1:** AI coach, progress tracking, L&D builder, cohorts, insights, live transcript, real-time nudges.

### Phase 2 — Coaching & Progression (Weeks 9-14)

**Goal:** Learners return and improve over multiple sessions.

- AI Coach (Ada) powered by Claude Opus with transcript-referenced suggestions
- Learner progress tracking (sparkline + skills + session history)
- Actor in-session view with phase tracker
- Learner actor rating (post-session)
- Actor stats dashboard (sessions, rating, certifications)
- LinkedIn OAuth
- Booking reminder emails (Resend)

### Phase 3 — L&D Tools & Scale (Weeks 15-20)

**Goal:** L&D teams can author and deploy custom scenarios.

- L&D scenario builder (7-section form)
- Cohort management (create, assign scenarios, track progress)
- Casting matrix (actor ↔ scenario certification)
- Flagged moment review queue
- Insights dashboard (aggregate analytics)
- Export/sharing (PDF debrief)
- Payout history + CSV exports

### Phase 4 — Future (Post-launch)

- Live transcript during session (Deepgram streaming, ~$0.40/hr)
- Real-time nudge cards (requires live STT)
- AI counterpart mode (LiveKit Agents + voice AI — entirely new product surface)
- Enterprise features (SAML SSO, SOC 2, data residency, audit log access)
- Session recording playback (video player with synced transcript)
- Slack integration for coach exports

---

## 13. Out of Scope (v1)

- AI-generated actors / AI counterpart mode (human-actor-only)
- Live transcript during session (post-call only)
- Real-time coaching nudges (requires live STT)
- Mobile native apps (web-only)
- Multi-language support
- Enterprise features (SAML/SSO, SOC 2, data residency)
- Custom branding per customer
- Session recording video playback (transcript + analytics only)
- Integration with HRIS systems
- Marketplace/self-serve actor onboarding (manual review required)

---

## 14. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Web app + API | Next.js 15 (App Router) on Vercel |
| DB + Auth + Storage | Supabase (Postgres + Auth + Storage + RLS) |
| 1:1 video + recording | LiveKit Cloud |
| Transcription (post-call) | Deepgram Nova-3 batch with diarization |
| Coach + analytics | Anthropic Claude (Sonnet for analysis, Opus for coach) |
| Booking | Cal.com embed |
| Payments | Stripe Connect Standard |
| Background jobs | Trigger.dev v3 |
| Email | Resend |
| Errors | Sentry |
| Product analytics | PostHog |

---

*This PRD incorporates decisions from the CTO architecture session (May 1, 2026) and wireframe discovery analysis. Version 2.0 supersedes the original PRD which assumed enterprise B2B positioning and live transcription.*
