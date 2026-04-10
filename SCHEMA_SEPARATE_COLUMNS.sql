-- ========================================
-- Updated Schema: Separate Columns Per Actual Feature
-- Based on features found in features-parser.js
-- ========================================

-- Drop old table (or rename as backup)
-- ALTER TABLE car_data_local RENAME TO car_data_local_old;

-- Create new table with separate columns per actual feature
CREATE TABLE car_data_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,

    -- Note fields
    text TEXT,
    color TEXT DEFAULT '#FFEB3B',
    sort INTEGER DEFAULT 0,

    -- ==================== SECURITY (6 features) ====================
    feature_acc BOOLEAN,                              -- ACC
    feature_blind_spot BOOLEAN,                       -- Blind spot
    feature_lane_assist BOOLEAN,                      -- Lane assist
    feature_signs BOOLEAN,                            -- Signs
    feature_rear_traffic_alert BOOLEAN,               -- Rear traffic alert
    feature_traffic_jam_assist BOOLEAN,               -- Traffic Jam Assist

    -- ==================== COMFORT (7 features) ====================
    feature_keyless BOOLEAN,                          -- Keyless
    feature_digital_cockpit BOOLEAN,                  -- Digital cockpit
    feature_heated_seats BOOLEAN,                     -- Heated seats
    feature_heated_windshield BOOLEAN,                -- Heated windshield
    feature_heated_steering_wheel BOOLEAN,            -- Heated steering wheel
    feature_massage_seats BOOLEAN,                    -- Massage seats
    feature_memory_seats BOOLEAN,                     -- Memory seats

    -- ==================== TECHNOLOGY (4 features) ====================
    feature_android_auto_carplay BOOLEAN,             -- Android Auto / CarPlay
    feature_hud BOOLEAN,                              -- HUD
    feature_dcc BOOLEAN,                              -- DCC
    feature_matrix_headlights BOOLEAN,                -- Matrix headlights

    -- ==================== CAMERAS & PARKING (4 features) ====================
    feature_camera BOOLEAN,                           -- Camera
    feature_parking_sensors BOOLEAN,                  -- Parking sensors
    feature_360_camera BOOLEAN,                       -- 360 camera
    feature_auto_parking BOOLEAN,                     -- Auto parking

    -- ==================== EXTERIOR (4 features) ====================
    feature_panoramic_roof BOOLEAN,                   -- Panoramic roof
    feature_electric_tailgate BOOLEAN,                -- Electric tailgate
    feature_auto_tailgate BOOLEAN,                    -- Auto tailgate
    feature_tow_hitch BOOLEAN,                        -- Tow hitch

    -- ==================== CLIMATE (1 feature) ====================
    feature_webasto BOOLEAN,                          -- Webasto

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on car_id for fast lookups
CREATE INDEX idx_car_data_car_id ON car_data_local(car_id);

-- Disable RLS to allow public/anon access
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;

-- Total: 26 features across 6 categories
-- ✅ Each feature is an independent boolean column
-- ✅ Concurrent edits to different features = ZERO conflict
-- ✅ Simple atomic PATCH per feature
-- ✅ Easy to add feature statistics/counts

-- ========================================
-- MIGRATION SCRIPT (from old JSON structure)
-- ========================================
-- If you have old data in car_data_local with JSON features column:
-- Uncomment and adapt this to your actual column structure
/*
INSERT INTO car_data_local (
    car_id, text, color, sort,
    feature_acc, feature_blind_spot_monitor, feature_lane_departure, feature_traffic_sign,
    feature_keyless_entry, feature_digital_cockpit, feature_panoramic_sunroof, feature_power_tailgate,
    feature_android_auto, feature_apple_carplay, feature_voice_control, feature_ota_updates,
    feature_front_camera, feature_reverse_camera, feature_360_camera, feature_parking_sensors,
    feature_xenon_bi_xenon, feature_full_led, feature_climate_seats, feature_power_windows,
    feature_dual_zone_climate, feature_heated_seats, feature_ventilated_seats, feature_ambient_lighting,
    created_at, updated_at
)
SELECT
    car_id, text, color, sort,
    (features->>'ACC')::BOOLEAN,
    (features->>'Blind Spot Monitor')::BOOLEAN,
    (features->>'Lane Departure Warning')::BOOLEAN,
    (features->>'Traffic Sign Recognition')::BOOLEAN,
    (features->>'Keyless Entry')::BOOLEAN,
    (features->>'Digital Cockpit')::BOOLEAN,
    (features->>'Panoramic Sunroof')::BOOLEAN,
    (features->>'Power Tailgate')::BOOLEAN,
    (features->>'Android Auto')::BOOLEAN,
    (features->>'Apple CarPlay')::BOOLEAN,
    (features->>'Voice Control')::BOOLEAN,
    (features->>'OTA Updates')::BOOLEAN,
    (features->>'Front Camera')::BOOLEAN,
    (features->>'Reverse Camera')::BOOLEAN,
    (features->>'360 Camera')::BOOLEAN,
    (features->>'Parking Sensors')::BOOLEAN,
    (features->>'Xenon/Bi-Xenon')::BOOLEAN,
    (features->>'Full LED')::BOOLEAN,
    (features->>'Climate Control Seats')::BOOLEAN,
    (features->>'Power Windows')::BOOLEAN,
    (features->>'Dual Zone Climate')::BOOLEAN,
    (features->>'Heated Seats')::BOOLEAN,
    (features->>'Ventilated Seats')::BOOLEAN,
    (features->>'Ambient Lighting')::BOOLEAN,
    created_at, updated_at
FROM car_data_local_old;

-- Then drop old table
-- DROP TABLE car_data_local_old;
*/

-- ========================================
-- BENEFITS OF SEPARATE COLUMNS
-- ========================================
-- ✅ Atomic per-feature updates (no JSON overwrite risk)
-- ✅ Two concurrent users editing different features = NO CONFLICT
-- ✅ Simple PATCH operation: PATCH /rest/v1/car_data_local?car_id=eq.ABC123 { "feature_acc": true }
-- ✅ Easy to query feature statistics (COUNT, GROUP BY, etc)
-- ✅ Foreign key relationships possible if needed
-- ✅ Better indexing options
--
-- TRADEOFFS:
-- ⚠️  Schema is fixed (24 features now, adding new feature = ALTER TABLE)
-- ⚠️  More columns (but modern DBs handle this well)
-- ⚠️  Slightly verbosity in code (feature_* naming convention)
