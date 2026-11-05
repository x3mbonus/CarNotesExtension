-- Add URL field to car_data table to store the listing page URL
-- This allows compare table to display links to original listings

ALTER TABLE IF EXISTS car_data_local ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE IF EXISTS car_data ADD COLUMN IF NOT EXISTS url TEXT;

-- Add comment
COMMENT ON COLUMN public.car_data.url IS 'URL of the original listing page';
COMMENT ON COLUMN car_data_local.url IS 'URL of the original listing page';
