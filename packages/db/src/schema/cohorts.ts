import { pgTable, uuid, text, date, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { cohortStatusEnum, cohortLearnerStatusEnum } from "./enums.js";
import { users } from "./users.js";
import { scenarios } from "./scenarios.js";

export const cohorts = pgTable("cohorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: cohortStatusEnum("status").notNull().default("drafting"),
  dueDate: date("due_date"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cohortScenarios = pgTable(
  "cohort_scenarios",
  {
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cohortId, t.scenarioId] })]
);

export const cohortLearners = pgTable(
  "cohort_learners",
  {
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: cohortLearnerStatusEnum("status").notNull().default("not_started"),
  },
  (t) => [primaryKey({ columns: [t.cohortId, t.learnerId] })]
);
