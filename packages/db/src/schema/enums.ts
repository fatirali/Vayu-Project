import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "learner",
  "actor",
  "ld_admin",
  "ops_admin",
]);

export const scenarioCategoryEnum = pgEnum("scenario_category", [
  "termination",
  "feedback",
  "compensation",
  "restructuring",
]);

export const scenarioDifficultyEnum = pgEnum("scenario_difficulty", [
  "easy",
  "medium",
  "hard",
  "hardest",
]);

export const scenarioStatusEnum = pgEnum("scenario_status", [
  "draft",
  "published",
  "archived",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "booked",
  "confirmed",
  "live",
  "completed",
  "cancelled",
  "no_show",
]);

export const speakerEnum = pgEnum("speaker", ["learner", "actor"]);

export const topicCoverageStatusEnum = pgEnum("topic_coverage_status", [
  "covered",
  "partial",
  "missed",
]);

export const flaggedMomentTypeEnum = pgEnum("flagged_moment_type", [
  "great",
  "break",
  "note",
]);

export const flaggedMomentReviewStatusEnum = pgEnum(
  "flagged_moment_review_status",
  ["pending", "reviewed", "dismissed"]
);

export const actorCertificationStatusEnum = pgEnum(
  "actor_certification_status",
  ["certified", "in_training", "not_assigned"]
);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "transit",
  "paid",
  "failed",
]);

export const sessionPaymentStatusEnum = pgEnum("session_payment_status", [
  "pending",
  "paid",
  "flagged",
]);

export const stageRuleTypeEnum = pgEnum("stage_rule_type", ["do", "dont"]);

export const cohortStatusEnum = pgEnum("cohort_status", [
  "drafting",
  "active",
  "completed",
]);

export const cohortLearnerStatusEnum = pgEnum("cohort_learner_status", [
  "not_started",
  "in_progress",
  "at_risk",
  "done",
]);

export const debriefRatingEnum = pgEnum("debrief_rating", [
  "red",
  "yellow",
  "green",
]);

export const debriefVerdictEnum = pgEnum("debrief_verdict", [
  "ready",
  "almost",
  "not_yet",
]);

export const debriefStatusEnum = pgEnum("debrief_status", [
  "draft",
  "submitted",
]);
