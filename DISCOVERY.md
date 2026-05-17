# Rehearse — Wireframe Discovery Report

> Source: `Rehearse.html`, `Rehearse-ops.html`, `Rehearse-auth.html`, `deck-stage.js`
> Date: 2026-05-13

---

## 1. Screen Inventory

### Rehearse.html — Learner App (7 screens)

| # | `id` | `data-screen-label` | Role | Description |
|---|------|----------------------|------|-------------|
| 1 | `screen-library` | `01 Scenario library` | Learner | 3-column grid of scenario cards with search bar and category filter chips (All / Terminations / Feedback / Compensation / Restructuring / + custom). |
| 2 | `screen-booking` | `02 Book a session` | Learner | 3-column layout: actor roster picker (left), interactive calendar with time slot grid (center), booking summary + confirm panel (right). Includes a post-confirm "You're booked!" state. |
| 3 | `screen-briefing` | `02 Briefing` | Learner | 2-column briefing: persona card with counterpart photo/name/role/tags, situation description, numbered objectives list (left); legal requirements and tone guidelines (right sidebar). |
| 4 | `screen-call` | `03 Live rehearsal` | Learner | 2-column live call: video stage with 2 tiles (actor + you), live transcript with filler-word highlighting, stage controls (mic/cam/notes/end) on left; coach rail with objectives tracker, filler-word meters, pace WPM readout, and silent nudge card on right. |
| 5 | `screen-analytics` | `04 Analytics` | Learner | Post-session debrief: 4 KPI cards (overall score, filler count, pace, talk/listen ratio), call timeline with speaker track + flags, sentiment tracks, donut chart for talk/listen split, topic coverage checklist, top moments grid. |
| 6 | `screen-coach` | `05 Coach` | Learner | Chat interface with "Ada" (AI coach): message bubbles, quote-cards referencing transcript timestamps, "TRY THIS" suggestion cards. Right sidebar: primary/secondary improvement focus, export options (PDF, Slack, playbook). |
| 7 | `screen-progress` | `06 My progress` | Learner | Sparkline score trend over 12 sessions, 12-week streak heatmap grid, skill progress bars with before/after markers, session history table (scenario, score, tone, pace, length). |

### Rehearse-ops.html — Ops Portal (14 screens across 3 sub-apps)

**L&D Studio (5 screens)**

| # | `id` | `data-screen-label` | Role | Description |
|---|------|----------------------|------|-------------|
| 1 | `screen-ld-scenarios` | `01 L&D Scenarios` | L&D | Scenario library with 2-column card grid showing title, summary, completions, avg score, certified actor count, publish status (published/draft/archived), and edit links. |
| 2 | `screen-ld-builder` | `02 Scenario builder` | L&D | Full scenario authoring form with sticky TOC sidebar (7 sections): Setup metadata, Dramatic arc (4-phase editor), Learner objectives with weights summing to 100%, Character brief (name/role/backstory/motivation/emotion arc/don't list/allowed facts/safeword), Pushback playbook (editable tiers with add/remove), Stage rules (do/don't grid + improv latitude slider + max pause + off-limits topics), Coach nudges (trigger condition → nudge text pairs). |
| 3 | `screen-ld-actors` | `03 Actor coaching` | L&D | Casting matrix (actor × scenario certification grid: certified/in-training/not-assigned), notes thread between L&D and actors, review queue for flagged in-session moments (approve/review/comment actions), actor roster summary. |
| 4 | `screen-ld-cohorts` | `04 Cohorts` | L&D | Cohort list (left) with selection, cohort detail showing assigned scenarios, learner progress table (name, progress bar N/M, avg score, last activity, status pill: done/in-progress/at-risk/not-started). |
| 5 | `screen-ld-insights` | `05 Insights` | L&D | 4 KPIs (total sessions, avg score, avg duration, phase-4-reached %), phase heatmap showing where learners stall, common stumble patterns with frequency bars, top filler words, top scenarios by completion rate. |

**Actor Portal (5 screens)**

| # | `id` | `data-screen-label` | Role | Description |
|---|------|----------------------|------|-------------|
| 1 | `screen-actor-dash` | `01 Actor sessions` | Actor | Session cards for today + this week (date block, title, learner name, time, tags/pills), sidebar with actor stats (sessions completed, avg rating, no-show rate, scenarios certified), certify-new-scenarios upsell, next payout summary. |
| 2 | `screen-actor-brief` | `02 Character brief` | Actor | Character card (name, role, emotional state description), 4-phase emotional arc guide, backstory details table (team, milestones, outside view, home life), scenario snapshot (what learner is trying to do), vocabulary rules (do/don't say), flag-for-review button. |
| 3 | `screen-actor-pushback` | `03 Pushback playbook` | Actor | Tiered pushback system: Level 1 (soft fumble), Level 2 (challenge), Level 3 (escalated, requires L&D pre-approval), and "They nailed it" (good response). Each tier has a trigger condition and 2–3 lettered response options with stage directions in italics. Right sidebar: pacing guidance, improvisation rules. |
| 4 | `screen-actor-rules` | `04 Stage rules` | Actor | 2-column do/don't grid (6 rules each), "when to stop a session immediately" (abusive behaviour / real distress / technical failure), safeword system ("Pause scene"), certification status per scenario. |
| 5 | `screen-actor-session` | `05 In-session` | Actor | Phase tracker bar (4 phases, current highlighted), current script suggestion with active line + conditional branches, flag-moment button, live transcript (last 3 turns, read-only). Right sidebar: quick reference (emotion, don'ts, usable facts, safeword), pushback bank (tap-to-copy lines). |

**Payments & Ops (4 screens)**

| # | `id` | `data-screen-label` | Role | Description |
|---|------|----------------------|------|-------------|
| 1 | `screen-pay-overview` | `06 Payments overview` | Payments-ops | Stripe Connect banner (live mode, standard accounts), 4 KPIs (paid MTD, pending payout, sessions this month, flagged/disputed), earnings-by-week bar chart, Stripe onboarding progress (connected/pending/invited). |
| 2 | `screen-pay-sessions` | `07 Session log` | Payments-ops | Data table: date, actor, learner, scenario, duration, rate, amount, status (paid/pending/flagged). Filter pills + Export CSV button. |
| 3 | `screen-pay-roster` | `08 Roster` | Payments-ops | Data table: actor, scenarios, sessions MTD, earned MTD, Stripe status (connected/pending/invited), rating. Right sidebar: Stripe Connect explanation, 4-step onboard flow (invite → Stripe account → identity verified → first payout). |
| 4 | `screen-pay-history` | `09 Payout history` | Payments-ops | Data table: date, period, recipients, sessions, total paid, Stripe batch ID, status. Buttons: Filter, Export CSV, Run manual payout. |

### Rehearse-auth.html — Auth (2 views)

| # | `id` | `data-screen-label` | Role | Description |
|---|------|----------------------|------|-------------|
| 1 | `view-signin` | (none) | Auth | Sign-in form: email + password, "Forgot password?" link, Google/LinkedIn SSO buttons, tab switcher to Create account. |
| 2 | `view-signup` | (none) | Auth | Sign-up form: role picker (Learner vs Actor), shared fields (first/last name, email, password), learner-only fields (company, role dropdown), actor-only fields (LinkedIn URL, scenario chips multi-select, referral source), terms checkbox, role-indicator strip at bottom. |

### Print Files

`Rehearse-print.html` is a near-duplicate of `Rehearse.html` — missing only the booking screen (`screen-booking`). All other screens match. `Rehearse-ops-print.html` has identical screen IDs to `Rehearse-ops.html`. Both are presentation/print-optimized versions of the same wireframes.

### deck-stage.js

A reusable `<deck-stage>` web component for HTML slide decks. Not Rehearse app logic — it's the wireframe presentation wrapper. Handles keyboard navigation, auto-scaling to viewport, localStorage slide persistence, print layout (one slide per page), mobile tap zones, and a slide counter overlay.

---

## 2. Data Shapes Inferred from UI

### Scenario

| Field | Source |
|-------|--------|
| `id` (slug: `termination`, `pip`, `layoff`, `promotion_denial`) | `Rehearse.html:1378–1386` SCENARIOS object |
| `short` (display name) | `Rehearse.html:1390` |
| `long` (subtitle) | `Rehearse.html:1391` |
| `kind` / tags (Termination, Feedback, Compensation, Restructuring) | `Rehearse.html:1741–1747` renderLibrary cards |
| `difficulty` (hardest / hard / medium) | `Rehearse.html:1741` + `Rehearse-ops.html:1699` (●●●○○ scale) |
| `situation` (HTML string, briefing text) | `Rehearse.html:1396` |
| `objectives` (string array, 5 per scenario) | `Rehearse.html:1397–1403` |
| `legal` (string array, legal requirements) | `Rehearse.html:1404–1410` |
| `topics` (array of `{t, s, when}` — topic coverage checklist) | `Rehearse.html:1411–1420` |
| `moments` (array of `{label, quote, note}`) | `Rehearse.html:1421–1425` |
| `transcript` (array of `{t, s, text}` — timestamped lines) | `Rehearse.html:1426–1433` |
| `coachMessages` (array of `{who, text, quote?, suggestion?}`) | `Rehearse.html:1434–1441` |
| `history` (array of `[#, scenario, score, tone, pace, length]`) | `Rehearse.html:1442–1448` |
| `skills` (array of `[name, from, to]` — skill progress) | `Rehearse.html:1449–1455` |
| `learnerRole` (e.g., "Engineering manager M1–M2") | `Rehearse-ops.html:1689` |
| `actorPlays` (e.g., "Direct report — software engineer L4") | `Rehearse-ops.html:1691` |
| `targetDuration` (e.g., "18–25 min") | `Rehearse-ops.html:1695` |
| `improv_latitude` (slider: tight script → free paraphrase) | `Rehearse-ops.html:1967–1974` |
| `maxPauseLength` (e.g., "8 seconds") | `Rehearse-ops.html:1979` |
| `offLimitsTopics` (free text) | `Rehearse-ops.html:1983` |
| `status` (published / draft / archived) | `Rehearse-ops.html:1512` |
| `completions`, `avgScore`, `certifiedActors` | `Rehearse-ops.html:1516–1518` scenario card meta |

**Relationships:**
- Scenario 1:many Objectives (weighted, summing to 100%)
- Scenario 1:many Legal requirements
- Scenario 1:many Topics (coverage checklist)
- Scenario 1:1 Counterpart/Persona
- Scenario 1:many Pushback tiers → 1:many Responses
- Scenario 1:many Coach nudges (trigger → text)
- Scenario 1:many Dramatic arc phases

### Counterpart / Persona

| Field | Source |
|-------|--------|
| `name` | `Rehearse.html:1392` (e.g., "Josh Halpern") |
| `role` | `Rehearse.html:1393` (e.g., "Senior PM · 4 yrs at company") |
| `disposition` | `Rehearse.html:1394` (e.g., "Likely defensive") |
| `emotionalState` (long text) | `Rehearse-ops.html:918–919` character card `.state` |
| `backstory` (structured: team, milestones, outside view, home life) | `Rehearse-ops.html:953–959` |
| `motivation` | `Rehearse-ops.html:1819` L&D builder |
| `emotionArc` | `Rehearse-ops.html:1824` (e.g., "Composed → Stunned → Pushback → Resigned") |
| `dontList` | `Rehearse-ops.html:1828` (e.g., "cry, threaten legal action, forgive too quickly") |
| `allowedFacts` | `Rehearse-ops.html:1832` |
| `vocabularyRules` (do/don't say lists) | `Rehearse-ops.html:977–983` |

**Relationships:**
- Persona belongs-to 1 Scenario
- Persona referenced by Actor brief, Learner briefing

### Dramatic Arc Phase

| Field | Source |
|-------|--------|
| `phaseNumber` (1–4) | `Rehearse-ops.html:1714` |
| `name` (Composed, Stunned, Pushback, Resigned) | `Rehearse-ops.html:1716` |
| `emotion` (e.g., "calm / professional") | `Rehearse-ops.html:1717` |
| `stance` (actor direction text) | `Rehearse-ops.html:1718` |
| `movesOnWhen` (trigger condition) | `Rehearse-ops.html:1719` |
| `durationEstimate` (e.g., "~3 min") | `Rehearse-ops.html:1714` |

**Relationships:**
- Phase belongs-to Scenario (ordered, enforced sequence)

### Pushback Tier / Response

| Field | Source |
|-------|--------|
| `level` (1 = soft fumble, 2 = challenge, 3 = escalated, "nailed it") | `Rehearse-ops.html:1012–1085` |
| `levelLabel` (e.g., "Soft fumble") | `Rehearse-ops.html:1014` |
| `trigger` (condition text, italicized) | `Rehearse-ops.html:1015` |
| `requiresPreApproval` (boolean, Level 3 only) | `Rehearse-ops.html:1055` |
| Responses: `letter` (A/B/C), `text`, `stageDirection` (italic `//` comments) | `Rehearse-ops.html:1018–1026` |

**Relationships:**
- Tier belongs-to Scenario (ordered)
- Tier 1:many Responses

### Objective (Learner)

| Field | Source |
|-------|--------|
| `number` (01–06) | `Rehearse-ops.html:1756` |
| `text` | `Rehearse-ops.html:1757` |
| `weight` (percentage, sum to 100%) | `Rehearse-ops.html:1758` |
| `detectionRule` (implied by description, not explicitly modeled) | `Rehearse-ops.html:1752` sec-desc |

**Relationships:**
- Objective belongs-to Scenario

### Coach Nudge

| Field | Source |
|-------|--------|
| `triggerCondition` (e.g., "filler words > 8 in 60s") | `Rehearse-ops.html:1997` |
| `nudgeText` (e.g., "Slow down. Land your sentences.") | `Rehearse-ops.html:1998` |

**Relationships:**
- Nudge belongs-to Scenario

### Session / Booking

| Field | Source |
|-------|--------|
| `scenarioId` | `Rehearse.html:952` confirm panel |
| `actorId` | `Rehearse.html:954` |
| `learnerId` (implied by "Maya Reyes") | `Rehearse-ops.html:808` |
| `date`, `time`, `duration` (20 min) | `Rehearse.html:955–957` |
| `format` ("Video call (Zoom)") | `Rehearse.html:958` |
| `status` (confirmed, awaiting learner, live) | `Rehearse-ops.html:811–813` session card pills |
| `score` (0–100 overall) | `Rehearse.html:1153` KPI |
| `fillerCount` | `Rehearse.html:1157` |
| `paceWpm` | `Rehearse.html:1161` |
| `talkListenRatio` | `Rehearse.html:1165` |
| `durationActual` (e.g., "16 min 41 sec") | `Rehearse.html:1147` |

**Relationships:**
- Session belongs-to Scenario, Actor, Learner
- Session 1:1 Transcript
- Session 1:many Flagged moments
- Session 1:1 Analytics/Score record

### Actor Profile

| Field | Source |
|-------|--------|
| `id` (slug) | `Rehearse.html:2006` ACTORS array |
| `name` | `Rehearse.html:2006` |
| `certifiedScenarios` (string array) | `Rehearse.html:2006` |
| `rating` (decimal, e.g., 4.9) | `Rehearse.html:2006` |
| `sessionsCompleted` | `Rehearse.html:2006` |
| `note` (short description) | `Rehearse.html:2006` |
| `noShowRate` | `Rehearse-ops.html:869` |
| `actorNumber` (e.g., "A-014") | `Rehearse-ops.html:857` |
| `stripeStatus` (connected / pending / invited) | `Rehearse-ops.html:2551–2558` ROSTER array |
| `earnedMTD` | `Rehearse-ops.html:2551` |
| `sessionsMTD` | `Rehearse-ops.html:2551` |

**Relationships:**
- Actor many:many Scenario (via certification)
- Actor 1:many Sessions
- Actor 1:many Payouts

### Payout

| Field | Source |
|-------|--------|
| `date` | `Rehearse-ops.html:2576` PAYOUTS array |
| `period` (date range) | `Rehearse-ops.html:2576` |
| `recipients` (count) | `Rehearse-ops.html:2576` |
| `sessions` (count) | `Rehearse-ops.html:2576` |
| `totalPaid` (CAD) | `Rehearse-ops.html:2576` |
| `stripeBatchId` | `Rehearse-ops.html:2576` |
| `status` (paid / transit) | `Rehearse-ops.html:2576` |

### Session Log Entry (Payments)

| Field | Source |
|-------|--------|
| `date`, `actor`, `learner`, `scenario`, `duration`, `rate`, `amount`, `status` | `Rehearse-ops.html:2528–2536` SESSION_LOG array |

### Cohort

| Field | Source |
|-------|--------|
| `name` (e.g., "Engineering Mgrs Q2") | `Rehearse-ops.html:2191` |
| `learnerCount` | `Rehearse-ops.html:2193` |
| `scenarioCount` | `Rehearse-ops.html:2193` |
| `dueDate` | `Rehearse-ops.html:2193` |
| `assignedScenarios` | `Rehearse-ops.html:2223–2226` |
| `status` (active / drafting) | `Rehearse-ops.html:2217` |

**Relationships:**
- Cohort many:many Scenarios (assigned)
- Cohort many:many Learners (enrolled, with per-learner progress)

### Learner (User)

| Field | Source |
|-------|--------|
| `name` | `Rehearse.html:819` topbar ("Maya Reyes") |
| `role` | `Rehearse.html:821` ("Director, People Ops") |
| `company` | `Rehearse-auth.html:387` signup field |
| `avatar` initials | `Rehearse.html:819` ("MR") |

### Casting Matrix Entry

| Field | Source |
|-------|--------|
| `actorName` | `Rehearse-ops.html:2059` |
| `scenarioName` | `Rehearse-ops.html:2049–2056` columns |
| `status` (certified ✓ / in-training ◌ / not-assigned —) | `Rehearse-ops.html:2059–2064` |

---

## 3. Hardcoded Data to Lift as Seed

### SCENARIOS config object

```js
// Rehearse.html:1378–1386
const SCENARIOS = {
  "current": "termination",
  "options": [
    "termination",
    "pip",
    "layoff",
    "promotion_denial"
  ]
};
```

### SCEN_DATA — Full scenario content (4 scenarios)

```js
// Rehearse.html:1388–1645
const SCEN_DATA = {
  termination: {
    short: "Performance termination",
    long:  "End-of-PIP separation",
    counterpart: "Josh Halpern",
    counterpartRole: "Senior PM · 4 yrs at company",
    disposition: "Likely defensive",
    briefTitle: "Ending Josh's employment",
    situation: "Josh has been on a Performance Improvement Plan for 90 days. Goals were clear, written, and reviewed weekly. He met 2 of 6 milestones. Legal and HR have signed off on separation. Today's conversation is about <b>ending his employment respectfully, clearly, and without ambiguity</b>.",
    objectives: [
      "State the decision within the first 90 seconds.",
      "Reference the PIP and specific milestones missed.",
      "Explain severance, benefits, and final day.",
      "Give Josh space to react — don't over-explain.",
      "Confirm logistics: laptop, access, announcement."
    ],
    legal: [
      "Reference the signed PIP document.",
      "Disclose severance in writing, not verbally alone.",
      "Offer COBRA / benefits continuation.",
      "No references to protected class.",
      "Read the separation letter verbatim."
    ],
    topics: [
      { t: "Open with the decision",           s: "covered", when: "01:04" },
      { t: "Cite PIP + missed milestones",     s: "covered", when: "03:12" },
      { t: "Severance details",                s: "partial", when: "08:41" },
      { t: "Benefits / COBRA",                 s: "covered", when: "09:55" },
      { t: "Final day + announcement plan",    s: "covered", when: "12:02" },
      { t: "Space for questions",              s: "partial", when: "14:30" },
      { t: "Avoid protected-class references", s: "covered", when: "—" },
      { t: "Offer outplacement",               s: "missed",  when: "—" },
    ],
    moments: [
      { label: "Opening", quote: "So, uh, I wanted to have a chat about where things are at with the PIP…", note: "Softened the lead. Coach suggests opening with the decision." },
      { label: "Pace spike", quote: "…based on sections 4b and 4c of the plan you signed in January…", note: "210 wpm at 06:20. Slow down when reading policy." },
      { label: "Good moment", quote: "I know this isn't what you wanted to hear. Take a minute.", note: "Warm, direct, space — exactly the tone the playbook calls for." }
    ],
    transcript: [
      { t: "00:14", s: "you",  text: "Hey Josh — thanks for making the time. <em class='filler'>So</em>, I wanted to talk about the PIP." },
      { t: "00:22", s: "them", text: "Sure. Is this the check-in?" },
      { t: "00:25", s: "you",  text: "<em class='filler'>Um</em>, it's more than that. I've made a decision and I want to share it with you directly." },
      { t: "00:35", s: "them", text: "Okay." },
      { t: "00:37", s: "you",  text: "We're going to end your employment, effective the 30th. I know that's heavy — I'll walk through what that means." },
      { t: "00:52", s: "them", text: "…alright." },
    ],
    coachMessages: [
      { who: "coach", text: "Nice work finishing the run. Before anything else — how did that <i>feel</i> to deliver?" },
      { who: "user",  text: "Rough. I softened the opener again." },
      { who: "coach", text: "I noticed. You opened with context before the decision — that's the piece Josh was waiting on. Here's the moment:", quote: { t: "00:14", s: "Hey Josh — thanks for making the time. So, I wanted to talk about the PIP." } },
      { who: "coach", text: "One small reframe tends to help: lead with the decision in the first two sentences, then explain.", suggestion: { tag: "TRY THIS", text: ""Josh — I've made a decision and I want you to hear it from me first. We're ending your employment, effective the 30th. I'll walk through the details."" } },
      { who: "user",  text: "That feels abrupt." },
      { who: "coach", text: "It <i>feels</i> abrupt to you because you're the one with the news. To Josh, the 20 seconds of preamble is the abrupt part — he's bracing the whole time. Want to replay just the opener?" },
    ],
    history: [
      ["14","Performance termination", "78", "warm", "good pace", "16:41"],
      ["13","PIP midpoint review",     "72", "firm", "ok pace",   "11:02"],
      ["12","Performance termination", "72", "soft","fast",       "18:20"],
      ["11","Layoff — individual",     "81", "warm","good",       "09:14"],
      ["10","PIP kickoff",             "65", "soft","fast",       "13:48"],
    ],
    skills: [
      ["Direct opening",  62, 78],
      ["Fewer fillers",   44, 72],
      ["Pace control",    70, 68],
      ["Space for reaction", 48, 60],
      ["Legal coverage",  80, 92],
    ]
  },
  pip: {
    short: "Performance Improvement Plan",
    long:  "Kickoff the PIP",
    counterpart: "Sam Ortiz",
    counterpartRole: "Engineer II · 18 mo at company",
    disposition: "Likely surprised",
    briefTitle: "Starting Sam's PIP",
    situation: "Sam has missed 3 sprint commitments and received mixed peer feedback. You've decided to put them on a 60-day PIP with concrete, measurable goals. Today's conversation is about <b>being clear it's serious, being clear it's survivable, and being specific about what success looks like</b>.",
    objectives: [
      "Name the PIP explicitly — don't call it a 'coaching plan'.",
      "Give 2–3 specific examples, not generalities.",
      "Define the 4 measurable goals and dates.",
      "Confirm the weekly check-in cadence.",
      "Make clear that the intent is success, not exit."
    ],
    legal: [
      "Document the conversation in writing within 24 hours.",
      "Reference the performance policy section.",
      "Note that HR is aware and in support.",
      "No promises of outcome beyond the 60 days.",
    ],
    topics: [
      { t: "Name it a PIP explicitly",      s: "covered", when: "01:40" },
      { t: "Specific, documented examples", s: "covered", when: "04:10" },
      { t: "Measurable 60-day goals",       s: "partial", when: "07:20" },
      { t: "Weekly check-in cadence",       s: "covered", when: "10:01" },
      { t: "What happens if goals are met", s: "missed",  when: "—" },
      { t: "What happens if not met",       s: "partial", when: "12:18" },
      { t: "Space for questions",           s: "covered", when: "14:02" },
      { t: "Offer resources (coach, 1:1s)", s: "missed",  when: "—" },
    ],
    moments: [
      { label: "Naming it", quote: "I want to put you on a formal Performance Improvement Plan.", note: "Clear. Direct. Exactly right." },
      { label: "Hedge", quote: "If things don't go well, we'll… you know, figure it out.", note: "Vague ending. Name the consequence — respectful clarity helps Sam." },
      { label: "Specificity", quote: "In the last 3 sprints, we shipped 11 of 17 committed stories…", note: "Great — numbers land harder than feelings here." }
    ],
    transcript: [
      { t: "00:18", s: "you",  text: "Sam — thanks for making time. I want to be direct about why." },
      { t: "00:25", s: "them", text: "Sure." },
      { t: "00:27", s: "you",  text: "I'm putting you on a formal <em class='filler'>uh</em> Performance Improvement Plan, starting Monday." },
      { t: "00:36", s: "them", text: "… okay. Can you walk me through why?" },
      { t: "00:40", s: "you",  text: "Yeah. Three things have converged — sprint commitments, peer feedback, and pairing consistency." },
    ],
    coachMessages: [
      { who: "coach", text: "That was solid. You named the PIP early and didn't apologize for it. How are you feeling?" },
      { who: "user",  text: "Better than last time. I still hedged at the end though." },
      { who: "coach", text: "You did — here's the moment:", quote: { t: "12:18", s: "If things don't go well, we'll… you know, figure it out." } },
      { who: "coach", text: "Sam needs to know both sides of the plan. Try this:", suggestion: { tag: "TRY THIS", text: ""If you hit all four goals by day 60, we close the PIP and go back to normal check-ins. If you miss two or more, we'll have a separation conversation."" } },
    ],
    history: [
      ["14","PIP kickoff",              "74", "direct", "ok",   "15:02"],
      ["13","PIP midpoint review",      "72", "firm",   "ok",   "11:02"],
      ["12","Performance termination",  "72", "soft",   "fast", "18:20"],
      ["11","Layoff — individual",      "81", "warm",   "good", "09:14"],
      ["10","PIP kickoff",              "65", "soft",   "fast", "13:48"],
    ],
    skills: [
      ["Naming the PIP",     50, 82],
      ["Specific examples",  55, 76],
      ["Clear goals",        40, 62],
      ["Consequence clarity",42, 55],
      ["Tone (firm + kind)", 60, 72],
    ]
  },
  layoff: {
    short: "Layoff — no fault",
    long:  "Individual layoff due to restructuring",
    counterpart: "Priya Desai",
    counterpartRole: "Designer · 3 yrs at company",
    disposition: "Likely shocked",
    briefTitle: "Laying off Priya (not performance)",
    situation: "Priya's role is being eliminated as part of a restructure. Her performance has been strong. Today's conversation is about <b>making it clear this is not about her, delivering the news with dignity, and handling severance and references generously</b>.",
    objectives: [
      "Make it explicit: this is not about performance.",
      "Say it plainly and early.",
      "Cover severance, benefits, and references.",
      "Offer outplacement and LinkedIn recommendation.",
      "Keep the conversation under 15 minutes.",
    ],
    legal: [
      "Disclose severance in writing at the end of the call.",
      "Offer COBRA / benefits continuation.",
      "Confirm WARN Act notice if applicable.",
      "No references to protected class.",
      "Send separation letter same day.",
    ],
    topics: [
      { t: "Frame as restructuring, not perf",  s: "covered", when: "01:12" },
      { t: "Say the word 'layoff' early",       s: "covered", when: "01:20" },
      { t: "Severance terms",                   s: "covered", when: "06:40" },
      { t: "Benefits / COBRA",                  s: "covered", when: "07:50" },
      { t: "Final day + transition",            s: "covered", when: "09:02" },
      { t: "Offer LinkedIn recommendation",     s: "partial", when: "11:30" },
      { t: "Outplacement services",             s: "missed",  when: "—" },
      { t: "Space for questions",               s: "covered", when: "12:40" },
    ],
    moments: [
      { label: "Opening", quote: "Priya — this isn't about your performance. I want to say that first.", note: "Perfect lead — removes the worst possible interpretation immediately." },
      { label: "Vague benefit", quote: "Severance will be, uh, competitive.", note: "Replace with the number. Ambiguity here is cruel." },
      { label: "Warmth", quote: "I'd be proud to write you a LinkedIn recommendation.", note: "Specific, personal. Great." }
    ],
    transcript: [
      { t: "00:12", s: "you",  text: "Priya — thanks for making time. I want to open with something direct." },
      { t: "00:20", s: "them", text: "Okay…" },
      { t: "00:22", s: "you",  text: "Your role is being eliminated as part of a restructure. This isn't about your performance." },
      { t: "00:34", s: "them", text: "…oh. Wow." },
      { t: "00:38", s: "you",  text: "I know. Take a moment. I'll walk through what this means for you." },
    ],
    coachMessages: [
      { who: "coach", text: "Hard conversation — handled with real care. Your opening was textbook. How did it feel?" },
      { who: "user",  text: "Better than expected. I flubbed the severance number though." },
      { who: "coach", text: "You did — it was vague exactly where Priya needed concrete:", quote: { t: "06:40", s: "Severance will be, uh, competitive." } },
      { who: "coach", text: "Try leading with the number:", suggestion: { tag: "TRY THIS", text: ""Your severance is 12 weeks of pay, plus benefits through end of next month. I'll send the full letter right after this call."" } },
    ],
    history: [
      ["14","Layoff — individual",      "81", "warm", "good", "14:12"],
      ["13","PIP midpoint review",      "72", "firm", "ok",   "11:02"],
      ["12","Performance termination",  "72", "soft", "fast", "18:20"],
      ["11","Layoff — individual",      "76", "warm", "good", "09:14"],
      ["10","PIP kickoff",              "65", "soft", "fast", "13:48"],
    ],
    skills: [
      ["Opening clarity",     68, 88],
      ["Severance specifics", 52, 70],
      ["Warmth",              72, 85],
      ["Pace control",        70, 72],
      ["Ending cleanly",      58, 74],
    ]
  },
  promotion_denial: {
    short: "Promotion declined",
    long:  "Telling a strong performer no",
    counterpart: "Taylor Kim",
    counterpartRole: "Senior Analyst · 2 yrs in role",
    disposition: "Expecting a yes",
    briefTitle: "Telling Taylor the promotion didn't land",
    situation: "Taylor submitted a strong promotion packet. The committee declined — not because of Taylor, but because the scope bar moved for this cycle. Today's conversation is about <b>giving the decision clearly, making Taylor feel seen, and giving a credible path for next cycle</b>.",
    objectives: [
      "State the decision within 2 minutes.",
      "Explain the why without blaming the committee.",
      "Give 2–3 concrete things that would change the outcome.",
      "Acknowledge the work that went into the packet.",
      "Commit to a specific next-cycle follow-up.",
    ],
    legal: [],
    topics: [
      { t: "State the decision clearly",         s: "covered", when: "01:32" },
      { t: "Explain the rubric change",          s: "partial", when: "03:40" },
      { t: "Give 2–3 concrete growth areas",     s: "covered", when: "06:04" },
      { t: "Acknowledge packet quality",         s: "covered", when: "08:11" },
      { t: "Commit to next-cycle timeline",      s: "missed",  when: "—" },
      { t: "Space for Taylor's reaction",        s: "covered", when: "10:02" },
      { t: "Offer growth resources",             s: "partial", when: "11:40" },
      { t: "End on a specific next step",        s: "missed",  when: "—" },
    ],
    moments: [
      { label: "Opening", quote: "Taylor — the committee didn't land on a promotion this cycle.", note: "Clean. Decision is clear in the first sentence." },
      { label: "Blame shift", quote: "I really fought for it, but, uh, they had concerns.", note: "Don't throw the committee under the bus — it undercuts the path forward." },
      { label: "Acknowledgement", quote: "Your packet was the tightest I've seen from you.", note: "Specific praise matters here — keep it." }
    ],
    transcript: [
      { t: "00:20", s: "you",  text: "Taylor — thanks for coming in. I want to start with the decision, then we'll walk through the why." },
      { t: "00:30", s: "them", text: "Okay." },
      { t: "00:32", s: "you",  text: "The committee didn't land on a promotion this cycle. I want to be straight with you about that." },
      { t: "00:42", s: "them", text: "… ok. Can you tell me where it fell short?" },
      { t: "00:46", s: "you",  text: "Yes. Two areas: cross-team scope and public artifacts. Let me be specific." },
    ],
    coachMessages: [
      { who: "coach", text: "You opened with the decision and didn't flinch. That's the hard part — nice. How are you feeling?" },
      { who: "user",  text: "Okay. I think I threw the committee under the bus a bit." },
      { who: "coach", text: "A little — here it is:", quote: { t: "03:40", s: "I really fought for it, but, uh, they had concerns." } },
      { who: "coach", text: "The easier swap is owning the bar:", suggestion: { tag: "TRY THIS", text: ""The bar for this level got more specific this cycle — here's what it now looks like, and here's where your packet landed relative to it."" } },
    ],
    history: [
      ["14","Promotion declined",       "76", "warm", "good", "13:40"],
      ["13","PIP midpoint review",      "72", "firm", "ok",   "11:02"],
      ["12","Performance termination",  "72", "soft", "fast", "18:20"],
      ["11","Layoff — individual",      "81", "warm", "good", "09:14"],
      ["10","PIP kickoff",              "65", "soft", "fast", "13:48"],
    ],
    skills: [
      ["Clear decision",       62, 78],
      ["Rubric explanation",   48, 62],
      ["Specific growth areas",55, 75],
      ["Acknowledgement",      70, 82],
      ["Next-cycle commitment",30, 48],
    ]
  }
};
```

### Library card metadata (includes 2 stub scenarios not in SCEN_DATA)

```js
// Rehearse.html:1740–1747
const cards = [
  { id: 'termination',      kind: 'Termination',  diff: 'hardest',   title: "End-of-PIP separation",          blurb: "Josh, 4y. Performance separation after a 90-day PIP. AI will probe for emotion and legal specificity.", meta: "15 min · 1 take" },
  { id: 'pip',              kind: 'Feedback',     diff: 'hard',      title: "Starting a PIP",                 blurb: "Sam, 18mo. Name it plainly, be specific, define measurable goals. Keep it survivable.", meta: "15 min · retries ok" },
  { id: 'layoff',           kind: 'Termination',  diff: 'hard',      title: "Layoff — not performance",       blurb: "Priya, 3y. Role eliminated in a restructure. Make it clear this isn't about them.", meta: "10 min · 1 take" },
  { id: 'promotion_denial', kind: 'Feedback',     diff: 'medium',    title: "Promotion didn't land",          blurb: "Taylor, 2y in role. Strong packet, bar moved. Give a credible next-cycle path.", meta: "12 min · retries ok" },
  { id: 'raise_denial',     kind: 'Compensation', diff: 'medium',    title: "Denying an off-cycle raise",     blurb: "Alex asked for an out-of-band increase. Hold the line, stay warm.", meta: "10 min" },
  { id: 'peer_conflict',    kind: 'Feedback',     diff: 'medium',    title: "Two-directs conflict",           blurb: "Two senior engineers are clashing on architecture. Don't pick a side — set a process.", meta: "15 min" },
];
```

### ACTORS roster

```js
// Rehearse.html:2005–2010
const ACTORS = [
  { id: 'jordan', name: 'Jordan Hall',  cert: ['Termination','Layoff','PIP'], rating: 4.9, sessions: 87, note: 'Top-rated · very direct' },
  { id: 'amara',  name: 'Amara Osei',   cert: ['PIP','Promo denial'],         rating: 4.7, sessions: 54, note: 'Warm tone · great for PIP' },
  { id: 'sam',    name: 'Sam Torres',   cert: ['Promo denial','Layoff'],      rating: 4.8, sessions: 61, note: 'Calm · good with silence' },
  { id: 'priya',  name: 'Priya Mehta',  cert: ['Termination'],                rating: 5.0, sessions: 28, note: 'Intense · perfect for hard cases' },
];
```

### SESSION_LOG (payments)

```js
// Rehearse-ops.html:2527–2536
const SESSION_LOG = [
  ['Apr 28','Jordan Hall','Maya Reyes','Performance termination','16:41','$54','$54.00','paid'],
  ['Apr 28','Amara Osei','David Park','PIP kickoff','14:02','$48','$48.00','paid'],
  ['Apr 27','Jordan Hall','Priya Chen','Layoff — no fault','12:18','$54','$54.00','paid'],
  ['Apr 26','Sam Torres','Alex Kim','Promo denial','13:40','$42','$42.00','paid'],
  ['Apr 25','Jordan Hall','TBD','Performance termination','—','$54','—','pending'],
  ['Apr 25','Amara Osei','Raj Patel','PIP kickoff','11:55','$48','$48.00','paid'],
  ['Apr 24','Sam Torres','Mei Zhang','Promo denial','14:10','$42','$42.00','flagged'],
  ['Apr 23','Jordan Hall','Chris Lee','Layoff — no fault','09:14','$54','$54.00','paid'],
];
```

### ROSTER (payments)

```js
// Rehearse-ops.html:2551–2558
const ROSTER = [
  ['Jordan Hall','Termination, Layoff, PIP','8','$432','connected','4.9'],
  ['Amara Osei','PIP, Promo denial','6','$288','connected','4.7'],
  ['Sam Torres','Promo denial, Salary denial','5','$210','connected','4.8'],
  ['Priya Mehta','Termination','3','$162','connected','5.0'],
  ['Chris Walker','PIP, Layoff','4','$192','pending','4.6'],
  ['Devon Park','Termination','0','—','invited','—'],
];
```

### PAYOUTS

```js
// Rehearse-ops.html:2575–2581
const PAYOUTS = [
  ['Apr 28','Apr 21–27','12','31','$1,620','po_abc123def','paid'],
  ['Apr 21','Apr 14–20','11','28','$1,344','po_xyz789ghi','paid'],
  ['Apr 14','Apr 7–13','11','22','$1,056','po_lmn456opq','paid'],
  ['Apr 7', 'Mar 31–Apr 6','10','13','$624','po_rst012uvw','paid'],
  ['Mar 31','Mar 24–30','9','12','$576','po_jkl345mno','transit'],
];
```

### Earnings chart data

```js
// Rehearse-ops.html:2595–2596
const weeks = ['Apr 1','Apr 7','Apr 14','Apr 21','Apr 28'];
const vals  = [420, 576, 624, 1056, 1344];
```

### Onboarding steps

```js
// Rehearse-ops.html:2607–2612
const steps = [
  ['done','Invite sent','Email sent with Stripe Connect link'],
  ['done','Stripe account created','Actor completes Stripe onboarding'],
  ['active','Identity verified','Stripe reviews documents (1–2 days)'],
  ['todo','First payout','Automatic on next Monday cycle'],
];
```

### SCEN_LABELS

```js
// Rehearse.html:1964–1969
const SCEN_LABELS = {
  termination: 'Termination',
  pip: 'PIP kickoff',
  layoff: 'Layoff',
  promotion_denial: 'Promo decline'
};
```

### CRUMBS (learner nav)

```js
// Rehearse.html:1650–1658
const CRUMBS = {
  library: "Scenario library",
  booking: "Book a session",
  briefing: "Briefing",
  call: "Live rehearsal",
  analytics: "Analytics",
  coach: "Coach",
  progress: "My progress"
};
```

### CRUMBS (ops nav)

```js
// Rehearse-ops.html:2461–2476
const CRUMBS = {
  'ld-scenarios': 'Scenarios',
  'ld-builder':   'Scenario builder',
  'ld-actors':    'Actor coaching',
  'ld-cohorts':   'Cohorts',
  'ld-insights':  'Insights',
  'actor-dash':    'Actor sessions',
  'actor-brief':   'Character brief',
  'actor-pushback':'Pushback playbook',
  'actor-rules':   'Stage rules',
  'actor-session': 'In-session',
  'pay-overview':  'Payments overview',
  'pay-sessions':  'Session log',
  'pay-roster':    'Roster',
  'pay-history':   'Payout history',
};
```

---

## 4. Auth / Role Logic

### File: `Rehearse-auth.html`

**Two views** toggled by tabs at the top of a single centered card:

#### Sign In (`view-signin`)
- Fields: `Work email *` (type=email), `Password *` (type=password)
- "Forgot password?" link (no target, `#`)
- Submit button: "Sign in" (neutral/black style)
- SSO: Google and LinkedIn buttons (with SVG icons)
- Footer: "Don't have an account? Create one →"
- On success: shows a green banner "Signed in successfully. Redirecting…" then `window.location.href = 'Rehearse.html'` after 1400ms
- Validation: email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, password min 8 chars

#### Sign Up (`view-signup`)
- **Role picker** (top of form, 2 cards side by side):
  - **Learner** (default selected, indigo accent): "I'm a manager or L&D professional practising difficult conversations."
  - **Actor** (purple accent): "I'm a trained actor or coach available to run live roleplay sessions."
- Shared fields: `First name *`, `Last name *`, `Work email *`, `Password *` (min 8 chars)
- **Learner-only fields** (shown when Learner selected):
  - `Company` (optional, text)
  - `Your role` (select: People Manager, Director People Ops, HR Business Partner, L&D Manager, VP / C-suite, Other)
- **Actor-only fields** (shown when Actor selected):
  - `LinkedIn profile URL` (type=url, with hint: "We use this to verify your background before approving your account.")
  - `Scenarios you can play` (multi-select chips: Termination, PIP kickoff, Layoff, Promo denial, Salary denial, Peer conflict, Demotion)
  - `How did you hear about Rehearse?` (select: Invited by an L&D team, LinkedIn, Friend or colleague, Other)
- Terms checkbox: "I agree to Rehearse's Terms of Service and Privacy Policy."
- Submit button text changes by role:
  - Learner: "Create learner account" (indigo)
  - Actor: "Apply as an actor" (purple)
- Title/subtitle changes by role:
  - Learner: "Create your account" / "Choose how you'll use Rehearse."
  - Actor: "Apply to be an actor" / "Actor applications are reviewed within 2 business days. We'll reach out via email."
- Role indicator strip at bottom of card:
  - Learner: "Signing up as a Learner — you'll book sessions and track your progress."
  - Actor: "Applying as an Actor — your account will be reviewed before activation."
- SSO: Same Google + LinkedIn buttons
- On success:
  - Learner: "Account created! Redirecting to your dashboard…" → redirect to `Rehearse.html` after 1600ms
  - Actor: "Application submitted! We'll review your profile and email you within 2 business days." (no redirect)

#### JS functions
- `switchTab(tab)` — toggles `view-signin`/`view-signup` visibility
- `selectRole(role)` — swaps learner/actor fields, button text, title, subtitle, role-tag strip
- `submitSignIn()` — client-side validation only, shows success banner, redirects
- `submitSignUp()` — client-side validation only, shows success banner, conditionally redirects
- Scenario chips: toggle `.on` class on click
- Enter key: submits whichever form is active

#### Key observations
- No actual auth backend — all validation is client-side
- Actor signup is an "application" with review; learner signup is instant
- LinkedIn URL is the actor verification mechanism
- Role is selected at signup time — no role switching post-signup
- No email verification flow shown
- No password reset flow beyond the "Forgot password?" link placeholder

---

## 5. Cross-Portal Touchpoints

### 1. Scenario (shared object across all portals)
- **Learner app** (`Rehearse.html:screen-library`, `screen-briefing`, `screen-call`, `screen-analytics`) references scenario by slug ID via `SCEN_DATA[SCENARIOS.current]`
- **L&D studio** (`Rehearse-ops.html:screen-ld-scenarios`, `screen-ld-builder`) is the authoring surface for the same scenarios
- **Actor portal** (`Rehearse-ops.html:screen-actor-brief`, `screen-actor-pushback`) consumes the character brief and pushback playbook authored in L&D
- The L&D builder sections explicitly label their downstream surfaces: `→ Surfaces in Learner app · Library card`, `→ Drives Actor portal · In-session phase tracker`, etc. (`Rehearse-ops.html:1665`, `1708`, `1750`, `1799`, `1847`, `1945`, `1992`)

### 2. Booking → Session (learner initiates, actor receives)
- Learner books via `screen-booking` (`Rehearse.html:893`), selecting actor + date + time
- Actor sees the booked session on their dashboard `screen-actor-dash` (`Rehearse-ops.html:790`) with matching scenario, learner name, date/time, and status pills
- Shared fields: scenario name, learner name, actor name, date/time, duration

### 3. Session start (both portals enter simultaneously)
- Learner clicks "Start rehearsal" from `screen-briefing` → enters `screen-call` (`Rehearse.html:1024`)
- Actor clicks "Go live" from `screen-actor-dash` or `screen-actor-rules` → enters `screen-actor-session` (`Rehearse-ops.html:1191`)
- Both see a live timer; both see the counterpart's name
- The learner's call screen says "Josh (AI)" at `Rehearse.html:1064` — but the actor portal describes human contractors

### 4. Flag-in-session (actor flags, L&D reviews)
- Actor flags moments via the flag button in `screen-actor-session` (`Rehearse-ops.html:1229`)
- L&D reviews flagged moments in the "Review queue" panel on `screen-ld-actors` (`Rehearse-ops.html:2106–2137`)
- Flag types visible: `great`, `break`, `note`

### 5. Transcript hand-off
- Learner sees live transcript in `screen-call` (`Rehearse.html:1083`) and the coach references transcript timestamps in `screen-coach` (`Rehearse.html:1437`)
- Actor sees read-only transcript in `screen-actor-session` (`Rehearse-ops.html:1234–1242`)
- Both transcripts share the same data shape: `{t, s, text}` with `s` being "you"/"them"/"learner"

### 6. Rating / scoring
- Learner's `screen-analytics` shows overall score 0–100, filler count, pace, talk/listen (`Rehearse.html:1150–1170`)
- Actor dashboard shows "Avg learner rating" of 4.8/5.0 (`Rehearse-ops.html:865`) — implies learners rate actors post-session (no UI for this exists in wireframes)
- L&D insights show aggregate avg score per scenario (`Rehearse-ops.html:2406–2424`)
- Payments session log includes no score, but L&D cohort table includes avg score per learner

### 7. Objective tracking (authored in L&D, tracked live for learner)
- L&D authors objectives with weights in `screen-ld-builder` sec-objectives (`Rehearse-ops.html:1745–1791`)
- Learner sees them as a live checklist in `screen-call` coach rail (`Rehearse.html:1096–1098`) and as topic coverage in `screen-analytics` (`Rehearse.html:1237–1239`)

### 8. Coach nudges (authored in L&D, shown to learner)
- L&D authors nudges with trigger conditions in `screen-ld-builder` sec-nudges (`Rehearse-ops.html:1988–2021`)
- Learner sees them as silent nudge cards during `screen-call` (`Rehearse.html:1129–1135`)

### 9. Payments (sessions generate payouts)
- Sessions from both portals feed into `screen-pay-sessions` session log (`Rehearse-ops.html:1353`)
- Actor earnings derived from session count × rate per scenario
- Payout bundles sessions weekly into Stripe Connect transfers

### 10. Actor certification (L&D manages, learner sees at booking)
- Casting matrix in `screen-ld-actors` (`Rehearse-ops.html:2047–2071`) defines who's certified for what
- Learner's booking screen shows actor cards with certification pills (`Rehearse.html:2058`)
- Actor's own dashboard shows certification status (`Rehearse-ops.html:1176–1183`)

---

## 6. Reusable Component Candidates

| Component | Occurrences | Variants |
|-----------|-------------|----------|
| **Sidebar nav** | `Rehearse.html:828–862`, `Rehearse-ops.html:710–780` | Learner (single group, indigo active), Ops (3 switchable nav groups: L&D teal, Actor purple, Payments stripe-blue), keyboard shortcut badges |
| **Top bar** | `Rehearse.html:801–823`, `Rehearse-ops.html:683–705` | Learner (brand + crumbs + scenario pill + user), Ops (brand + app-tab switcher + crumbs + role pill + user) |
| **Pill / chip** | Everywhere | Color variants: `.good`, `.warn`, `.bad`, `.accent`, `.actor`, `.stripe`, `.ld`; all share `.dot` + text pattern |
| **Card** | Everywhere | Solid border (`.card`) and dashed border (`.card.sketch` for wireframe-only items) |
| **Data table** | `Rehearse-ops.html:350–365` | Session log, roster, payout history, cohort progress — all share `.data-table` class with `th`/`td` styling |
| **Scenario card** | `Rehearse.html:231–263` (learner library), `Rehearse-ops.html:439–456` (L&D library) | Learner variant: 3-col grid, `.scenario` class with kind/diff/title/blurb/foot. L&D variant: 2-col `.scenario-card` with meta stats grid |
| **Persona card** | `Rehearse.html:269–286` (learner briefing), `Rehearse-ops.html:217–231` (actor character card) | Learner: `.persona` with face placeholder + name/role/tags. Actor: `.char-card` with larger face, name, role, emotional state text |
| **Tier card (pushback)** | `Rehearse-ops.html:233–263` (actor view), `Rehearse-ops.html:1851–1937` (L&D editable) | Read-only actor view vs editable L&D view with edit-tag buttons and remove buttons |
| **KPI card** | `Rehearse.html:416–436`, `Rehearse-ops.html:326–332` | `.kpi` with `.label`, `.value` (+ `.unit`), `.delta` (+ `.up`/`.down`) |
| **Button** | Everywhere | `.btn` (dark), `.btn.ghost` (outline), `.btn.accent` (indigo), `.btn.actor-btn` (purple), `.btn.stripe-btn` (stripe blue), `.btn.ld-btn` (teal); optional `.kbd` shortcut hint |
| **Transcript line** | `Rehearse.html:389–396` (learner live), `Rehearse-ops.html:311–322` (actor script-line) | Learner: `.transcript .line` (2-col grid: timestamp + speaker text). Actor: `.script-line` with `.who` header and active state |
| **Rules grid (do/don't)** | `Rehearse-ops.html:266–281` (actor), `Rehearse-ops.html:1948–1963` (L&D builder) | 2-column grid with green "do" header and red "don't" header |
| **Objective row** | `Rehearse.html:398–410` (live tracker), `Rehearse-ops.html:544–556` (L&D builder) | Live: `.obj-row` with checkbox + text + done/partial state. Builder: `.obj-row` with number + text + weight bar + remove button |
| **Session card** | `Rehearse-ops.html:197–214` | Actor dashboard: `.session-card` with date block, title, sub, tags, action buttons; `.today` variant with purple border |
| **Bar chart** | `Rehearse-ops.html:384–388` | Earnings by week: `.bar-chart` with `.bar-col` flex items |
| **Badge** | `Rehearse-ops.html:397–404` | `.badge.paid`, `.badge.pending`, `.badge.flagged`, `.badge.transit` |
| **Streak heatmap** | `Rehearse.html:587–594` | 12-week grid with 4 intensity levels (`.s1`–`.s4`) |
| **Sparkline** | `Rehearse.html:1869–1901` | SVG line chart with area fill, grid lines, dot annotations |
| **Sentiment bar** | `Rehearse.html:474–479` | `.sent-bar` with `.fill` and `.mark` (midpoint indicator) |
| **Squiggle decoration** | `Rehearse.html:194–199`, `Rehearse-ops.html:189–193` | SVG wave pattern — indigo in learner, purple in ops |

---

## 7. Styling System

### CSS Custom Properties

Both `Rehearse.html` and `Rehearse-ops.html` share a consistent token set:

```css
/* Shared across all files */
--bg:       #F7F7F5;      /* Page background */
--paper:    #FBFBF9;      /* Card/surface background */
--ink:      #111114;      /* Primary text */
--ink-2:    #2A2A30;      /* Secondary text */
--ink-3:    #55555E;      /* Tertiary text */
--ink-4:    #8A8A92;      /* Muted/placeholder text */
--line:     #D8D8D2;      /* Primary border */
--line-2:   #E6E6E0;      /* Secondary border */
--chip:     #ECECE5;      /* Chip/tag background (Rehearse.html + ops) */
--accent:   #5E6AD2;      /* Linear indigo — learner brand accent */
--accent-2: #EAEBFA;      /* Indigo tint */
--good:     #3A7D4E;      /* Success green */
--warn:     #B06A1E;      /* Warning amber */
--bad:      #A23A3A;      /* Error/danger red */
--radius:   6px;          /* Default border radius (8px in auth) */
--radius-lg:10px;         /* Card border radius (12px in auth) */
```

**Ops-only tokens (not in learner app):**

```css
--good-2:   #EAF4EE;     /* Success tint */
--warn-2:   #FDF3E7;     /* Warning tint */
--bad-2:    #FAECEC;      /* Error tint */
--actor:    #7C5CBF;      /* Purple — actor brand accent */
--actor-2:  #F1EDFA;      /* Purple tint */
--stripe:   #635BFF;      /* Stripe brand blue */
--stripe-2: #EEEDFF;      /* Stripe tint */
--ld:       #1F7A6B;      /* Teal — L&D studio accent */
--ld-2:     #E8F2EF;      /* Teal tint */
```

**Auth-only differences:**
- `--radius: 8px` (vs 6px in main app)
- `--radius-lg: 12px` (vs 10px)
- Adds `--bad-2: #FAECEC` independently

### Font Stack

```css
--sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
--mono: "JetBrains Mono", ui-monospace, SF Mono, Menlo, monospace;
--hand: "Caveat", cursive;   /* wireframe annotation font */
```

All three files use the same Google Fonts import: `Inter:wght@400;500;600;700`, `JetBrains Mono:wght@400;500;600`, `Caveat:wght@400;600` (auth only loads `Caveat:wght@600`).

### Spacing Tokens

No explicit spacing tokens — spacing is done inline with pixel values. Common values: `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, `32px`.

### Breakpoints

None. All wireframes use a fixed viewport: `<meta name="viewport" content="width=1440"/>` (learner + ops). Auth uses `width=device-width, initial-scale=1` (responsive).

### Grid System

- Learner shell: `232px` sidebar + `1fr` main
- Ops shell: `232px` sidebar + `1fr` main (identical)
- Content grids vary by screen (2-col, 3-col, etc.)

### Consistency Notes

- The token names and values are identical between Rehearse.html and Rehearse-ops.html for all shared tokens
- Rehearse-ops.html extends the palette with role-specific colors (`--actor`, `--stripe`, `--ld`) and their tint pairs
- Auth uses a slightly different radius scale (8/12 vs 6/10) — likely intentional for the centered card layout
- The `--chip` token exists in both main files but not in auth
- Background pattern (24px grid with 2.5% opacity lines) is identical across all three files

---

## 8. Wireframe-Only Artifacts to Discard

| Artifact | Location | Why Discard |
|----------|----------|-------------|
| **Tweaks panel** (scenario switcher) | `Rehearse.html:1357–1372` (floating panel, bottom-right), JS at `1962–1999` | Wireframe navigation aid for switching scenarios; not a product feature |
| **Tweaks panel** (actor role/difficulty) | `Rehearse-ops.html:2434–2455` | Same — wireframe toggle for actor/admin view and scenario difficulty |
| **`v0.4 · wireframes` version pill** | `Rehearse.html:806` topbar brand-sub | Version label for the wireframe itself |
| **"Wireframe notes" sidebar text** | `Rehearse.html:856–861` ("Mid-fi, greyscale + indigo accent…") | Internal design notes |
| **"Wireframe — back-of-house" sidebar text** | `Rehearse-ops.html:775–779` ("L&D studio authors scenarios. Actors run them. Ops gets paid.") | Internal design notes |
| **Hardcoded user "Maya Reyes"** | `Rehearse.html:819–821` topbar, throughout SCEN_DATA | Placeholder learner identity |
| **Hardcoded user "Jordan Hall"** | `Rehearse-ops.html:702–704` topbar, throughout session data | Placeholder actor identity |
| **`(AI)` label on call counterpart** | `Rehearse.html:1064`, `Rehearse.html:1710` (JS sets "Josh (AI)") | Misleading label — product uses human actors, not AI |
| **Hand-drawn annotations** (`.hand`, `.hand.note`) | `Rehearse.html:200–203`, various inline squiggles and "↑" arrows | Wireframe presentation annotations |
| **Squiggle decorations** (`.squiggle`) | `Rehearse.html:194–199`, `Rehearse-ops.html:189–193` | Decorative wireframe markers |
| **Dashed-border sketch cards** (`.card.sketch`) | Throughout both files | Indicate "still to design" sections |
| **Sample chart without data source** (sparkline) | `Rehearse.html:1869–1901` | Hardcoded point array `[58, 62, 55, 64, 61, 68, 65, 72, 68, 74, 72, 78]` |
| **Sample streak heatmap** | `Rehearse.html:1905–1920` | Hardcoded pattern array |
| **Static timeline** | `Rehearse.html:1777–1803` | Hardcoded alternating speaker blocks and filler positions |
| **Static sentiment tracks** | `Rehearse.html:1807–1826` | Hardcoded values `[68, 42, 55, 36, 72, 48]` |
| **`deck-stage.js`** | Separate file | Presentation wrapper for viewing wireframes as slide decks — not app code |
| **`scraps/*.napkin`** | 2 files in `scraps/` folder | Sketch/napkin artifacts, not HTML |
| **Print HTML files** | `Rehearse-print.html`, `Rehearse-ops-print.html` | Print-optimized duplicates of the wireframes |
| **Edit mode postMessage bridge** | `Rehearse.html:1991–1999`, `Rehearse-ops.html:2633–2640` | `__edit_mode_available`/`__activate_edit_mode` — wireframe embedding protocol |
| **`⌥ ,` keyboard shortcut for tweaks** | `Rehearse.html:1363` | Wireframe-only shortcut |
| **localStorage persistence** | `Rehearse.html:1668`, `Rehearse-ops.html:2490` | Screen-state persistence for wireframe navigation |

---

## 9. Ambiguities / Open Questions

1. **"Josh (AI)" vs human actors** — The learner's live call screen labels the counterpart as `Josh (AI)` (`Rehearse.html:1064`, `Rehearse.html:1710`). The actor portal describes human contractors with Stripe payouts. **Resolution known: human-only.** The `(AI)` label is a wireframe artifact to discard.

2. **Learner rating of actors** — Actor dashboard shows "Avg learner rating 4.8 / 5.0" (`Rehearse-ops.html:865`) and actor cards in booking show star ratings (`Rehearse.html:2048`), but there is no post-session rating UI for the learner in any wireframe. Where/when does the learner rate?

3. **Scoring system: 0–100 vs 0–5** — Analytics shows a 0–100 overall score (`Rehearse.html:1153`), but L&D insights and cohort tables show scores on a "4.6/5" scale (`Rehearse-ops.html:1517`, `2246`). Are these different metrics, or should one normalize to the other?

4. **Briefing screen duplicate label** — `screen-booking` is `data-screen-label="02 Book a session"` and `screen-briefing` is also `data-screen-label="02 Briefing"` in `Rehearse.html`. Both numbered 02 — likely a labeling error.

5. **Session format hardcoded to "Video call (Zoom)"** — `Rehearse.html:958`. Is Zoom the only integration, or should format be configurable?

6. **Safeword system** — Described in actor portal (`Rehearse-ops.html:1170–1173`) and L&D builder (`Rehearse-ops.html:1836`). "Pause scene" stops recording but both stay on call. No UI for what happens after a safeword is called — how does recording resume? Who ends the pause?

7. **Level 3 pre-approval mechanism** — Pushback Level 3 "requires L&D pre-approval" (`Rehearse-ops.html:1055`, `1899`). No UI exists showing how L&D grants this per-session. Is it a toggle on the session or a global scenario setting?

8. **Two extra scenario stubs** — `raise_denial` and `peer_conflict` appear in the library cards (`Rehearse.html:1745–1747`) but have no entries in `SCEN_DATA`. They are click-through stubs that redirect to booking without content.

9. **Actor application review flow** — Auth shows "Actor applications are reviewed within 2 business days" (`Rehearse-auth.html:509`), but no admin/ops screen exists for reviewing actor applications. Is this part of Payments & Ops, or a separate admin surface?

10. **Cohort assignment mechanism** — L&D can assign scenarios to cohorts (`Rehearse-ops.html:2223`), but there's no UI showing how learners are enrolled in a cohort. Is it by invite, by company domain, manual assignment?

11. **Export/sharing features** — Coach screen shows "Export to L&D" with PDF debrief, Slack to manager, and "Add to playbook" (`Rehearse.html:1303–1310`). These are sketched (`.card.sketch`) and have no implementation detail.

12. **Currency** — Payments are all in CAD (`Rehearse-ops.html:1297`). Is this always CAD, or per-actor based on location?

13. **Session rate per scenario** — Session log shows different rates ($54 for termination, $48 for PIP, $42 for promo denial). Where is the rate-per-scenario configured? Not visible in L&D builder.

14. **"Re-rehearse opening" queue** — Coach suggests "Queue 're-rehearse opening'" (`Rehearse.html:1300`). No queue/retry UI exists anywhere.

15. **Multiple simultaneous sessions** — The ops portal shows a single actor timeline. Can an actor be booked for overlapping sessions? No constraint is visible.

---

## 10. JS / Structure Observations

### Architecture Pattern

All three HTML files are single-file apps: CSS in `<style>`, HTML in `<body>`, JS in `<script>`. No external dependencies, no build step, no framework.

### Shared Patterns

1. **`show(name)` screen switcher** — Present in both `Rehearse.html:1660–1668` and `Rehearse-ops.html:2478–2491`. Pattern: hide all `.screen` elements, show `#screen-{name}`, update `.nav-item.active`, update breadcrumb text, scroll to top, persist to localStorage. Reusable as a client-side router.

2. **`renderAll()`** — `Rehearse.html:1688–1737`. Central render function that reads `SCEN_DATA[SCENARIOS.current]` and populates all screens. Calls sub-renderers: `renderLibrary()`, `renderTimeline()`, `renderSentTracks()`, `renderTopics()`, `renderMoments()`, `renderChat()`, `renderSpark()`, `renderStreaks()`, `renderHistory()`, `renderSkills()`.

3. **Keyboard navigation** — Both files bind number keys (1–7) to screen navigation. `Rehearse.html:1674–1678`, `Rehearse-ops.html:2509–2522`. Ops version is context-aware (switches between L&D/actor/pay key maps).

4. **`switchApp(app)`** — `Rehearse-ops.html:2497–2506`. Toggles between L&D, Actor, and Payments nav groups and shows the default screen for each. Three-app-in-one architecture.

5. **Data-driven rendering** — All tables and dynamic content use JS arrays rendered with `.map().join('')` into `innerHTML`. No templating library.

6. **Tweak/edit mode bridge** — Both files listen for `postMessage` events (`__activate_edit_mode`, `__deactivate_edit_mode`) and announce `__edit_mode_available` on load. This is the wireframe embedding protocol for the `deck-stage.js` presentation wrapper.

### Reusable Logic

- **`show(name)` router** — Directly portable as a screen/page switcher
- **`SCEN_DATA` structure** — Clean enough to become a DB schema with minor normalization
- **`renderAll()` pattern** — Establishes the data flow: global state → per-screen renderers
- **`getSlotsForActorDay(actorId, dateStr)`** — Deterministic pseudo-random slot generation (`Rehearse.html:2014–2023`). Logic is throwaway, but the interface (actor + date → available/taken slots) maps to a real API
- **Calendar rendering** (`renderCalendar()`, `Rehearse.html:2072–2099`) — Basic calendar grid logic that could seed a component

### Presentation-Only

- `deck-stage.js` — Entirely a presentation tool (web component for slide decks). Not Rehearse app logic.
- All `localStorage` usage is for wireframe navigation state, not product persistence.
- All `window.parent.postMessage` usage is for the edit-mode bridge with the deck wrapper.
- Timer in ops (`Rehearse-ops.html:2658–2663`) is a cosmetic in-session clock that counts up from 278 seconds.

---

*Report generated from wireframe source files. No architectural recommendations included.*
