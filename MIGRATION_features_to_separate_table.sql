-- ========================================
-- MIGRATION: Move features from columns to separate tables
-- Simplified version (no data preservation needed - tables are empty)
-- ========================================

-- Step 1: Create the global features config dictionary
-- Each feature has its configuration (priority, multiplier, global sort order)
CREATE TABLE features_config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,  -- e.g., 'feature_acc', 'feature_blind_spot'
    category TEXT NOT NULL,    -- e.g., 'Security', 'Comfort', 'Technology' (for UI grouping only)
    name_uk TEXT NOT NULL,     -- Ukrainian name (e.g., 'ACC')
    sort INTEGER DEFAULT 0,    -- Global sort order across all features (10, 20, 30, etc.)

    -- Priority for display and rating calculation
    -- 0 = low (white) - nice to have
    -- 1 = medium (yellow) - normal features
    -- 2 = high (red) - important features
    priority INTEGER DEFAULT 1,

    -- Multiplier for rating calculation (higher = more important for score)
    multiplier DECIMAL(3,1) DEFAULT 1.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create junction table for car-feature relationships
-- Stores the state of each feature for each car
CREATE TABLE car_features (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL,  -- Foreign key reference (VARCHAR to match car_data_local.car_id)
    feature_id BIGINT NOT NULL REFERENCES features_config(id) ON DELETE CASCADE,

    -- Feature state
    -- true = present, false = not present, NULL = unknown
    state BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: each car has only one state per feature
    UNIQUE(car_id, feature_id),

    -- Foreign key to car_data_local
    CONSTRAINT fk_car_features_car FOREIGN KEY (car_id) REFERENCES car_data_local(car_id) ON DELETE CASCADE
);

-- Step 3: Modify car_data_local to remove feature columns and add Ukrainian metadata
-- First, backup/migrate existing feature data
-- (This will be done in Step 5)

-- Step 4: Add indexes for performance
CREATE INDEX idx_car_features_car_id ON car_features(car_id);
CREATE INDEX idx_car_features_feature_id ON car_features(feature_id);
CREATE INDEX idx_features_config_category ON features_config(category);
CREATE INDEX idx_features_config_sort ON features_config(sort);
CREATE INDEX idx_car_features_state ON car_features(state);

-- Step 5: Populate features_config with current feature set
-- Global sort order: 10, 20, 30, etc. (allows room for insertions)
-- Ordered by user display preference with priority levels:
-- Priority: 2=HIGH (red), 1=MEDIUM (yellow), 0=LOW (white)

-- HIGH Priority (2) - Important features
INSERT INTO features_config (key, category, name_uk, sort, priority, multiplier) VALUES
    ('feature_acc', 'Security', 'ACC', 10, 2, 1.5),
    ('feature_android_auto_carplay', 'Technology', 'Android Auto / CarPlay', 20, 2, 1.5),
    ('feature_camera', 'Cameras & Parking', 'Камера', 30, 2, 1.5),
    ('feature_parking_sensors', 'Cameras & Parking', 'Парктроніки', 40, 2, 1.5),
    ('feature_blind_spot', 'Security', 'Blind spot', 50, 2, 1.5),
    ('feature_tow_hitch', 'Exterior', 'Фаркоп', 60, 2, 1.5);

-- MEDIUM Priority (1) - Normal features
INSERT INTO features_config (key, category, name_uk, sort, priority, multiplier) VALUES
    ('feature_lane_assist', 'Security', 'Lane assist', 70, 1, 1.0),
    ('feature_signs', 'Security', 'Знаки', 80, 1, 1.0),
    ('feature_keyless', 'Comfort', 'Keyless', 90, 1, 1.0),
    ('feature_digital_cockpit', 'Comfort', 'Digital cockpit', 100, 1, 1.0),
    ('feature_heated_seats', 'Comfort', 'Підігрів сидінь', 110, 1, 1.0),
    ('feature_massage_seats', 'Comfort', 'Масаж', 120, 1, 1.0),
    ('feature_matrix_headlights', 'Technology', 'Matrix', 130, 1, 1.0),
    ('feature_electric_tailgate', 'Exterior', 'Електробагажник', 140, 1, 1.0);

-- LOW Priority (0) - Nice to have features
INSERT INTO features_config (key, category, name_uk, sort, priority, multiplier) VALUES
    ('feature_rear_traffic_alert', 'Security', 'Rear traffic alert', 150, 0, 0.5),
    ('feature_traffic_jam_assist', 'Security', 'Traffic Jam Assist', 160, 0, 0.5),
    ('feature_heated_windshield', 'Comfort', 'Підігрів лобового', 170, 0, 0.5),
    ('feature_heated_steering_wheel', 'Comfort', 'Підігрів керма', 180, 0, 0.5),
    ('feature_memory_seats', 'Comfort', 'Пам''ять сидінь', 190, 0, 0.5),
    ('feature_dcc', 'Technology', 'DCC', 200, 0, 0.5),
    ('feature_webasto', 'Climate', 'Webasto', 210, 0, 0.5),
    ('feature_auto_parking', 'Cameras & Parking', 'Автопаркування', 220, 0, 0.5),
    ('feature_360_camera', 'Cameras & Parking', '360 камера', 230, 0, 0.5),
    ('feature_auto_tailgate', 'Exterior', 'Автобагажник', 240, 0, 0.5),
    ('feature_panoramic_roof', 'Exterior', 'Панорама', 250, 0, 0.5),
    ('feature_hud', 'Technology', 'HUD', 260, 0, 0.5);

-- Step 6: Update car_data_local table structure
-- Add Ukrainian metadata fields (without _uk suffix - simpler naming)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS year TEXT;          -- Рік (Year)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS mileage TEXT;       -- Пробіг (Mileage)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS address TEXT;       -- Адреса (Address)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS interior TEXT;      -- Салон (Interior/Trim)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS seat_type TEXT;     -- Тип сидінь (Seat Type)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS climate TEXT;       -- Клімат (Climate Control)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS owners TEXT;        -- Власників (Owners)
ALTER TABLE car_data_local ADD COLUMN IF NOT EXISTS tow_hitch_type TEXT; -- Фаркоп тип (Tow Hitch Type)

-- Step 7: Drop old feature columns (simplified since no data to preserve)
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_acc;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_blind_spot;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_lane_assist;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_signs;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_rear_traffic_alert;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_traffic_jam_assist;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_keyless;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_digital_cockpit;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_heated_seats;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_heated_windshield;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_heated_steering_wheel;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_massage_seats;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_memory_seats;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_android_auto_carplay;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_hud;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_dcc;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_matrix_headlights;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_camera;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_parking_sensors;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_360_camera;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_auto_parking;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_panoramic_roof;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_electric_tailgate;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_auto_tailgate;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_tow_hitch;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS feature_webasto;

-- Step 8: Remove old metadata columns if they existed
ALTER TABLE car_data_local DROP COLUMN IF EXISTS year_uk;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS mileage_uk;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS address_uk;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS interior_uk;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS seat_type_uk;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS climate_uk;
ALTER TABLE car_data_local DROP COLUMN IF EXISTS owners_uk;

-- Step 9: Disable RLS on new tables
ALTER TABLE features_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_features DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Migration Complete - Simplified Version
-- ========================================
-- New schema structure:
--
-- car_data_local: Core car data (simplified)
--   - id, car_id, text, color
--   - make, model, price, sort, confirmed, features_source
--   - year, mileage, address, interior, seat_type, climate, owners
--   - created_at, updated_at
--
-- features_config: Global feature dictionary (read-mostly)
--   - id, key, category, name_uk, sort (global 10-260), priority, multiplier
--   - Sort is GLOBAL across all features (not per-category)
--
-- car_features: Car-feature relationships (1:M)
--   - id, car_id, feature_id, state (true/false/null)
--
-- Benefits:
-- ✅ Add new features with one INSERT - no schema changes
-- ✅ Customizable priorities and multipliers per feature
-- ✅ Global sort order (10, 20, 30...) allows easy insertion of new features
-- ✅ Easy UI customization based on priority
-- ✅ Simple column names (year, mileage, address instead of year_uk, mileage_uk)
-- ✅ Better data normalization
