# Rehearse — Technical Design Document

> Version: 2.0  
> Date: 2026-05-17  
> Status: Draft  
> Author: Fatir Ali  
> Updated: Aligned with PRD v2.0 (Supabase, LiveKit, Anthropic, Trigger.dev)

---

## 1. Overview

This document describes the technical architecture for Rehearse, a SaaS platform hosted on Vercel where managers practice high-stakes workplace conversations with trained human actors over live video. The system consists of four portals (Learner App, L&D Studio, Actor Portal, Payments & Ops) served as a single Next.js application with role-based routing.

All intelligence (transcription, scoring, coaching) runs **asynchronously post-session**. There is no live transcript during the call. The post-call pipeline is orchestrated by Trigger.dev.

---

## 2. Architecture Principles

1. **Vercel-native** — Leverage Vercel's platform (edge functions, ISR, serverless functions, preview deployments) as the primary hosting and compute layer
2. **Server-first rendering** — Use Next.js App Router with React Server Components by default; client components only where interactivity requires it
3. **Type-safe end-to-end** — TypeScript everywhere, shared types between client and server, Zod validation at API boundaries
4. **Role-based isolation** — Each portal is a route group with middleware-enforced access control; no portal can access another's server actions without explicit cross-portal APIs
5. **WebRTC only for live sessions** — No real-time STT or transcript streaming during calls; everything else is request-response or async pipeline
6. **Progressive enhancement** — Core flows (library, booking, briefing, analytics) work without JS; live session and coaching require full client

---

## 3. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Next.js App Router                    │   │
│  │  ┌──────────┐ ┌────────┐ ┌───────┐ ┌──────────┐ │   │
│  │  │ /learner │ │ /studio│ │/actor │ │  /ops    │ │   │
│  │  │  (app)   │ │ (L&D)  │ │(portal│ │(payments)│ │   │
│  │  └──────────┘ └────────┘ └───────┘ └──────────┘ │   │
│  │         ↓           ↓         ↓          ↓        │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │         Server Actions + API Routes          │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                           │                              │
│            Edge Middleware (auth + role gate)             │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────────────┐
    │              │                      │
    ▼              ▼                      ▼
┌──────────┐  ┌───────────┐  ┌──────────────────────────┐
│Supabase  │  │Trigger.dev│  │   External Services        │
│          │  │(async     │  │                            │
│• Postgres│  │ pipeline) │  │ • LiveKit Cloud (video)    │
│• Auth    │  │           │  │ • Stripe Connect (payouts) │
│• Storage │  │• Download │  │ • Deepgram Nova-3 (batch)  │
│• RLS     │  │• Transcribe│ │ • Anthropic Claude (AI)    │
│          │  │• Analyze  │  │ • Cal.com (booking)        │
│          │  │• Score    │  │ • Google OAuth             │
│          │  │• Notify   │  │ • Resend (email)           │
└──────────┘  └───────────┘  └──────────────────────────┘
```

---

## 4. Technology Stack

### 4.1 Core Platform

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | Vercel-native, RSC, server actions, middleware |
| **Language** | TypeScript 5.x | End-to-end type safety |
| **Hosting** | Vercel Pro | Edge functions, preview deploys, analytics, cron |
| **UI** | React 19 + Tailwind CSS 4 | Component model + utility-first styling matching wireframe tokens |
| **Component lib** | Radix UI primitives + custom design system | Accessible primitives, custom styled to match wireframe aesthetic |
| **State** | Zustand (client) + React Server Components (server) | Minimal client state; server-first data fetching |
| **Forms** | React Hook Form + Zod | Validation on client and server |

### 4.2 Data Layer

| Service | Technology | Rationale |
|---------|-----------|-----------|
| **Primary DB** | Supabase Postgres | Managed Postgres with built-in Auth, Storage, and RLS — single vendor for data layer |
| **ORM** | Drizzle ORM | Type-safe, lightweight, works well with Supabase Postgres |
| **Auth** | Supabase Auth | Email/password + Google OAuth built-in; JWT sessions; edge-compatible |
| **File storage** | Supabase Storage | Session recordings and exports; lifecycle policies for 30/90-day A/V deletion |
| **Search** | Postgres full-text (pg_trgm) | Scenario search; upgrade to Typesense if needed |

### 4.3 External Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Video** | LiveKit Cloud | Live 1:1 WebRTC sessions with egress recording to Supabase Storage |
| **Background jobs** | Trigger.dev v3 | Post-call pipeline orchestration (download → transcribe → analyze → score → notify) |
| **Speech-to-text** | Deepgram Nova-3 (batch) | Post-call transcription with speaker diarization; ~$0.13/session |
| **AI analysis + coach** | Anthropic Claude | Sonnet for post-call analysis + objective scoring; Opus for AI coach (Ada) |
| **Booking** | Cal.com embed | Actor availability and session scheduling; no custom calendar system |
| **Payments** | Stripe Connect (Standard) | Actor payouts; weekly batch transfers |
| **Email** | Resend | Booking confirmations, analytics-ready notifications, actor invites |
| **Monitoring** | Sentry + PostHog | Error tracking + product analytics |

---

## 5. Application Structure

### 5.1 Route Architecture

```
app/
├── (auth)/
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   └── layout.tsx                # Centered card layout, no sidebar
│
├── (learner)/                    # Learner portal (role: learner)
│   ├── library/page.tsx          # Scenario library grid
│   ├── book/[scenarioId]/page.tsx # Booking flow (Cal.com embed)
│   ├── brief/[sessionId]/page.tsx # Pre-session briefing
│   ├── session/[sessionId]/page.tsx # Live rehearsal (client component, LiveKit)
│   ├── analytics/[sessionId]/page.tsx # Post-session debrief
│   ├── coach/[sessionId]/page.tsx # AI coach chat (Phase 2)
│   ├── progress/page.tsx         # My progress (Phase 2)
│   └── layout.tsx                # Learner shell (sidebar + topbar)
│
├── (studio)/                     # L&D Studio (role: ld_admin)
│   ├── scenarios/page.tsx        # Scenario library
│   ├── scenarios/[id]/edit/page.tsx # Scenario builder
│   ├── actors/page.tsx           # Casting matrix + review queue
│   ├── cohorts/page.tsx          # Cohort management
│   ├── cohorts/[id]/page.tsx     # Cohort detail
│   ├── insights/page.tsx         # Aggregate analytics
│   └── layout.tsx                # L&D shell (teal accent)
│
├── (actor)/                      # Actor portal (role: actor)
│   ├── dashboard/page.tsx        # Session dashboard
│   ├── brief/[sessionId]/page.tsx # Character brief
│   ├── playbook/[scenarioId]/page.tsx # Pushback playbook
│   ├── rules/[scenarioId]/page.tsx # Stage rules
│   ├── session/[sessionId]/page.tsx # In-session view (client component)
│   └── layout.tsx                # Actor shell (purple accent)
│
├── (ops)/                        # Payments & Ops (role: ops_admin)
│   ├── overview/page.tsx         # Payments overview
│   ├── sessions/page.tsx         # Session log
│   ├── roster/page.tsx           # Actor roster + Stripe status
│   ├── payouts/page.tsx          # Payout history
│   └── layout.tsx                # Ops shell (stripe-blue accent)
│
├── api/
│   ├── auth/callback/route.ts    # Supabase Auth OAuth callback
│   ├── webhooks/stripe/route.ts
│   ├── webhooks/livekit/route.ts # LiveKit egress / room events
│   ├── webhooks/trigger/route.ts # Trigger.dev pipeline callbacks
│   ├── cron/payouts/route.ts     # Weekly payout cron (Vercel Cron)
│   └── cron/retention/route.ts  # 30-day A/V deletion job
│
├── layout.tsx                    # Root layout (fonts, providers)
└── middleware.ts                 # Supabase Auth + role-based route protection
```

### 5.2 Middleware (Auth + Role Gate)

```typescript
// middleware.ts — simplified
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const ROLE_ROUTES = {
  learner:  ['/library', '/book', '/brief', '/session', '/analytics', '/coach', '/progress'],
  actor:    ['/dashboard', '/brief', '/playbook', '/rules', '/session'],
  ld_admin: ['/scenarios', '/actors', '/cohorts', '/insights'],
  ops_admin:['/overview', '/sessions', '/roster', '/payouts'],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return NextResponse.redirect(new URL('/sign-in', req.url));

  const role = session.user.user_metadata.role as keyof typeof ROLE_ROUTES;
  const allowed = ROLE_ROUTES[role];
  const path = req.nextUrl.pathname;

  if (!allowed.some(prefix => path.startsWith(prefix))) {
    return NextResponse.redirect(new URL(getDefaultRoute(role), req.url));
  }

  return res;
}
```

---

## 6. Data Model

### 6.1 Core Entities (Drizzle Schema)

```typescript
// Simplified — shows relationships, not every column

users
  id            uuid PK
  email         text UNIQUE
  role          enum('learner', 'actor', 'ld_admin', 'ops_admin')
  firstName     text
  lastName      text
  company       text?          // learner only
  jobTitle      text?          // learner only
  linkedinUrl   text?          // actor only
  stripeAccountId text?        // actor only
  approvedAt    timestamp?     // actor only (null = pending)
  createdAt     timestamp

scenarios
  id            uuid PK
  slug          text UNIQUE     // 'termination', 'pip', etc.
  title         text            // short display name
  subtitle      text
  category      enum('termination', 'feedback', 'compensation', 'restructuring')
  difficulty    enum('easy', 'medium', 'hard', 'hardest')
  status        enum('draft', 'published', 'archived')
  situation     text            // HTML-allowed briefing text
  targetDuration text           // e.g., "18-25 min"
  retryPolicy   text            // e.g., "1 take", "retries ok"
  improvLatitude int            // 0-100 slider
  maxPauseLength int            // seconds
  offLimitsTopics text?
  sessionRate   decimal         // actor pay rate per session
  createdBy     uuid FK → users
  createdAt     timestamp
  updatedAt     timestamp

personas                        // character the actor plays
  id            uuid PK
  scenarioId    uuid FK → scenarios UNIQUE
  name          text
  role          text
  disposition   text
  emotionalState text
  backstory     jsonb           // {team, milestones, outsideView, homeLife}
  motivation    text
  emotionArc    text            // "Composed → Stunned → Pushback → Resigned"
  dontList      text[]
  allowedFacts  text[]
  vocabularyDo  text[]
  vocabularyDont text[]

dramatic_arc_phases
  id            uuid PK
  scenarioId    uuid FK → scenarios
  phaseNumber   int             // 1-4
  name          text            // "Composed", "Stunned", etc.
  emotion       text
  stance        text
  movesOnWhen   text
  durationEstimate text
  UNIQUE(scenarioId, phaseNumber)

objectives
  id            uuid PK
  scenarioId    uuid FK → scenarios
  number        int
  text          text
  weight        int             // percentage, sum to 100 per scenario

legal_requirements
  id            uuid PK
  scenarioId    uuid FK → scenarios
  text          text
  sortOrder     int

pushback_tiers
  id            uuid PK
  scenarioId    uuid FK → scenarios
  level         int             // 1, 2, 3
  levelLabel    text            // "Soft fumble", "Challenge", "Escalated"
  trigger       text
  requiresPreApproval boolean DEFAULT false

pushback_responses
  id            uuid PK
  tierId        uuid FK → pushback_tiers
  letter        char(1)         // A, B, C
  text          text
  stageDirection text?

coach_nudges
  id            uuid PK
  scenarioId    uuid FK → scenarios
  triggerCondition text
  nudgeText     text
  sortOrder     int

stage_rules
  id            uuid PK
  scenarioId    uuid FK → scenarios
  type          enum('do', 'dont')
  text          text
  sortOrder     int

actor_certifications
  id            uuid PK
  actorId       uuid FK → users
  scenarioId    uuid FK → scenarios
  status        enum('certified', 'in_training', 'not_assigned')
  certifiedAt   timestamp?

sessions                        // a booked rehearsal
  id            uuid PK
  scenarioId    uuid FK → scenarios
  learnerId     uuid FK → users
  actorId       uuid FK → users
  scheduledAt   timestamp
  duration      int             // minutes
  livekitRoomId text?           // LiveKit room name
  recordingPath text?           // Supabase Storage path for A/V file
  status        enum('booked', 'confirmed', 'live', 'completed', 'cancelled', 'no_show')
  startedAt     timestamp?
  endedAt       timestamp?
  recordingDeletedAt timestamp? // set when A/V blob is hard-deleted
  createdAt     timestamp

session_scores
  id            uuid PK
  sessionId     uuid FK → sessions UNIQUE
  overallScore  int             // 0-100
  fillerCount   int
  paceWpm       int
  talkRatio     decimal         // 0.0-1.0
  durationActual int            // seconds

transcript_lines
  id            uuid PK
  sessionId     uuid FK → sessions
  timestamp     text            // "00:14"
  speaker       enum('learner', 'actor')
  text          text
  fillerWords   text[]          // detected fillers
  createdAt     timestamp

topic_coverage
  id            uuid PK
  sessionId     uuid FK → sessions
  objectiveId   uuid FK → objectives
  status        enum('covered', 'partial', 'missed')
  coveredAt     text?           // timestamp in session

flagged_moments
  id            uuid PK
  sessionId     uuid FK → sessions
  flaggedBy     uuid FK → users  // actor or L&D
  type          enum('great', 'break', 'note')
  timestamp     text
  note          text?
  reviewStatus  enum('pending', 'reviewed', 'dismissed')

coach_conversations              // AI coach chat history (Phase 2)
  id            uuid PK
  sessionId     uuid FK → sessions
  messages      jsonb            // [{who, text, quote?, suggestion?}]
  createdAt     timestamp
  updatedAt     timestamp

cohorts
  id            uuid PK
  name          text
  status        enum('drafting', 'active', 'completed')
  dueDate       date?
  createdBy     uuid FK → users
  createdAt     timestamp

cohort_scenarios
  cohortId      uuid FK → cohorts
  scenarioId    uuid FK → scenarios
  PK(cohortId, scenarioId)

cohort_learners
  cohortId      uuid FK → cohorts
  learnerId     uuid FK → users
  status        enum('not_started', 'in_progress', 'at_risk', 'done')
  PK(cohortId, learnerId)

payouts
  id            uuid PK
  periodStart   date
  periodEnd     date
  recipientCount int
  sessionCount  int
  totalAmount   decimal
  currency      text            // per-actor based on Stripe account country
  stripeBatchId text?
  status        enum('pending', 'transit', 'paid', 'failed')
  createdAt     timestamp

session_payments
  id            uuid PK
  sessionId     uuid FK → sessions
  actorId       uuid FK → users
  payoutId      uuid? FK → payouts
  rate          decimal
  amount        decimal
  currency      text
  status        enum('pending', 'paid', 'flagged')

audit_log                        // immutable — no hard deletes
  id            uuid PK
  actorId       uuid FK → users  // who performed the action
  action        text             // e.g., 'session.completed', 'recording.deleted'
  targetType    text
  targetId      uuid
  metadata      jsonb
  createdAt     timestamp
```

### 6.2 Entity Relationship Summary

```
User (learner) ──1:many──▶ Session ◀──many:1── User (actor)
                                │
                                ├──1:1──▶ SessionScore
                                ├──1:many──▶ TranscriptLine
                                ├──1:many──▶ TopicCoverage
                                ├──1:many──▶ FlaggedMoment
                                ├──1:1──▶ CoachConversation
                                └──1:1──▶ SessionPayment
                                      │
Scenario ──1:1──▶ Persona             └──many:1──▶ Payout
    │
    ├──1:many──▶ DramaticArcPhase (ordered 1-4)
    ├──1:many──▶ Objective (weighted)
    ├──1:many──▶ LegalRequirement
    ├──1:many──▶ PushbackTier ──1:many──▶ PushbackResponse
    ├──1:many──▶ CoachNudge
    ├──1:many──▶ StageRule
    └──many:many──▶ User (actor) via ActorCertification

Cohort ──many:many──▶ Scenario
Cohort ──many:many──▶ User (learner) via CohortLearner
```

---

## 7. Design System

### 7.1 Tailwind Theme Configuration

The wireframes define a complete token system that maps directly to Tailwind config:

```typescript
// tailwind.config.ts (simplified)
export default {
  theme: {
    extend: {
      colors: {
        bg:      '#F7F7F5',
        paper:   '#FBFBF9',
        ink: {
          DEFAULT: '#111114',
          2: '#2A2A30',
          3: '#55555E',
          4: '#8A8A92',
        },
        line: {
          DEFAULT: '#D8D8D2',
          2: '#E6E6E0',
        },
        chip:    '#ECECE5',
        accent: {
          DEFAULT: '#5E6AD2',    // Linear indigo — learner
          2: '#EAEBFA',
        },
        good: {
          DEFAULT: '#3A7D4E',
          2: '#EAF4EE',
        },
        warn: {
          DEFAULT: '#B06A1E',
          2: '#FDF3E7',
        },
        bad: {
          DEFAULT: '#A23A3A',
          2: '#FAECEC',
        },
        actor: {
          DEFAULT: '#7C5CBF',    // Purple — actor portal
          2: '#F1EDFA',
        },
        stripe: {
          DEFAULT: '#635BFF',    // Stripe blue — payments
          2: '#EEEDFF',
        },
        ld: {
          DEFAULT: '#1F7A6B',    // Teal — L&D studio
          2: '#E8F2EF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
};
```

### 7.2 Portal Accent Mapping

Each portal uses a different accent color, applied via CSS custom properties on the layout:

| Portal | Accent Token | Color | Usage |
|--------|-------------|-------|-------|
| Learner | `--accent` | `#5E6AD2` (indigo) | Active nav, buttons, links |
| L&D Studio | `--ld` | `#1F7A6B` (teal) | Active nav, scenario builder |
| Actor Portal | `--actor` | `#7C5CBF` (purple) | Active nav, session cards |
| Payments & Ops | `--stripe` | `#635BFF` (stripe blue) | Active nav, payment badges |

### 7.3 Component Library

Build a shared component library based on the 16 reusable components identified in discovery:

| Component | Props | Variants |
|-----------|-------|----------|
| `<AppShell>` | `portal`, `nav`, `user` | Learner (single nav), Ops (3-group switchable nav) |
| `<TopBar>` | `breadcrumb`, `scenarioPill`, `user` | Standard, with app switcher |
| `<SidebarNav>` | `items`, `activeId`, `portal` | Per-portal accent, keyboard shortcuts |
| `<Pill>` | `label`, `variant` | good, warn, bad, accent, actor, stripe, ld |
| `<Card>` | `children` | solid, outlined |
| `<DataTable>` | `columns`, `data`, `actions` | With filter pills, export |
| `<ScenarioCard>` | `scenario` | Learner (library), L&D (with stats) |
| `<PersonaCard>` | `persona` | Learner (compact), Actor (full brief) |
| `<KPICard>` | `label`, `value`, `unit`, `delta` | Positive/negative delta |
| `<Button>` | `variant`, `size`, `shortcut` | default, ghost, accent, actor, stripe, ld |
| `<TranscriptLine>` | `timestamp`, `speaker`, `text` | Learner (analytics view), Actor (script) |
| `<TierCard>` | `tier` | Read-only (actor), Editable (L&D) |
| `<ObjectiveRow>` | `objective` | Coverage tracker, Builder (editable) |
| `<SessionCard>` | `session` | Today (highlighted), Upcoming |
| `<BarChart>` | `data`, `labels` | Earnings, insights |
| `<StreakHeatmap>` | `weeks` | 4 intensity levels |

---

## 8. Session & Post-Call Architecture

### 8.1 Live Session Flow

There is **no live transcript during the call** (deferred per PRD §6 architectural constraints). The session is a plain 2-person WebRTC call with recording egress. All analysis runs post-call.

```
Learner                    LiveKit Cloud              Actor
   │                            │                        │
   ├──── Join room (SDK) ──────▶│◀──── Join room (SDK) ──┤
   │                            │                        │
   │  (2-person video call)      │  (recording in progress)
   │                            │                        │
   │◀── timer / stage UI ───────│──── timer / stage ────▶│
   │                            │                        │
   │                     actor flags moment               │
   │                            │◀──── flag event ────────┤
   │                            │  (stored server-side)   │
   │                            │                        │
   ├──── End session ──────────▶│──── End session ───────▶│
   │                            │                        │
   │                     LiveKit egress webhook           │
   │                            │──▶ Vercel API          │
   │                            │    → Trigger.dev job   │
```

### 8.2 Post-Call Pipeline (Trigger.dev)

Triggered by LiveKit egress webhook on session end:

```
LiveKit egress complete
  → api/webhooks/livekit receives event
  → Enqueues Trigger.dev job: post-call-pipeline(sessionId)

post-call-pipeline (Trigger.dev v3):
  Step 1: Download recording from LiveKit egress → Supabase Storage
  Step 2: Submit to Deepgram Nova-3 batch (diarization enabled)
  Step 3: Poll Deepgram until complete (~1-3 min)
  Step 4: Parse transcript → write transcript_lines rows
          - Detect filler words from Deepgram metadata
          - Calculate WPM from timestamps
          - Calculate talk/listen ratio from speaker durations
  Step 5: Submit transcript to Claude Sonnet (analysis prompt)
          - Evaluate coverage of each weighted objective
          - Extract top moments with quotes
  Step 6: Write session_scores + topic_coverage rows
  Step 7: Send "analytics ready" notification
          - Email via Resend
          - In-app notification flag on session row
  Step 8: Write audit_log entry (pipeline.completed)

On failure: Trigger.dev auto-retries with exponential backoff.
Alert if pipeline hasn't completed within 10 min (Trigger.dev alerting).
```

### 8.3 Data Retention Pipeline (Trigger.dev)

```
Daily cron (Vercel Cron, 00:00 UTC):
  → Query sessions WHERE recordingPath IS NOT NULL
       AND endedAt < NOW() - INTERVAL '30 days'
       AND recordingDeletedAt IS NULL
  → For each session:
      - Hard-delete blob from Supabase Storage
      - Set recordingDeletedAt = NOW() on session row
      - Write audit_log entry (recording.deleted)
  → Alert if job hasn't run in 25 hours (Trigger.dev health check)

Transcripts are retained indefinitely (text only, no A/V blob).
Session metadata is never hard-deleted (soft-delete pattern, audit-friendly).
```

---

## 9. Authentication & Authorization

### 9.1 Auth Flow

```
Supabase Auth
├── Email/password provider
│   └── Built-in bcrypt hashing; magic link support available
├── Google OAuth provider
└── LinkedIn OAuth (Phase 2 — P1 in PRD)

Session strategy: Supabase JWT (stateless, edge-compatible via @supabase/ssr)
Token contents: { sub (userId), email, role (in user_metadata) }
```

### 9.2 Role-Based Access

| Role | Portal Access | Creation |
|------|--------------|----------|
| `learner` | Learner app only | Self-signup, instant activation |
| `actor` | Actor portal only | Self-apply, requires ops_admin approval (`approvedAt`) |
| `ld_admin` | L&D Studio | Invited by ops_admin |
| `ops_admin` | Payments & Ops, L&D Studio | Seed / invited |

### 9.3 Actor Application Flow

```
Actor signs up → user created with approvedAt = null
  → Row appears in Ops portal "Applications" queue
  → Ops admin reviews LinkedIn URL
  → Approve: set approvedAt = NOW(), send welcome email via Resend
  → Reject: send rejection email, soft-delete user record
```

### 9.4 Row-Level Security

All tables enforce Supabase RLS policies:

- Learner reads own sessions, scores, transcripts only
- Actor reads sessions where `actorId = auth.uid()`
- `ld_admin` reads all scenario and cohort data
- `ops_admin` reads all payment and session data
- `audit_log` is append-only; no role may update or delete rows

---

## 10. Stripe Connect Integration

### 10.1 Actor Onboarding

```
1. Ops invites actor → Stripe Connect account link generated
2. Actor completes Stripe onboarding (Standard account)
3. Stripe webhook → update stripeAccountId on user
4. Identity verification (1-2 days, Stripe handles)
5. Stripe webhook → mark actor as payout-ready
```

### 10.2 Payout Flow

```
Weekly cron (Vercel Cron, Monday 00:00 UTC)
  ├── Query all session_payments WHERE status = 'pending'
  │     AND session.status = 'completed'
  │     AND session.endedAt within payout period
  ├── Group by actor
  ├── For each actor:
  │   └── Stripe Transfer to connected account
  ├── Create payout record
  ├── Update session_payments → 'paid'
  └── Send payout confirmation emails via Resend

Currency: per-actor based on Stripe account country; display in local currency.
```

### 10.3 Session Rate Model

Rates are configured per-scenario in the `scenarios.sessionRate` field:

| Scenario type | Rate |
|--------------|------|
| Termination | $54/session |
| PIP kickoff | $48/session |
| Layoff | $54/session |
| Promo denial | $42/session |

---

## 11. AI Coach (Ada) — Phase 2

### 11.1 Architecture

The AI coach is a post-session chat interface powered by Anthropic Claude Opus:

```
Learner sends message
  → Server action appends to coach_conversations.messages
  → Constructs prompt with:
      - System prompt (Ada persona + coaching framework)
      - Session transcript (full)
      - Session scores + topic coverage
      - Scenario objectives + legal requirements
      - Conversation history
  → Anthropic Claude Opus streaming response (claude-opus-4-6)
  → Stream to client via Server-Sent Events
  → Persist assistant message to coach_conversations
```

### 11.2 Prompt Design

Ada's system prompt encodes the coaching patterns visible in the wireframes:

1. **Open with feeling** — Ask how the session felt before analyzing
2. **Cite specific moments** — Reference transcript timestamps with exact quotes
3. **"TRY THIS" reframes** — Offer concrete alternative phrasings
4. **Don't over-explain** — Mirror the learner's brevity
5. **Challenge gently** — When learner says "that feels abrupt," reframe the perspective

### 11.3 Quote Card Rendering

When the AI references a transcript moment, the response includes structured data:

```json
{
  "type": "quote",
  "timestamp": "00:14",
  "text": "Hey Josh — thanks for making the time..."
}
```

Client renders this as a quote card with timestamp linking to the transcript viewer.

> **Note:** Ada uses `claude-opus-4-6` for coach responses. The post-call analysis pipeline (§8.2) uses `claude-sonnet-4-6` for objective scoring — lower cost, sufficient for structured evaluation tasks.

---

## 12. Deployment & Infrastructure

### 12.1 Vercel Configuration

```
Project settings:
  Framework: Next.js
  Build command: next build
  Output: .next
  Node.js: 20.x

Environment variables:
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL          → Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY     → Supabase anon key (public)
  SUPABASE_SERVICE_ROLE_KEY         → Supabase service role key (server only)

  # LiveKit
  LIVEKIT_API_KEY                   → LiveKit Cloud API key
  LIVEKIT_API_SECRET                → LiveKit Cloud API secret
  NEXT_PUBLIC_LIVEKIT_URL           → wss://your-project.livekit.cloud

  # Deepgram
  DEEPGRAM_API_KEY                  → Deepgram API key

  # Anthropic
  ANTHROPIC_API_KEY                 → Anthropic API key

  # Trigger.dev
  TRIGGER_SECRET_KEY                → Trigger.dev project secret

  # Stripe
  STRIPE_SECRET_KEY                 → Stripe API key
  STRIPE_WEBHOOK_SECRET             → Stripe webhook signing secret

  # Cal.com
  CAL_API_KEY                       → Cal.com API key (for availability queries)

  # Resend
  RESEND_API_KEY                    → Resend API key

  # OAuth
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET

Cron jobs (vercel.json):
  - path: /api/cron/payouts
    schedule: "0 0 * * 1"     # Weekly Monday midnight UTC
  - path: /api/cron/retention
    schedule: "0 0 * * *"     # Daily midnight UTC (A/V deletion)
```

### 12.2 Database Migrations

```
Drizzle Kit for schema migrations:
  drizzle-kit generate   → SQL migration files
  drizzle-kit migrate    → Apply to Supabase Postgres

Supabase local dev:
  supabase start         → Local Postgres + Auth + Storage
  supabase db push       → Push migrations to hosted project

Seed data applied via Drizzle migration on first deployment (4 scenarios + actor profiles).
```

### 12.3 Preview Deployments

Every PR gets:
- Vercel preview URL
- Supabase branch database (via Supabase branching feature)
- Full application with seed data
- Shareable for design/product review

---

## 13. Seed Data Strategy

The wireframes contain rich seed data that becomes the initial content:

| Source | Target Table(s) | Records |
|--------|-----------------|---------|
| `SCEN_DATA` (4 scenarios) | scenarios, personas, dramatic_arc_phases, objectives, legal_requirements, coach_nudges | 4 scenarios, full content |
| `ACTORS` (4 actors) | users (role=actor) | 4 actor profiles |
| Library cards (6 entries) | scenarios (2 additional stubs) | 2 placeholder scenarios |
| `SESSION_LOG` | sessions, session_payments | 8 sample sessions |
| `ROSTER` | users + actor metadata | 6 actors with Stripe status |
| `PAYOUTS` | payouts | 5 payout batches |
| Pushback tiers (from ops wireframe) | pushback_tiers, pushback_responses | ~12 tiers with responses |
| Stage rules (from ops wireframe) | stage_rules | ~12 do/don't rules |

Seed data is applied via a Drizzle migration that runs on first deployment and in preview branches.

---

## 14. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Session recordings contain sensitive conversation content | Supabase Storage encryption at rest + TLS in transit; hard-deleted after 30 days |
| Actor PII (banking via Stripe) | Never store bank details; Stripe handles all sensitive financial data |
| Transcript data privacy | Supabase RLS; learner sees own sessions only |
| L&D admin data access | Scoped to their organization's cohorts and scenarios via RLS |
| CSRF on server actions | Next.js built-in CSRF protection via server actions |
| Rate limiting | Supabase rate limiting on auth endpoints; Vercel edge middleware for API routes |
| Input validation | Zod schemas on all server actions and API routes |
| Audit trail | Immutable `audit_log` table; no hard deletes on session metadata |

---

## 15. Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| TTFB (library page) | <200ms | RSC + edge middleware + ISR for scenario data |
| LCP (any page) | <1.5s | Server-rendered content, streaming |
| Video join time | <3s | LiveKit SDK pre-initialized on briefing page |
| Post-call pipeline | <5 min | Trigger.dev async; Deepgram batch ~1-3 min + Claude Sonnet ~30s |
| Coach response start | <1s | Anthropic streaming via SSE |
| Lighthouse score | >90 | Tailwind purge, image optimization, code splitting |

---

## 16. Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest | Data transformations, scoring logic, pipeline steps |
| Component | Testing Library + Vitest | All shared components |
| Integration | Playwright | Critical user flows (signup → book → session → analytics) |
| API | Vitest + supertest | Server actions and API routes |
| E2E | Playwright | Full portal flows per role |
| Visual regression | Playwright screenshots | Component library + key pages |

---

## 17. Migration Path from Wireframes

The wireframes are single-file HTML apps. The migration to Next.js follows this mapping:

| Wireframe Pattern | Production Equivalent |
|---|---|
| `show(name)` screen switcher | Next.js file-based routing |
| `SCEN_DATA` global object | Supabase Postgres + Drizzle queries via RSC |
| `renderAll()` + sub-renderers | React components with server-fetched props |
| `switchApp(app)` (ops 3-in-1) | Route groups: `(studio)`, `(actor)`, `(ops)` |
| Inline `<style>` with CSS vars | Tailwind config + CSS custom properties |
| `localStorage` persistence | Supabase Auth session state |
| `innerHTML` with `.map().join('')` | JSX with `.map()` |
| `alert()` confirmations | Radix AlertDialog |
| `setTimeout` loading spinners | React Suspense boundaries |
| Client-side form validation | React Hook Form + Zod (client + server) |
| `"Video call (Zoom)"` format label | LiveKit room (format field removed; LiveKit is the only video provider) |

---

*Version 2.0 — aligned with PRD v2.0. Supersedes v1.0 which referenced Neon, Upstash Redis, Zoom Video SDK, OpenAI, and NextAuth.js.*
