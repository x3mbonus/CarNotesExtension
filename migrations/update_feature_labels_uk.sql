-- Migration: Update feature labels (Ukrainian), priorities, and sort order
-- Run this in your Supabase SQL editor

-- ── Labels ────────────────────────────────────────────────────────────────────
UPDATE features_config SET label = 'ACC'                    WHERE key = 'feature_acc';
UPDATE features_config SET label = 'Android Auto / CarPlay' WHERE key = 'feature_android_auto_carplay';
UPDATE features_config SET label = 'Камера'                 WHERE key = 'feature_camera';
UPDATE features_config SET label = 'Парктроніки'            WHERE key = 'feature_parking_sensors';
UPDATE features_config SET label = 'Blind spot'             WHERE key = 'feature_blind_spot';
UPDATE features_config SET label = 'Lane assist'            WHERE key = 'feature_lane_assist';
UPDATE features_config SET label = 'Знаки'                  WHERE key = 'feature_signs';
UPDATE features_config SET label = 'Rear traffic alert'     WHERE key = 'feature_rear_traffic_alert';
UPDATE features_config SET label = 'Traffic Jam Assist'     WHERE key = 'feature_traffic_jam_assist';
UPDATE features_config SET label = 'Keyless'                WHERE key = 'feature_keyless';
UPDATE features_config SET label = 'Digital cockpit'        WHERE key = 'feature_digital_cockpit';
UPDATE features_config SET label = 'Підігрів сидінь'        WHERE key = 'feature_heated_seats';
UPDATE features_config SET label = 'Підігрів лобового'      WHERE key = 'feature_heated_windshield';
UPDATE features_config SET label = 'Підігрів керма'         WHERE key = 'feature_heated_steering_wheel';
UPDATE features_config SET label = 'Масаж'                  WHERE key = 'feature_massage_seats';
UPDATE features_config SET label = 'Пам''ять сидінь'        WHERE key = 'feature_memory_seats';
UPDATE features_config SET label = 'DCC'                    WHERE key = 'feature_dcc';
UPDATE features_config SET label = 'Webasto'                WHERE key = 'feature_webasto';
UPDATE features_config SET label = 'Matrix'                 WHERE key = 'feature_matrix_headlights';
UPDATE features_config SET label = 'Автопаркування'         WHERE key = 'feature_auto_parking';
UPDATE features_config SET label = '360 камера'             WHERE key = 'feature_360_camera';
UPDATE features_config SET label = 'Фаркоп'                 WHERE key = 'feature_tow_hitch';
UPDATE features_config SET label = 'Електробагажник'        WHERE key = 'feature_electric_tailgate';
UPDATE features_config SET label = 'Автобагажник'           WHERE key = 'feature_auto_tailgate';
UPDATE features_config SET label = 'Панорама'               WHERE key = 'feature_panoramic_roof';
UPDATE features_config SET label = 'HUD'                    WHERE key = 'feature_hud';

-- ── Priority ──────────────────────────────────────────────────────────────────
UPDATE features_config SET priority = 2 WHERE key = 'feature_acc';
UPDATE features_config SET priority = 2 WHERE key = 'feature_android_auto_carplay';
UPDATE features_config SET priority = 2 WHERE key = 'feature_camera';
UPDATE features_config SET priority = 2 WHERE key = 'feature_parking_sensors';
UPDATE features_config SET priority = 2 WHERE key = 'feature_blind_spot';
UPDATE features_config SET priority = 1 WHERE key = 'feature_lane_assist';
UPDATE features_config SET priority = 1 WHERE key = 'feature_signs';
UPDATE features_config SET priority = 0 WHERE key = 'feature_rear_traffic_alert';
UPDATE features_config SET priority = 0 WHERE key = 'feature_traffic_jam_assist';
UPDATE features_config SET priority = 1 WHERE key = 'feature_keyless';
UPDATE features_config SET priority = 1 WHERE key = 'feature_digital_cockpit';
UPDATE features_config SET priority = 1 WHERE key = 'feature_heated_seats';
UPDATE features_config SET priority = 0 WHERE key = 'feature_heated_windshield';
UPDATE features_config SET priority = 0 WHERE key = 'feature_heated_steering_wheel';
UPDATE features_config SET priority = 1 WHERE key = 'feature_massage_seats';
UPDATE features_config SET priority = 0 WHERE key = 'feature_memory_seats';
UPDATE features_config SET priority = 0 WHERE key = 'feature_dcc';
UPDATE features_config SET priority = 0 WHERE key = 'feature_webasto';
UPDATE features_config SET priority = 1 WHERE key = 'feature_matrix_headlights';
UPDATE features_config SET priority = 0 WHERE key = 'feature_auto_parking';
UPDATE features_config SET priority = 0 WHERE key = 'feature_360_camera';
UPDATE features_config SET priority = 2 WHERE key = 'feature_tow_hitch';
UPDATE features_config SET priority = 1 WHERE key = 'feature_electric_tailgate';
UPDATE features_config SET priority = 0 WHERE key = 'feature_auto_tailgate';
UPDATE features_config SET priority = 0 WHERE key = 'feature_panoramic_roof';
UPDATE features_config SET priority = 0 WHERE key = 'feature_hud';

-- ── Sort order (controls display sequence in panel and compare table) ──────────
UPDATE features_config SET sort =  1 WHERE key = 'feature_acc';
UPDATE features_config SET sort =  2 WHERE key = 'feature_android_auto_carplay';
UPDATE features_config SET sort =  3 WHERE key = 'feature_camera';
UPDATE features_config SET sort =  4 WHERE key = 'feature_parking_sensors';
UPDATE features_config SET sort =  5 WHERE key = 'feature_blind_spot';
UPDATE features_config SET sort =  6 WHERE key = 'feature_lane_assist';
UPDATE features_config SET sort =  7 WHERE key = 'feature_signs';
UPDATE features_config SET sort =  8 WHERE key = 'feature_rear_traffic_alert';
UPDATE features_config SET sort =  9 WHERE key = 'feature_traffic_jam_assist';
UPDATE features_config SET sort = 10 WHERE key = 'feature_keyless';
UPDATE features_config SET sort = 11 WHERE key = 'feature_digital_cockpit';
UPDATE features_config SET sort = 12 WHERE key = 'feature_heated_seats';
UPDATE features_config SET sort = 13 WHERE key = 'feature_heated_windshield';
UPDATE features_config SET sort = 14 WHERE key = 'feature_heated_steering_wheel';
UPDATE features_config SET sort = 15 WHERE key = 'feature_massage_seats';
UPDATE features_config SET sort = 16 WHERE key = 'feature_memory_seats';
UPDATE features_config SET sort = 17 WHERE key = 'feature_dcc';
UPDATE features_config SET sort = 18 WHERE key = 'feature_webasto';
UPDATE features_config SET sort = 19 WHERE key = 'feature_matrix_headlights';
UPDATE features_config SET sort = 20 WHERE key = 'feature_auto_parking';
UPDATE features_config SET sort = 21 WHERE key = 'feature_360_camera';
UPDATE features_config SET sort = 22 WHERE key = 'feature_tow_hitch';
UPDATE features_config SET sort = 23 WHERE key = 'feature_electric_tailgate';
UPDATE features_config SET sort = 24 WHERE key = 'feature_auto_tailgate';
UPDATE features_config SET sort = 25 WHERE key = 'feature_panoramic_roof';
UPDATE features_config SET sort = 26 WHERE key = 'feature_hud';

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT sort, key, label, priority
FROM features_config
ORDER BY sort;
