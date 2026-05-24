-- Add actor_rating to sessions table
-- Populated by the learner after chatting with Ada post-session

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS actor_rating smallint CHECK (actor_rating BETWEEN 1 AND 5);
