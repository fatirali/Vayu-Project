import {
  pgTable,
  uuid,
  text,
  integer,
  decimal,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { payoutStatusEnum, sessionPaymentStatusEnum } from "./enums.js";
import { users } from "./users.js";
import { sessions } from "./sessions.js";

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sessionCount: integer("session_count").notNull().default(0),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("CAD"),
  stripeBatchId: text("stripe_batch_id"),
  status: payoutStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionPayments = pgTable("session_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  payoutId: uuid("payout_id").references(() => payouts.id),
  rate: decimal("rate", { precision: 8, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("CAD"),
  status: sessionPaymentStatusEnum("status").notNull().default("pending"),
});
