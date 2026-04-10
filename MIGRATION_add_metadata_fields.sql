-- ========================================
-- Migration: Add metadata fields (make, model, price, features_source, confirmed)
-- ========================================

-- Add new columns to car_data_local table
ALTER TABLE car_data_local
ADD COLUMN make TEXT,
ADD COLUMN model TEXT,
ADD COLUMN price TEXT,
ADD COLUMN features_source TEXT,  -- 'parsed' = auto-detected, 'manual' = user-entered, NULL = no features
ADD COLUMN confirmed BOOLEAN DEFAULT FALSE;  -- Whether features have been verified by user

-- Add comments explaining columns
COMMENT ON COLUMN car_data_local.features_source IS 'Source of feature data: "parsed" = auto-detected from page, "manual" = manually entered/edited by user, NULL = no features';
COMMENT ON COLUMN car_data_local.confirmed IS 'Whether features have been verified/confirmed by user';

-- Update existing rows to mark features as 'manual' if they have any features set
UPDATE car_data_local
SET features_source = 'manual'
WHERE features_source IS NULL
  AND (
    feature_acc IS NOT NULL
    OR feature_blind_spot IS NOT NULL
    OR feature_lane_assist IS NOT NULL
    OR feature_signs IS NOT NULL
    OR feature_rear_traffic_alert IS NOT NULL
    OR feature_traffic_jam_assist IS NOT NULL
    OR feature_keyless IS NOT NULL
    OR feature_digital_cockpit IS NOT NULL
    OR feature_heated_seats IS NOT NULL
    OR feature_heated_windshield IS NOT NULL
    OR feature_heated_steering_wheel IS NOT NULL
    OR feature_massage_seats IS NOT NULL
    OR feature_memory_seats IS NOT NULL
    OR feature_android_auto_carplay IS NOT NULL
    OR feature_hud IS NOT NULL
    OR feature_dcc IS NOT NULL
    OR feature_matrix_headlights IS NOT NULL
    OR feature_camera IS NOT NULL
    OR feature_parking_sensors IS NOT NULL
    OR feature_360_camera IS NOT NULL
    OR feature_auto_parking IS NOT NULL
    OR feature_panoramic_roof IS NOT NULL
    OR feature_electric_tailgate IS NOT NULL
    OR feature_auto_tailgate IS NOT NULL
    OR feature_tow_hitch IS NOT NULL
    OR feature_webasto IS NOT NULL
  );

-- Create indexes on new columns for faster lookups
CREATE INDEX idx_car_data_make ON car_data_local(make);
CREATE INDEX idx_car_data_model ON car_data_local(model);
CREATE INDEX idx_car_data_price ON car_data_local(price);
CREATE INDEX idx_car_data_features_source ON car_data_local(features_source);
