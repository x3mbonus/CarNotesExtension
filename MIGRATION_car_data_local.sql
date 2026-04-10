-- ========================================
-- Consolidated Car Data Table (Single Table)
-- Combines notes + features in one table
-- ========================================

-- Drop existing tables if migrating from two-table setup
-- DELETE THESE LINES IF NOT MIGRATING FROM SEPARATE TABLES
-- DROP TABLE IF EXISTS car_features_local CASCADE;
-- DROP TABLE IF EXISTS car_notes_local CASCADE;

-- Create single consolidated table
CREATE TABLE car_data_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,

    -- Note fields
    text TEXT,
    color TEXT DEFAULT '#FFEB3B',

    -- Features fields
    features JSONB,
    confirmed BOOLEAN DEFAULT FALSE,
    sort INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on car_id for fast lookups
CREATE INDEX idx_car_data_car_id ON car_data_local(car_id);

-- Disable RLS to allow public/anon access via REST API
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;

-- ========================================
-- MIGRATION SCRIPT (if coming from separate tables)
-- ========================================
-- Uncomment and run this to migrate data from the old two-table setup:
/*
INSERT INTO car_data_local (car_id, text, color, features, confirmed, sort, created_at, updated_at)
SELECT
    cn.car_id,
    cn.text,
    cn.color,
    cf.features,
    cf.confirmed,
    cf.sort,
    COALESCE(cn.created_at, NOW()),
    CASE
        WHEN cn.updated_at IS NOT NULL AND cf.updated_at IS NOT NULL
        THEN GREATEST(cn.updated_at, cf.updated_at)
        WHEN cn.updated_at IS NOT NULL THEN cn.updated_at
        WHEN cf.updated_at IS NOT NULL THEN cf.updated_at
        ELSE NOW()
    END
FROM car_notes_local cn
FULL OUTER JOIN car_features_local cf ON cn.car_id = cf.car_id
WHERE cn.car_id IS NOT NULL OR cf.car_id IS NOT NULL;

-- Then drop old tables
-- DROP TABLE IF EXISTS car_features_local CASCADE;
-- DROP TABLE IF EXISTS car_notes_local CASCADE;
*/
