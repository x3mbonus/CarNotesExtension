-- ========================================
-- PRODUCTION MIGRATION SCRIPT
-- ========================================
-- This script creates all production tables and migrates data
-- from the old car_notes table to the new car_data structure
-- with all metadata fields (make, model, price, price_eur, etc.)
-- ========================================

-- ========================================
-- 1. CREATE features_config TABLE
-- ========================================
-- Feature definitions (lookup table)
CREATE TABLE IF NOT EXISTS public.features_config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    priority SMALLINT DEFAULT 0,
    sort SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.features_config IS 'Feature definitions and metadata';
COMMENT ON COLUMN public.features_config.key IS 'Feature key (e.g., feature_acc, camera)';
COMMENT ON COLUMN public.features_config.label IS 'Display label (e.g., ACC, Camera)';
COMMENT ON COLUMN public.features_config.priority IS 'Priority level: 0=low, 1=medium, 2=high';
COMMENT ON COLUMN public.features_config.sort IS 'Display order';

CREATE INDEX IF NOT EXISTS features_config_key_idx ON public.features_config(key);
CREATE INDEX IF NOT EXISTS features_config_sort_idx ON public.features_config(sort);

-- ========================================
-- 2. CREATE car_data TABLE (MAIN)
-- ========================================
-- Main car data table with all metadata fields
CREATE TABLE IF NOT EXISTS public.car_data (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,
    text TEXT,
    color TEXT DEFAULT '#e0e0e0',
    sort INTEGER,
    confirmed BOOLEAN DEFAULT FALSE,
    features_source TEXT,

    -- Metadata fields (10 total)
    make TEXT,
    model TEXT,
    price TEXT,
    price_eur TEXT,
    year TEXT,
    mileage TEXT,
    address TEXT,
    interior TEXT,
    seat_type TEXT,
    climate TEXT,
    owners TEXT,
    tow_hitch_type TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT car_data_car_id_key UNIQUE(car_id)
);

COMMENT ON TABLE public.car_data IS 'Main car data table with notes, ratings, and metadata';
COMMENT ON COLUMN public.car_data.car_id IS 'Unique car identifier from listing page';
COMMENT ON COLUMN public.car_data.text IS 'User notes';
COMMENT ON COLUMN public.car_data.color IS 'Color rating (hex code)';
COMMENT ON COLUMN public.car_data.sort IS 'Star rating (0-4 stars), -1 for excluded, null for no rating';
COMMENT ON COLUMN public.car_data.confirmed IS 'Verification status flag';
COMMENT ON COLUMN public.car_data.make IS 'Car make/brand (auto-extracted)';
COMMENT ON COLUMN public.car_data.model IS 'Car model (auto-extracted)';
COMMENT ON COLUMN public.car_data.price IS 'Price in PLN';
COMMENT ON COLUMN public.car_data.price_eur IS 'Price in EUR (auto-converted: 100 PLN = 23.50 EUR)';
COMMENT ON COLUMN public.car_data.year IS 'Year (auto-extracted)';
COMMENT ON COLUMN public.car_data.mileage IS 'Mileage in km (auto-extracted)';
COMMENT ON COLUMN public.car_data.seat_type IS 'Seat type (Alcantara, Leather, Cloth, etc.)';
COMMENT ON COLUMN public.car_data.climate IS 'Climate control type (2, 3, Auto)';
COMMENT ON COLUMN public.car_data.owners IS 'Number of previous owners';
COMMENT ON COLUMN public.car_data.tow_hitch_type IS 'Tow hitch type (Swiveling, Detachable, Fixed, No)';

CREATE INDEX IF NOT EXISTS car_data_car_id_idx ON public.car_data(car_id);
CREATE INDEX IF NOT EXISTS car_data_sort_idx ON public.car_data(sort);
CREATE INDEX IF NOT EXISTS car_data_confirmed_idx ON public.car_data(confirmed);
CREATE INDEX IF NOT EXISTS car_data_created_at_idx ON public.car_data(created_at);

-- ========================================
-- 3. CREATE car_features TABLE
-- ========================================
-- Many-to-many: cars to features
CREATE TABLE IF NOT EXISTS public.car_features (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL,
    feature_id BIGINT NOT NULL,
    state BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT car_features_car_id_feature_id_key UNIQUE(car_id, feature_id),
    CONSTRAINT car_features_feature_id_fk FOREIGN KEY (feature_id)
        REFERENCES public.features_config(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.car_features IS 'Car to feature mapping (many-to-many)';
COMMENT ON COLUMN public.car_features.state IS 'Feature state: true=present, false=missing, null=unknown';

CREATE INDEX IF NOT EXISTS car_features_car_id_idx ON public.car_features(car_id);
CREATE INDEX IF NOT EXISTS car_features_feature_id_idx ON public.car_features(feature_id);
CREATE INDEX IF NOT EXISTS car_features_state_idx ON public.car_features(state);

-- ========================================
-- 4. MIGRATE DATA from old car_notes table
-- ========================================
-- Only migrate if old table exists and new table is empty
DO $$
BEGIN
    -- Check if old car_notes table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_notes') THEN
        -- Migrate data from car_notes to car_data (with new fields as NULL)
        INSERT INTO public.car_data (car_id, text, color, created_at, updated_at)
        SELECT car_id, text, color, created_at, updated_at
        FROM public.car_notes
        WHERE car_id NOT IN (SELECT car_id FROM public.car_data)
        ON CONFLICT (car_id) DO NOTHING;

        RAISE NOTICE 'Migrated data from car_notes to car_data';
    ELSE
        RAISE NOTICE 'Old car_notes table does not exist (fresh install)';
    END IF;
END $$;

-- ========================================
-- 5. INSERT FEATURES CONFIG
-- ========================================
-- Populate features_config table with standard features
INSERT INTO public.features_config (key, label, priority, sort) VALUES
    -- High Priority Features (Priority 2)
    ('feature_acc', 'ACC', 2, 1),
    ('feature_parking_sensors', 'Парктроніки', 2, 2),
    ('feature_blind_spot', 'Blind Spot', 2, 3),
    ('feature_lane_assist', 'Lane Assist', 2, 4),
    ('feature_auto_parking', 'Auto Parking', 2, 5),

    -- Medium Priority Features (Priority 1)
    ('feature_android_auto_carplay', 'Android Auto/CarPlay', 1, 10),
    ('feature_heated_seats', 'Heated Seats', 1, 11),
    ('feature_heated_windshield', 'Heated Windshield', 1, 12),
    ('feature_heated_steering_wheel', 'Heated Steering Wheel', 1, 13),
    ('camera', 'Camera', 1, 14),
    ('feature_360_camera', '360 Camera', 1, 15),

    -- Low Priority Features (Priority 0)
    ('feature_signs', 'Sign Recognition', 0, 20),
    ('feature_rear_traffic_alert', 'Rear Traffic Alert', 0, 21),
    ('feature_traffic_jam_assist', 'Traffic Jam Assist', 0, 22),
    ('feature_keyless', 'Keyless', 0, 23),
    ('feature_digital_cockpit', 'Digital Cockpit', 0, 24),
    ('feature_massage_seats', 'Massage Seats', 0, 25),
    ('feature_memory_seats', 'Memory Seats', 0, 26),
    ('feature_dcc', 'DCC', 0, 27),
    ('feature_webasto', 'Webasto', 0, 28),
    ('feature_matrix_headlights', 'Matrix Headlights', 0, 29),
    ('feature_panoramic_roof', 'Panoramic Roof', 0, 30),
    ('feature_electric_tailgate', 'Electric Tailgate', 0, 31),
    ('feature_auto_tailgate', 'Auto Tailgate', 0, 32),
    ('feature_tow_hitch', 'Tow Hitch', 0, 33),
    ('feature_hud', 'HUD', 0, 34)
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 6. VERIFY MIGRATION
-- ========================================
-- Show migration summary
SELECT
    (SELECT COUNT(*) FROM public.car_data) as total_cars,
    (SELECT COUNT(*) FROM public.car_features) as total_features,
    (SELECT COUNT(*) FROM public.features_config) as feature_definitions
AS migration_summary;

-- ========================================
-- 7. ENABLE ROW LEVEL SECURITY (Optional but Recommended)
-- ========================================
-- Uncommit if you want RLS enabled
-- ALTER TABLE public.car_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.car_features ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.features_config ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 8. GRANT PERMISSIONS (If using service role)
-- ========================================
-- Uncommit if you have specific role requirements
-- GRANT ALL PRIVILEGES ON public.car_data TO authenticated;
-- GRANT ALL PRIVILEGES ON public.car_features TO authenticated;
-- GRANT ALL PRIVILEGES ON public.features_config TO authenticated;

