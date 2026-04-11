-- ========================================
-- MIGRATION: car_notes → New Normalized Schema
-- Migrates data from old single-table design to normalized schema
-- NOTE: Features are NOT migrated - they can be added manually in the app
-- ========================================
-- Prerequisites:
--   1. New tables created: car_data_local
--   2. (Optional: features_config_local and car_features_local created)
--
-- Migration Steps:
--   1. Parse sort value from text (e.g., "1-СОРТ", "СОРТ-1")
--   2. Clean text by removing sort prefix (both formats)
--   3. Insert into car_data_local
--
-- TO USE FOR PRODUCTION:
--   Replace all occurrences of '_local' with '_prod' below

-- ========================================
-- STEP 1: Backup old data (optional but recommended)
-- ========================================
-- CREATE TABLE car_notes_backup AS SELECT * FROM car_notes;

-- ========================================
-- STEP 2: Migrate car notes to car_data_local
-- ========================================
INSERT INTO car_data_local (
    car_id,
    text,
    color,
    sort,
    confirmed,
    features_source,
    created_at,
    updated_at
)
SELECT
    cn.car_id,
    -- Clean text: remove sort prefix (both "1-СОРТ" and "СОРТ-1" formats)
    TRIM(REGEXP_REPLACE(cn.text, '^(\d+-СОРТ|СОРТ-\d+)\s*', '')) as text,
    cn.color,
    -- Parse sort value from text (handles both formats: "1-СОРТ" and "СОРТ-1")
    CASE
        WHEN cn.text ~ '^\s*0-СОРТ' OR cn.text ~ '^\s*СОРТ-0' THEN 0
        WHEN cn.text ~ '^\s*1-СОРТ' OR cn.text ~ '^\s*СОРТ-1' THEN 1
        WHEN cn.text ~ '^\s*2-СОРТ' OR cn.text ~ '^\s*СОРТ-2' THEN 2
        WHEN cn.text ~ '^\s*3-СОРТ' OR cn.text ~ '^\s*СОРТ-3' THEN 3
        ELSE NULL
    END as sort,
    -- Mark as not confirmed (user can verify in detail panel)
    FALSE as confirmed,
    -- Mark source as 'imported' since it came from old system
    'imported' as features_source,
    cn.created_at,
    cn.updated_at
FROM car_notes cn
ON CONFLICT (car_id) DO UPDATE SET
    text = EXCLUDED.text,
    color = EXCLUDED.color,
    sort = EXCLUDED.sort,
    updated_at = EXCLUDED.updated_at;

-- ========================================
-- STEP 3: Verify migration
-- ========================================
-- Check how many records were migrated
SELECT
    COUNT(*) as migrated_cars
FROM car_data_local
WHERE features_source = 'imported';

-- View migrated data sample
SELECT
    car_id,
    text,
    color,
    sort,
    features_source,
    created_at
FROM car_data_local
WHERE features_source = 'imported'
LIMIT 5;

-- ========================================
-- STEP 5: Optional - Mark as confirmed after review
-- ========================================
-- After manually reviewing migrated data, run:
-- UPDATE car_data_local SET confirmed = TRUE, features_source = 'manual'
-- WHERE features_source = 'imported';

-- ========================================
-- STEP 6: Optional - Cleanup (after verifying success)
-- ========================================
-- DROP TABLE car_notes;  -- Only after comprehensive testing!
-- OR rename for reference:
-- ALTER TABLE car_notes RENAME TO car_notes_old_backup;
