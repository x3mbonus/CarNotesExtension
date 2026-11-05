-- ========================================
-- MIGRATION: Fix Camera Feature Key
-- ========================================
-- This fixes any inconsistencies with 'camera' vs 'feature_camera' keys
-- ========================================

-- Step 1: Check current state
SELECT 'BEFORE FIX - features_config:' AS step;
SELECT id, key, label FROM features_config
WHERE key IN ('camera', 'feature_camera')
ORDER BY key;

SELECT 'BEFORE FIX - car_features count by feature_key:' AS step;
SELECT fc.key, COUNT(cf.car_id) as count
FROM car_features cf
JOIN features_config fc ON cf.feature_id = fc.id
WHERE fc.key IN ('camera', 'feature_camera')
GROUP BY fc.key;

-- Step 2: If there's a 'camera' entry, update it to 'feature_camera'
UPDATE features_config
SET key = 'feature_camera'
WHERE key = 'camera' AND id IN (
    SELECT id FROM features_config WHERE key = 'camera'
);

-- Step 3: If there are duplicates (both camera and feature_camera), merge them
-- Get the IDs
-- This part is complex - we need to:
-- 1. Find the old 'camera' ID (if any)
-- 2. Find the correct 'feature_camera' ID
-- 3. Replace all references from old to new
-- 4. Delete the old entry

-- Only run this if there are actually two different entries:
DO $$
DECLARE
    old_id INT;
    new_id INT;
BEGIN
    -- Find old camera entry
    SELECT id INTO old_id FROM features_config WHERE key = 'camera' LIMIT 1;

    IF old_id IS NOT NULL THEN
        RAISE NOTICE 'Found old camera entry with id: %', old_id;

        -- Find correct feature_camera entry
        SELECT id INTO new_id FROM features_config WHERE key = 'feature_camera' LIMIT 1;

        IF new_id IS NOT NULL AND old_id != new_id THEN
            RAISE NOTICE 'Found correct feature_camera entry with id: %, updating references...', new_id;

            -- Update all car_features to reference the new ID
            UPDATE car_features
            SET feature_id = new_id
            WHERE feature_id = old_id;

            -- Delete the old entry
            DELETE FROM features_config WHERE id = old_id;

            RAISE NOTICE 'Merge complete: old_id % -> new_id %', old_id, new_id;
        ELSE
            RAISE NOTICE 'Old and new IDs are the same, no merge needed';
        END IF;
    ELSE
        RAISE NOTICE 'No old camera entry found, using existing feature_camera';
    END IF;
END $$;

-- Step 4: Verify the fix
SELECT 'AFTER FIX - features_config:' AS step;
SELECT id, key, label FROM features_config
WHERE key = 'feature_camera'
ORDER BY key;

SELECT 'AFTER FIX - car_features with camera:' AS step;
SELECT cf.car_id, fc.key, fc.label, cf.state
FROM car_features cf
JOIN features_config fc ON cf.feature_id = fc.id
WHERE fc.key = 'feature_camera'
ORDER BY cf.car_id
LIMIT 10;

SELECT 'AFTER FIX - total camera features:' AS step;
SELECT COUNT(*) as total_camera_features
FROM car_features cf
JOIN features_config fc ON cf.feature_id = fc.id
WHERE fc.key = 'feature_camera';

-- Step 5: Show summary
SELECT 'SUMMARY:' AS step;
SELECT 'Camera entries in features_config' AS item, COUNT(*) as count FROM features_config WHERE key = 'feature_camera'
UNION ALL
SELECT 'Camera features in car_features', COUNT(*) FROM car_features cf
JOIN features_config fc ON cf.feature_id = fc.id
WHERE fc.key = 'feature_camera';
