-- ========================================
-- ENSURE: feature_camera exists in features_config
-- ========================================
-- This script ensures the camera feature is properly defined
-- ========================================

-- Insert or update camera feature to have the correct key
INSERT INTO features_config (key, label, priority)
VALUES ('feature_camera', 'Камера', 2)
ON CONFLICT (key) DO UPDATE
SET label = 'Камера', priority = 2;

-- Verify it exists
SELECT 'Camera feature in features_config:' AS verification;
SELECT id, key, label, priority FROM features_config WHERE key = 'feature_camera';

-- Show any cars with camera features
SELECT 'Cars with camera features:' AS listing;
SELECT cf.car_id, fc.key, fc.label, cf.state, cf.updated_at
FROM car_features cf
JOIN features_config fc ON cf.feature_id = fc.id
WHERE fc.key = 'feature_camera'
ORDER BY cf.updated_at DESC
LIMIT 20;
