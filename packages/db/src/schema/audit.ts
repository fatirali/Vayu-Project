import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

// Immutable append-only log. A Postgres BEFORE trigger prevents UPDATE/DELETE.
// See migration 0002_rls_policies.sql for the trigger definition.
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id), // nullable: system actions
  action: text("action").notNull(), // e.g. 'session.completed', 'recording.deleted'
  targetType: text("target_type"), // e.g. 'session', 'user'
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
