-- ========================================
-- Final Schema: Refactored for scalability
-- ========================================

-- Core car data table (simplified)
CREATE TABLE car_data_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,

    -- ==================== NOTES ====================
    text TEXT,
    color TEXT DEFAULT '#FFEB3B',

    -- ==================== CORE METADATA ====================
    make TEXT,
    model TEXT,
    price TEXT,
    sort INTEGER DEFAULT 0,
    confirmed BOOLEAN DEFAULT FALSE,
    features_source TEXT,  -- 'parsed' or 'manual' or null

    -- ==================== UKRAINIAN FIELDS ====================
    year_uk TEXT,           -- Рік (Year)
    mileage_uk TEXT,        -- Пробіг (Mileage)
    address_uk TEXT,        -- Адреса (Address)
    interior_uk TEXT,       -- Салон (Interior/Trim)
    seat_type_uk TEXT,      -- Тип сидінь (Seat Type)
    climate_uk TEXT,        -- Клімат (Climate Control)
    owners_uk TEXT,         -- Власників (Owners)

    -- ==================== TIMESTAMPS ====================
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_car_data_car_id ON car_data_local(car_id);
CREATE INDEX idx_car_data_make ON car_data_local(make);
CREATE INDEX idx_car_data_model ON car_data_local(model);

-- ==================== FEATURES DICTIONARY ====================
-- This is the master list of all features
-- When you want to add a new feature: just add a row here, no DB schema changes!
CREATE TABLE features_config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,      -- Unique key: 'feature_acc', 'feature_keyless'
    category TEXT NOT NULL,         -- Category for UI grouping
    name_uk TEXT NOT NULL,          -- Ukrainian display name
    sort_order INTEGER DEFAULT 0,   -- UI sort order within category

    -- Priority level (affects UI color when MISSING)
    -- 0 = low (white background)     - nice to have
    -- 1 = medium (yellow background) - normal features
    -- 2 = high (red background)      - important features
    priority INTEGER DEFAULT 1,

    -- Multiplier for rating calculation
    -- Higher = more important for your final vehicle rating
    multiplier DECIMAL(3,1) DEFAULT 1.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_features_config_category ON features_config(category);

-- ==================== CAR FEATURES ====================
-- Junction table linking cars to features (1:M relationship)
-- Each row = one feature state for one car
CREATE TABLE car_features (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL,
    feature_id BIGINT NOT NULL REFERENCES features_config(id) ON DELETE CASCADE,

    -- Feature state: true = present, false = not present, NULL = unknown
    state BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: each car has exactly one state per feature
    UNIQUE(car_id, feature_id),

    -- Foreign key to car_data_local
    CONSTRAINT fk_car_features_car FOREIGN KEY (car_id)
        REFERENCES car_data_local(car_id) ON DELETE CASCADE
);

CREATE INDEX idx_car_features_car_id ON car_features(car_id);
CREATE INDEX idx_car_features_feature_id ON car_features(feature_id);
CREATE INDEX idx_car_features_state ON car_features(state);

-- Disable RLS
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
ALTER TABLE features_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_features DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Example: How to add a new feature (NO schema migration needed!)
-- ========================================
/*
INSERT INTO features_config (key, category, name_uk, sort_order, priority, multiplier)
VALUES ('feature_sunroof', 'Comfort', 'Sunroof', 8, 0, 0.5);

That's it! The feature is now available in the UI without any code or DB schema changes.
*/

-- ========================================
-- Key Benefits of This Structure
-- ========================================
/*
✅ Adding new features: Just INSERT into features_config - no DB/code changes
✅ Custom priorities: Each feature can have different importance levels
✅ Custom rating: Use multipliers to weight features in your rating calculation
✅ UI-controlled colors: Missing features color = depends on priority
   - Priority 0 (LOW): White = not important if missing
   - Priority 1 (MEDIUM): Yellow = moderately important
   - Priority 2 (HIGH): Red = very important if missing
✅ 3-state features: Present (✓) → Unknown (?) → Missing (✗) → Present
✅ Future-proof: Easy to add name_en, name_pl for multi-language support
✅ Data normalization: No duplicate feature definitions
✅ Performance: Efficient queries with proper indexing
*/
