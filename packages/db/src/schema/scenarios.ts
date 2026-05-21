import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import {
  scenarioCategoryEnum,
  scenarioDifficultyEnum,
  scenarioStatusEnum,
  stageRuleTypeEnum,
} from "./enums.js";
import { users } from "./users.js";

export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  category: scenarioCategoryEnum("category").notNull(),
  difficulty: scenarioDifficultyEnum("difficulty").notNull(),
  status: scenarioStatusEnum("status").notNull().default("draft"),
  situation: text("situation").notNull(), // HTML-safe string
  targetDuration: text("target_duration").notNull(), // e.g. "18–25 min"
  retryPolicy: text("retry_policy").notNull(), // e.g. "1 take", "retries ok"
  sessionRate: text("session_rate").notNull(), // actor pay rate, e.g. "54.00"
  improvLatitude: integer("improv_latitude").notNull().default(50), // 0-100
  maxPauseLength: integer("max_pause_length").notNull().default(8), // seconds
  offLimitsTopics: text("off_limits_topics"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const personas = pgTable("personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .unique()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  disposition: text("disposition").notNull(),
  emotionalState: text("emotional_state").notNull(),
  // { team, milestones, outsideView, homeLife }
  backstory: jsonb("backstory").notNull().$type<{
    team: string;
    milestones: string;
    outsideView: string;
    homeLife: string;
  }>(),
  motivation: text("motivation").notNull(),
  emotionArc: text("emotion_arc").notNull(), // "Composed → Stunned → Pushback → Resigned"
  dontList: text("dont_list").array().notNull().default([]),
  allowedFacts: text("allowed_facts").array().notNull().default([]),
  vocabularyDo: text("vocabulary_do").array().notNull().default([]),
  vocabularyDont: text("vocabulary_dont").array().notNull().default([]),
});

export const dramaticArcPhases = pgTable("dramatic_arc_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(), // 1-4
  name: text("name").notNull(), // "Composed", "Stunned", etc.
  emotion: text("emotion").notNull(),
  stance: text("stance").notNull(),
  movesOnWhen: text("moves_on_when").notNull(),
  durationEstimate: text("duration_estimate").notNull(), // "~3 min"
});

export const objectives = pgTable("objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  text: text("text").notNull(),
  weight: integer("weight").notNull(), // percentage; must sum to 100 per scenario
});

export const legalRequirements = pgTable("legal_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pushbackTiers = pgTable("pushback_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  // 0 = "Nailed it", 1 = Soft fumble, 2 = Challenge, 3 = Escalated
  level: integer("level").notNull(),
  levelLabel: text("level_label").notNull(),
  trigger: text("trigger").notNull(),
  requiresPreApproval: boolean("requires_pre_approval")
    .notNull()
    .default(false),
});

export const pushbackResponses = pgTable("pushback_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tierId: uuid("tier_id")
    .notNull()
    .references(() => pushbackTiers.id, { onDelete: "cascade" }),
  letter: text("letter").notNull(), // "A", "B", "C"
  text: text("text").notNull(),
  stageDirection: text("stage_direction"),
});

export const coachNudges = pgTable("coach_nudges", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  triggerCondition: text("trigger_condition").notNull(),
  nudgeText: text("nudge_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const stageRules = pgTable("stage_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  type: stageRuleTypeEnum("type").notNull(),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
