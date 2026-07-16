import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import {
  debriefRatingEnum,
  debriefVerdictEnum,
  debriefStatusEnum,
} from "./enums.js";
import { users } from "./users.js";
import { sessions } from "./sessions.js";
import { objectives } from "./scenarios.js";

// One per session. Created by the post-call pipeline (status 'draft');
// the actor reviews AI drafts, adds commentary, and submits.
export const actorDebriefs = pgTable("actor_debriefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  verdict: debriefVerdictEnum("verdict"),
  status: debriefStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One per objective per debrief. ai_* columns are the frozen AI draft;
// actor_* columns are the actor's final word.
export const debriefAssessments = pgTable("debrief_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  debriefId: uuid("debrief_id")
    .notNull()
    .references(() => actorDebriefs.id, { onDelete: "cascade" }),
  objectiveId: uuid("objective_id")
    .notNull()
    .references(() => objectives.id),
  aiRating: debriefRatingEnum("ai_rating"),
  aiNote: text("ai_note"),
  actorRating: debriefRatingEnum("actor_rating"),
  actorComment: text("actor_comment"),
});
