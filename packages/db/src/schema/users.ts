import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums.js";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches auth.users.id from Supabase
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  // Learner-only
  company: text("company"),
  jobTitle: text("job_title"),
  // Actor-only
  linkedinUrl: text("linkedin_url"),
  actorInterests: text("actor_interests").array(), // scenario slugs from signup
  referralSource: text("referral_source"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  calComUsername: text("cal_com_username"),
  stripeAccountId: text("stripe_account_id"),
  stripePayoutEnabled: text("stripe_payout_enabled"), // 'true' | 'false' | null
  // Shared
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
