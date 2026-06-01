-- Add reminder tracking columns to sessions
-- Prevents double-sending when cron runs every 30 minutes

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent  boolean NOT NULL DEFAULT false;
