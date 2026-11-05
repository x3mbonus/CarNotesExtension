-- ========================================
-- BULK INSERT CAR FEATURES FROM CSV
-- ========================================
-- This script inserts features for 41 Volkswagen cars
-- based on the parsed CSV data
-- ========================================

-- First, let's get the feature IDs for mapping
-- Run this to see the ID mappings:
/*
SELECT id, key, label FROM features_config ORDER BY key;
*/

-- ========================================
-- INSERT/UPSERT FEATURES FOR ALL CARS
-- ========================================

-- Car 1: ID6HYXuK (87900 PLN, 152190km, Passat)
INSERT INTO car_features (car_id, feature_id, state) 
SELECT 'ID6HYXuK', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_massage_seats', 'feature_dcc',
  'feature_matrix_headlights', 'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 2: ID6HTpCA (89900 PLN, 80500km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HTpCA', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_windshield', 'feature_massage_seats', 'feature_dcc',
  'feature_matrix_headlights', 'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate',
  'feature_auto_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 3: ID6HVTRd (86900 PLN, 169000km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HVTRd', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_massage_seats', 'feature_dcc',
  'feature_matrix_headlights', 'feature_auto_parking', 'feature_memory_seats', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 4: 450586022 (18900 EUR, 143875km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '450586022', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_360_camera', 'feature_parking_sensors',
  'feature_massage_seats', 'feature_heated_seats', 'feature_heated_steering_wheel'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 5: ID6HXsrR (89900 PLN, 130010km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HXsrR', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc',
  'feature_matrix_headlights', 'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 6: ID6HVcLW (96600 PLN, 101487km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HVcLW', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_lane_assist', 'feature_signs', 'feature_keyless', 'feature_digital_cockpit',
  'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights', 'feature_auto_parking',
  'feature_tow_hitch', 'feature_electric_tailgate', 'feature_auto_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 7: ID6HWk2B (98900 PLN, 146565km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HWk2B', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 8: 447323963 (19750 EUR, 147000km, Touran mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '447323963', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_parking_sensors', 'feature_rear_traffic_alert', 'feature_tow_hitch', 'feature_panoramic_roof'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 9: 448050552 (17900 EUR, 148000km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '448050552', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_lane_assist', 'feature_signs', 'feature_rear_traffic_alert', 'feature_keyless',
  'feature_heated_seats'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 10: 452032764 (19290 EUR, 90000km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '452032764', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 11: 450858043 (15699 EUR, 156700km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '450858043', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_parking_sensors', 'feature_blind_spot', 'feature_rear_traffic_alert',
  'feature_keyless', 'feature_heated_seats', 'feature_heated_windshield'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 12: 446474113 (16800 EUR, 143831km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '446474113', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_steering_wheel',
  'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 13: 435102788 (17100 EUR, 150636km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '435102788', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_heated_seats', 'feature_heated_windshield', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 14: 449180602 (19480 EUR, 108245km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '449180602', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_rear_traffic_alert',
  'feature_keyless', 'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_steering_wheel',
  'feature_massage_seats', 'feature_dcc', 'feature_matrix_headlights', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 15: 449365977 (17199 EUR, 149367km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '449365977', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_windshield',
  'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 16: 431175643 (15990 EUR, 152890km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '431175643', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_heated_seats', 'feature_heated_steering_wheel', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 17: 447962507 (19300 EUR, 143700km, Touran mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '447962507', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_windshield',
  'feature_dcc', 'feature_matrix_headlights', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 18: 440867802 (19999 EUR, 141899km, Touran mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '440867802', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_windshield',
  'feature_massage_seats', 'feature_dcc', 'feature_matrix_headlights', 'feature_tow_hitch',
  'feature_electric_tailgate', 'feature_panoramic_roof'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 19: ID6HXNpA (104900 PLN, 78389km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HXNpA', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 20: ID6HYd5O (109900 PLN, 88000km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HYd5O', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 21: ID6HYRK0 (99900 PLN, 94033km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HYRK0', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 22: ID6HYpnb (8699790 PLN - probably data entry error, 153608km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HYpnb', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 23: ID6HXgUZ (63960 PLN, 167000km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HXgUZ', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_camera', 'feature_parking_sensors', 'feature_heated_seats'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 24: ID6HX6op (75900 PLN, 131000km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HX6op', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 25: ID6HVR1s (92900 PLN, 99842km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HVR1s', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 26: 450232956 (17590 EUR, 165000km, Touran mobile.de) - appears twice in CSV
INSERT INTO car_features (car_id, feature_id, state)
SELECT '450232956', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_heated_seats', 'feature_heated_windshield', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 27: 440133911 (19500 EUR, 131000km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '440133911', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_heated_seats', 'feature_heated_windshield', 'feature_massage_seats',
  'feature_dcc', 'feature_matrix_headlights', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 28: 448905483 (15999 EUR, 149700km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '448905483', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_heated_seats', 'feature_heated_windshield', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 29: 450757674 (16950 EUR, 132504km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '450757674', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_heated_seats', 'feature_heated_windshield', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 30: ID6HYaTT (79900 PLN, 154600km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HYaTT', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 31: ID6HIVmZ (70000 PLN, 160000km, Passat Variant)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HIVmZ', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_lane_assist', 'feature_signs', 'feature_keyless', 'feature_heated_seats',
  'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 32: ID6HZumj (74900 PLN, 99424km, Passat Variant)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HZumj', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_lane_assist', 'feature_signs', 'feature_keyless', 'feature_heated_seats',
  'feature_heated_windshield', 'feature_dcc', 'feature_tow_hitch'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 33: ID6HNzAu (89900 PLN, 99799km, Passat Variant)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HNzAu', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_massage_seats', 'feature_dcc',
  'feature_matrix_headlights', 'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 34: ID6HVdn4 (8999910 PLN - probably data entry error, 160658km, Passat)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HVdn4', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 35: ID6HXorI (93800 PLN, 121000km, Touran)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HXorI', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 36: ID6HIlrr (89900 PLN, 99000km, Passat Variant)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HIlrr', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_massage_seats', 'feature_dcc',
  'feature_matrix_headlights', 'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 37: 450089405 (19483 EUR, 116400km, Passat mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '450089405', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_steering_wheel',
  'feature_massage_seats', 'feature_dcc', 'feature_matrix_headlights', 'feature_tow_hitch',
  'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 38: 451251804 (18990 EUR, 132000km, Touran mobile.de)
INSERT INTO car_features (car_id, feature_id, state)
SELECT '451251804', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_heated_windshield',
  'feature_dcc', 'feature_matrix_headlights', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 39: ID6HXMPk (79900 PLN, 153221km, Passat Variant)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HXMPk', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- Car 40: ID6HVj9v (95900 PLN, 149700km, Passat Variant)
INSERT INTO car_features (car_id, feature_id, state)
SELECT 'ID6HVj9v', fc.id, true FROM features_config fc WHERE fc.key IN (
  'feature_acc', 'feature_android_auto_carplay', 'feature_camera', 'feature_parking_sensors',
  'feature_blind_spot', 'feature_lane_assist', 'feature_signs', 'feature_keyless',
  'feature_digital_cockpit', 'feature_heated_seats', 'feature_dcc', 'feature_matrix_headlights',
  'feature_auto_parking', 'feature_massage_seats', 'feature_tow_hitch', 'feature_electric_tailgate'
)
ON CONFLICT(car_id, feature_id) DO UPDATE SET state = true;

-- ========================================
-- VERIFICATION
-- ========================================
-- Verify all cars and their feature counts
SELECT 
    car_id,
    COUNT(*) as feature_count,
    COUNT(CASE WHEN state = true THEN 1 END) as features_present,
    COUNT(CASE WHEN state = false THEN 1 END) as features_missing,
    COUNT(CASE WHEN state IS NULL THEN 1 END) as features_unknown
FROM car_features
WHERE car_id IN (
    'ID6HYXuK', 'ID6HTpCA', 'ID6HVTRd', '450586022', 'ID6HXsrR', 'ID6HVcLW', 'ID6HWk2B', 
    '447323963', '448050552', '452032764', '450858043', '446474113', '435102788', '449180602',
    '449365977', '431175643', '447962507', '440867802', 'ID6HXNpA', 'ID6HYd5O', 'ID6HYRK0',
    'ID6HYpnb', 'ID6HXgUZ', 'ID6HX6op', 'ID6HVR1s', '450232956', '440133911', '448905483',
    '450757674', 'ID6HYaTT', 'ID6HIVmZ', 'ID6HZumj', 'ID6HNzAu', 'ID6HVdn4', 'ID6HXorI',
    'ID6HIlrr', '450089405', '451251804', 'ID6HXMPk', 'ID6HVj9v'
)
GROUP BY car_id
ORDER BY car_id;

