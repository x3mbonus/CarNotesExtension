-- ========================================
-- MIGRATION: Add price_eur column to car_data tables
-- ========================================
-- Adds price_eur field for EUR price storage with automatic PLN->EUR conversion
-- Conversion rate: 100 PLN = 23.50 EUR

-- For local development
ALTER TABLE IF EXISTS car_data_local ADD COLUMN price_eur TEXT;
COMMENT ON COLUMN car_data_local.price_eur IS 'Price in EUR (converted from PLN at rate 100 PLN = 23.50 EUR)';

-- For production (if applicable)
-- ALTER TABLE IF EXISTS car_data ADD COLUMN price_eur TEXT;
