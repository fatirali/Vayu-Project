import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";
import {
  sessionStatusEnum,
  speakerEnum,
  topicCoverageStatusEnum,
  flaggedMomentTypeEnum,
  flaggedMomentReviewStatusEnum,
} from "./enums.js";
import { users } from "./users.js";
import { scenarios } from "./scenarios.js";
import { objectives } from "./scenarios.js";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => users.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  duration: integer("duration").notNull(), // minutes, from scenario config
  calComBookingId: text("cal_com_booking_id"),
  livekitRoomId: text("livekit_room_id"),
  // set after recording upload completes
  recordingPath: text("recording_path"),
  // set after pipeline completes
  analyticsReady: text("analytics_ready"), // 'true' | null
  analyticsError: text("analytics_error"), // error message | null
  deepgramRequestId: text("deepgram_request_id"),
  // learner speaker index from LiveKit (0 or 1) — used to map Deepgram speaker labels
  learnerSpeakerIndex: integer("learner_speaker_index"),
  status: sessionStatusEnum("status").notNull().default("booked"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  recordingDeletedAt: timestamp("recording_deleted_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionScores = pgTable("session_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(), // 0-100
  fillerCount: integer("filler_count").notNull().default(0),
  paceWpm: integer("pace_wpm").notNull().default(0),
  talkRatio: decimal("talk_ratio", { precision: 4, scale: 3 }).notNull(), // 0.000-1.000
  durationActual: integer("duration_actual").notNull().default(0), // seconds
});

export const transcriptLines = pgTable("transcript_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull(), // "MM:SS"
  speaker: speakerEnum("speaker").notNull(),
  text: text("text").notNull(),
  fillerWords: text("filler_words").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const topicCoverage = pgTable("topic_coverage", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  objectiveId: uuid("objective_id")
    .notNull()
    .references(() => objectives.id),
  status: topicCoverageStatusEnum("status").notNull(),
  coveredAt: text("covered_at"), // "MM:SS" timestamp within session, nullable
});

export const flaggedMoments = pgTable("flagged_moments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  flaggedBy: uuid("flagged_by")
    .notNull()
    .references(() => users.id),
  type: flaggedMomentTypeEnum("type").notNull(),
  timestamp: text("timestamp").notNull(), // "MM:SS" within session
  note: text("note"),
  reviewStatus: flaggedMomentReviewStatusEnum("review_status")
    .notNull()
    .default("pending"),
});

export const coachConversations = pgTable("coach_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  messages: text("messages").notNull().default("[]"), // JSON string of message array
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
