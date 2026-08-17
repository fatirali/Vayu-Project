import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { sessions } from "./sessions.js";

// One per session, written by the learner on the /reflect screen right after the
// call and before any AI feedback. submitted_at presence => locked (read-only).
export const sessionReflections = pgTable("session_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => users.id),
  feel: text("feel"), // required question
  hardest: text("hardest"),
  wentWell: text("went_well"),
  differently: text("differently"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
