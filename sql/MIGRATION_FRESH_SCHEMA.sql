-- ========================================
-- FRESH SCHEMA MIGRATION - CREATE ALL TABLES FROM SCRATCH
-- Idempotent: Safe to run multiple times
-- Uses _local suffix - easy to convert to _prod for production
-- ========================================
-- To use in production:
--   1. Duplicate this file as MIGRATION_FRESH_SCHEMA_PROD.sql
--   2. Replace all _local with _prod
--   3. Run in production Supabase project

-- ========================================
-- STEP 1: Create car_data_local table (core car records)
-- ========================================
CREATE TABLE IF NOT EXISTS car_data_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,

    -- Note/listing fields
    text TEXT,                         -- Note text
    color TEXT DEFAULT '#FFEB3B',      -- Note color
    make TEXT,                         -- Vehicle make
    model TEXT,                        -- Vehicle model
    price TEXT,                        -- Listing price
    sort INTEGER DEFAULT 0,            -- Global sort order

    -- Feature tracking
    features_source TEXT,              -- Source of feature data ('parsed', 'manual', etc)
    confirmed BOOLEAN DEFAULT FALSE,   -- Features confirmed by user

    -- Metadata fields
    year TEXT,                         -- Рік (Year)
    mileage TEXT,                      -- Пробіг (Mileage)
    address TEXT,                      -- Адреса (Address)
    interior TEXT,                     -- Салон (Interior/Trim)
    seat_type TEXT,                    -- Тип сидінь (Seat Type)
    climate TEXT,                      -- Клімат (Climate Control)
    owners TEXT,                       -- Власників (Number of owners)
    tow_hitch_type TEXT,               -- Фаркоп тип (Tow Hitch Type)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for car_data_local
CREATE INDEX IF NOT EXISTS idx_car_data_car_id ON car_data_local(car_id);
CREATE INDEX IF NOT EXISTS idx_car_data_sort ON car_data_local(sort);
CREATE INDEX IF NOT EXISTS idx_car_data_confirmed ON car_data_local(confirmed);

-- Disable RLS on car_data_local
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: Create features_config_local table (feature dictionary)
-- ========================================
CREATE TABLE IF NOT EXISTS features_config_local (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,  -- e.g., 'feature_acc', 'feature_blind_spot'
    category TEXT NOT NULL,    -- e.g., 'Security', 'Comfort', 'Technology'
    name_uk TEXT NOT NULL,     -- Ukrainian name (e.g., 'ACC')
    sort INTEGER DEFAULT 0,    -- Global sort order (10, 20, 30, etc.)

    -- Priority levels
    -- 0 = low (white) - nice to have
    -- 1 = medium (yellow) - normal features
    -- 2 = high (red) - important features
    priority INTEGER DEFAULT 1,

    -- Multiplier for rating calculation
    multiplier DECIMAL(3,1) DEFAULT 1.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 3: Create car_features_local table (car-feature relationships)
-- ========================================
CREATE TABLE IF NOT EXISTS car_features_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL,  -- References car_data_local.car_id
    feature_id BIGINT NOT NULL REFERENCES features_config_local(id) ON DELETE CASCADE,

    -- Feature state: true = present, false = missing, NULL = unknown
    state BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: each car has only one state per feature
    UNIQUE(car_id, feature_id),

    -- Foreign key to car_data_local
    CONSTRAINT fk_car_features_local_car FOREIGN KEY (car_id)
        REFERENCES car_data_local(car_id) ON DELETE CASCADE
);

-- ========================================
-- STEP 4: Create indexes for performance
==========================================
CREATE INDEX IF NOT EXISTS idx_car_features_local_car_id ON car_features_local(car_id);
CREATE INDEX IF NOT EXISTS idx_car_features_local_feature_id ON car_features_local(feature_id);
CREATE INDEX IF NOT EXISTS idx_features_config_local_sort ON features_config_local(sort);
CREATE INDEX IF NOT EXISTS idx_features_config_local_priority ON features_config_local(priority);
CREATE INDEX IF NOT EXISTS idx_car_features_local_state ON car_features_local(state);

-- Metadata columns already created in STEP 1 with car_data_local table

-- ========================================
-- STEP 6: Populate features_config_local (delete old data first if re-running)
==========================================
DELETE FROM features_config_local WHERE key LIKE 'feature_%';

INSERT INTO features_config_local (key, category, name_uk, sort, priority, multiplier) VALUES
-- HIGH Priority (2) - Important features (10-60)
('feature_acc', 'Security', 'ACC', 10, 2, 1.5),
('feature_android_auto_carplay', 'Technology', 'Android Auto / CarPlay', 20, 2, 1.5),
('feature_camera', 'Cameras & Parking', 'Камера', 30, 2, 1.5),
('feature_parking_sensors', 'Cameras & Parking', 'Парктроніки', 40, 2, 1.5),
('feature_blind_spot', 'Security', 'Blind spot', 50, 2, 1.5),
('feature_tow_hitch', 'Exterior', 'Фаркоп', 60, 2, 1.5),

-- MEDIUM Priority (1) - Normal features (70-140)
('feature_lane_assist', 'Security', 'Lane assist', 70, 1, 1.0),
('feature_signs', 'Security', 'Знаки', 80, 1, 1.0),
('feature_keyless', 'Comfort', 'Keyless', 90, 1, 1.0),
('feature_digital_cockpit', 'Comfort', 'Digital cockpit', 100, 1, 1.0),
('feature_heated_seats', 'Comfort', 'Підігрів сидінь', 110, 1, 1.0),
('feature_massage_seats', 'Comfort', 'Масаж', 120, 1, 1.0),
('feature_matrix_headlights', 'Technology', 'Matrix', 130, 1, 1.0),
('feature_electric_tailgate', 'Exterior', 'Електробагажник', 140, 1, 1.0),

-- LOW Priority (0) - Nice to have (150-260)
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

-- ========================================
-- STEP 7: Disable RLS on remaining tables
-- ========================================
ALTER TABLE features_config_local DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_features_local DISABLE ROW LEVEL SECURITY;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- Schema structure:
--
-- car_data_local: Core car data
--   - id, car_id, text, color
--   - make, model, price, sort, confirmed, features_source
--   - year, mileage, address, interior, seat_type, climate, owners, tow_hitch_type
--   - created_at, updated_at
--
-- features_config_local: Feature dictionary (read-mostly)
--   - id, key, category, name_uk, sort (global 10-260), priority, multiplier
--   - 0 = low (white), 1 = medium (yellow), 2 = high (red)
--
-- car_features_local: Car-feature relationships (1:M)
--   - id, car_id, feature_id, state (true/false/null)
--
-- Benefits:
-- ✅ Idempotent - safe to run multiple times
-- ✅ Add new features with one INSERT - no schema changes
-- ✅ Customizable priorities and multipliers per feature
-- ✅ Global sort order (10, 20, 30...) allows easy insertion
-- ✅ Easy UI customization based on priority
-- ✅ Better data normalization
--
-- ========================================
-- TO CONVERT TO PRODUCTION:
-- ========================================
-- 1. Copy this entire file as MIGRATION_FRESH_SCHEMA_PROD.sql
-- 2. Replace all occurrences of:
--    - car_data_local       -> car_data_prod
--    - features_config_local -> features_config_prod
--    - car_features_local   -> car_features_prod
-- 3. Run in production Supabase project
