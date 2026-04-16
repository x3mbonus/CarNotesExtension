-- Migration: Add photo_url field to car_data table
-- Stores the og:image URL captured when the user visits a car listing page.
-- No blob upload — just the original image URL from the listing site.
-- Run this in your Supabase SQL editor

ALTER TABLE car_data
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'car_data' AND column_name = 'photo_url';
