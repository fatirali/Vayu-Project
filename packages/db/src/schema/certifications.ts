import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { actorCertificationStatusEnum } from "./enums.js";
import { users } from "./users.js";
import { scenarios } from "./scenarios.js";

export const actorCertifications = pgTable("actor_certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scenarioId: uuid("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  status: actorCertificationStatusEnum("status")
    .notNull()
    .default("not_assigned"),
  certifiedAt: timestamp("certified_at", { withTimezone: true }),
});
