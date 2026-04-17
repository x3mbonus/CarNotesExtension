-- Migration: Mark selected features as cool (cool_priority = 1)
-- Requires: add_cool_feature_flag.sql to have been run first
-- Run this in your Supabase SQL editor

UPDATE features_config SET cool_priority = 1 WHERE key = 'feature_memory_seats';
UPDATE features_config SET cool_priority = 1 WHERE key = 'feature_360_camera';
UPDATE features_config SET cool_priority = 1 WHERE key = 'feature_webasto';
UPDATE features_config SET cool_priority = 1 WHERE key = 'feature_heated_steering_wheel';

-- Verify
SELECT sort, key, label, priority, cool_priority
FROM features_config
ORDER BY sort;
