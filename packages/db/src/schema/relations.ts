import { relations } from "drizzle-orm";
import { users } from "./users.js";
import {
  scenarios,
  personas,
  dramaticArcPhases,
  objectives,
  legalRequirements,
  pushbackTiers,
  pushbackResponses,
  coachNudges,
  stageRules,
} from "./scenarios.js";
import {
  sessions,
  sessionScores,
  transcriptLines,
  topicCoverage,
  flaggedMoments,
  coachConversations,
} from "./sessions.js";
import { payouts, sessionPayments } from "./payments.js";
import { actorCertifications } from "./certifications.js";
import { cohorts, cohortScenarios, cohortLearners } from "./cohorts.js";

export const usersRelations = relations(users, ({ many }) => ({
  learnedSessions: many(sessions, { relationName: "learnerSessions" }),
  actedSessions: many(sessions, { relationName: "actorSessions" }),
  certifications: many(actorCertifications),
  cohortMemberships: many(cohortLearners),
  flaggedMoments: many(flaggedMoments),
  sessionPayments: many(sessionPayments),
}));

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  persona: one(personas, {
    fields: [scenarios.id],
    references: [personas.scenarioId],
  }),
  arcPhases: many(dramaticArcPhases),
  objectives: many(objectives),
  legalRequirements: many(legalRequirements),
  pushbackTiers: many(pushbackTiers),
  coachNudges: many(coachNudges),
  stageRules: many(stageRules),
  sessions: many(sessions),
  certifications: many(actorCertifications),
  cohortScenarios: many(cohortScenarios),
}));

export const personasRelations = relations(personas, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [personas.scenarioId],
    references: [scenarios.id],
  }),
}));

export const dramaticArcPhasesRelations = relations(
  dramaticArcPhases,
  ({ one }) => ({
    scenario: one(scenarios, {
      fields: [dramaticArcPhases.scenarioId],
      references: [scenarios.id],
    }),
  })
);

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  scenario: one(scenarios, {
    fields: [objectives.scenarioId],
    references: [scenarios.id],
  }),
  topicCoverage: many(topicCoverage),
}));

export const pushbackTiersRelations = relations(
  pushbackTiers,
  ({ one, many }) => ({
    scenario: one(scenarios, {
      fields: [pushbackTiers.scenarioId],
      references: [scenarios.id],
    }),
    responses: many(pushbackResponses),
  })
);

export const pushbackResponsesRelations = relations(
  pushbackResponses,
  ({ one }) => ({
    tier: one(pushbackTiers, {
      fields: [pushbackResponses.tierId],
      references: [pushbackTiers.id],
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  scenario: one(scenarios, {
    fields: [sessions.scenarioId],
    references: [scenarios.id],
  }),
  learner: one(users, {
    fields: [sessions.learnerId],
    references: [users.id],
    relationName: "learnerSessions",
  }),
  actor: one(users, {
    fields: [sessions.actorId],
    references: [users.id],
    relationName: "actorSessions",
  }),
  scores: one(sessionScores, {
    fields: [sessions.id],
    references: [sessionScores.sessionId],
  }),
  transcriptLines: many(transcriptLines),
  topicCoverage: many(topicCoverage),
  flaggedMoments: many(flaggedMoments),
  coachConversation: one(coachConversations, {
    fields: [sessions.id],
    references: [coachConversations.sessionId],
  }),
  payment: one(sessionPayments, {
    fields: [sessions.id],
    references: [sessionPayments.sessionId],
  }),
}));

export const payoutsRelations = relations(payouts, ({ many }) => ({
  sessionPayments: many(sessionPayments),
}));

export const sessionPaymentsRelations = relations(
  sessionPayments,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionPayments.sessionId],
      references: [sessions.id],
    }),
    actor: one(users, {
      fields: [sessionPayments.actorId],
      references: [users.id],
    }),
    payout: one(payouts, {
      fields: [sessionPayments.payoutId],
      references: [payouts.id],
    }),
  })
);

export const actorCertificationsRelations = relations(
  actorCertifications,
  ({ one }) => ({
    actor: one(users, {
      fields: [actorCertifications.actorId],
      references: [users.id],
    }),
    scenario: one(scenarios, {
      fields: [actorCertifications.scenarioId],
      references: [scenarios.id],
    }),
  })
);

export const cohortsRelations = relations(cohorts, ({ many }) => ({
  scenarios: many(cohortScenarios),
  learners: many(cohortLearners),
}));

export const topicCoverageRelations = relations(topicCoverage, ({ one }) => ({
  session: one(sessions, {
    fields: [topicCoverage.sessionId],
    references: [sessions.id],
  }),
  objective: one(objectives, {
    fields: [topicCoverage.objectiveId],
    references: [objectives.id],
  }),
}));
