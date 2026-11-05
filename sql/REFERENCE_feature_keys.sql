-- ========================================
-- REFERENCE: Complete Feature Keys Mapping
-- ========================================
-- This file documents the CORRECT feature keys that MUST be used
-- throughout the application and database
-- ========================================

-- IMPORTANT: The correct key format is 'feature_XXXX' with prefix!

-- HIGH PRIORITY (Priority 2) - shown in RED when not present
-- ========================================
SELECT 'HIGH PRIORITY Features:' AS priority_level;
SELECT 'feature_acc' as key, 'ACC' as label, 2 as priority;
SELECT 'feature_android_auto_carplay' as key, 'Android Auto / CarPlay' as label, 2 as priority;
SELECT 'feature_camera' as key, 'Камера' as label, 2 as priority;  -- ✓ CORRECT
SELECT 'feature_parking_sensors' as key, 'Парктроніки' as label, 2 as priority;
SELECT 'feature_blind_spot' as key, 'Blind Spot' as label, 2 as priority;
SELECT 'feature_tow_hitch' as key, 'Фаркоп' as label, 2 as priority;

-- MEDIUM PRIORITY (Priority 1) - shown in YELLOW/ORANGE when not present
-- ========================================
SELECT '' AS '';
SELECT 'MEDIUM PRIORITY Features:' AS priority_level;
SELECT 'feature_lane_assist' as key, 'Lane Assist' as label, 1 as priority;
SELECT 'feature_signs' as key, 'Знаки' as label, 1 as priority;
SELECT 'feature_keyless' as key, 'Keyless' as label, 1 as priority;
SELECT 'feature_digital_cockpit' as key, 'Digital Cockpit' as label, 1 as priority;
SELECT 'feature_heated_seats' as key, 'Підігрів сидінь' as label, 1 as priority;
SELECT 'feature_massage_seats' as key, 'Масаж' as label, 1 as priority;
SELECT 'feature_matrix_headlights' as key, 'Matrix' as label, 1 as priority;
SELECT 'feature_electric_tailgate' as key, 'Електробагажник' as label, 1 as priority;

-- LOW PRIORITY (Priority 0) - shown in WHITE when not present
-- ========================================
SELECT '' AS '';
SELECT 'LOW PRIORITY Features:' AS priority_level;
SELECT 'feature_rear_traffic_alert' as key, 'Rear Traffic Alert' as label, 0 as priority;
SELECT 'feature_traffic_jam_assist' as key, 'Traffic Jam Assist' as label, 0 as priority;
SELECT 'feature_heated_windshield' as key, 'Підігрив лобового' as label, 0 as priority;
SELECT 'feature_heated_steering_wheel' as key, 'Підігрів керма' as label, 0 as priority;
SELECT 'feature_memory_seats' as key, 'Пам\'ять сидінь' as label, 0 as priority;
SELECT 'feature_dcc' as key, 'DCC' as label, 0 as priority;
SELECT 'feature_webasto' as key, 'Webasto' as label, 0 as priority;
SELECT 'feature_auto_parking' as key, 'Автопаркування' as label, 0 as priority;
SELECT 'feature_360_camera' as key, '360 Камера' as label, 0 as priority;
SELECT 'feature_auto_tailgate' as key, 'Автобагажник' as label, 0 as priority;
SELECT 'feature_panoramic_roof' as key, 'Панорама' as label, 0 as priority;
SELECT 'feature_hud' as key, 'HUD' as label, 0 as priority;

-- ========================================
-- ⚠️ WRONG KEYS TO AVOID
-- ========================================
-- ❌ 'camera' - INCORRECT! Use 'feature_camera' instead
-- ❌ 'acc' - INCORRECT! Use 'feature_acc' instead
-- ❌ 'parking' - INCORRECT! Use 'feature_parking_sensors' instead
-- Any key WITHOUT 'feature_' prefix is WRONG!

-- ========================================
-- VERIFY IN DATABASE
-- ========================================
SELECT 'Current features_config entries:' AS check_database;
SELECT id, key, label, priority
FROM features_config
ORDER BY priority DESC, sort ASC;

-- Check for any incorrectly-named camera features
SELECT 'Looking for incorrect keys:' AS issue_check;
SELECT id, key FROM features_config
WHERE key IN ('camera', 'acc', 'parking', 'blind_spot', 'lane_assist')
   OR key NOT LIKE 'feature_%'
ORDER BY key;

-- Show duplicate entries
SELECT 'Checking for duplicates:' AS duplicate_check;
SELECT key, COUNT(*) as count
FROM features_config
GROUP BY key
HAVING COUNT(*) > 1;
