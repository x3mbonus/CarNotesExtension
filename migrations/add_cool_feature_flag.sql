-- Migration: Add cool_priority field to features_config table
-- NULL = not cool, 1+ = cool (higher = more important highlight).
-- Using INT instead of BOOL for future extensibility (e.g. different highlight levels).
-- Run this in your Supabase SQL editor

ALTER TABLE features_config
    ADD COLUMN IF NOT EXISTS cool_priority INT DEFAULT NULL;

-- Verify
SELECT key, label, priority, cool_priority
FROM features_config
ORDER BY sort;
