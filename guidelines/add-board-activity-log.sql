-- Add shared activity log to boards so owner and contributors see the same reports
ALTER TABLE boards
ADD COLUMN IF NOT EXISTS activity_log JSONB NOT NULL DEFAULT '[]'::jsonb;
