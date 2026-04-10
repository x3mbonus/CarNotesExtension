-- ========================================
-- Complete Schema: car_data_local with all features and metadata
-- ========================================

CREATE TABLE car_data_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,

    -- ==================== NOTE FIELDS ====================
    text TEXT,
    color TEXT DEFAULT '#FFEB3B',

    -- ==================== METADATA ====================
    make TEXT,                                        -- Vehicle make (e.g., "Volkswagen")
    model TEXT,                                       -- Vehicle model (e.g., "Passat")
    price TEXT,                                       -- Vehicle price (stored as text for flexibility)
    sort INTEGER DEFAULT 0,
    confirmed BOOLEAN DEFAULT FALSE,                  -- Whether features have been verified/confirmed by user
    features_source TEXT,                             -- 'parsed' = auto-detected, 'manual' = user-entered, NULL = no features

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

    -- ==================== TIMESTAMPS ====================
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_car_data_car_id ON car_data_local(car_id);
CREATE INDEX idx_car_data_make ON car_data_local(make);
CREATE INDEX idx_car_data_model ON car_data_local(model);
CREATE INDEX idx_car_data_price ON car_data_local(price);
CREATE INDEX idx_car_data_features_source ON car_data_local(features_source);

-- Disable RLS to allow public/anon access
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;

-- Total: 26 features across 6 categories
-- ✅ Each feature is an independent boolean column
-- ✅ Concurrent edits to different features = ZERO conflict
-- ✅ Simple atomic operations per feature
-- ✅ Metadata fields to track vehicle and feature data origin
