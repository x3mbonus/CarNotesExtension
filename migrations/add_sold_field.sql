-- Migration: Add sold field to car_data table
-- Run this in your Supabase SQL editor

ALTER TABLE car_data
    ADD COLUMN IF NOT EXISTS sold BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: index for fast filtering in compare tool
CREATE INDEX IF NOT EXISTS idx_car_data_sold ON car_data (sold);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'car_data' AND column_name = 'sold';
