# Unified Database Setup Guide

**Previous Issue:** RLS (Row-Level Security) policy was blocking inserts to separate tables.

**Solution:** Consolidated to a single table with RLS disabled for easier management.

---

## Step 1: Create the New Table in Supabase

Go to **Supabase Dashboard** → **SQL Editor** → Create a new query with:

```sql
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

-- Disable RLS to allow public/anon access
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
```

**Click "Run"** to execute.

---

## Step 2: Optional - Migrate Old Data

If you have existing data in separate tables, you can migrate it:

```sql
-- Combine data from old separate tables
INSERT INTO car_data_local (car_id, text, color, features, confirmed, sort, created_at, updated_at)
SELECT
    COALESCE(cn.car_id, cf.car_id) as car_id,
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

-- (Optional) Drop old tables after verifying migration
-- DROP TABLE IF EXISTS car_features_local CASCADE;
-- DROP TABLE IF EXISTS car_notes_local CASCADE;
```

---

## Step 3: Verify Setup Works

The extension will now:
- ✅ Save notes and features to the **same row**
- ✅ Skip RLS policy issues
- ✅ Retrieve both note + feature data in one query
- ✅ Automatically INSERT if row doesn't exist, UPDATE if it does

---

## Architecture Changes

### Before (2 Tables - Problematic)
```
car_notes_local: car_id, text, color, created_at, updated_at
car_features_local: car_id, features, confirmed, sort, updated_at
```
**Issues:** Separate tables = RLS policies conflict, more complex sync logic

### After (1 Table - Clean)
```
car_data_local: car_id, text, color, features, confirmed, sort, created_at, updated_at
```
**Benefits:**
- Single source of truth
- No RLS issues (disabled for simplicity)
- Atomic transactions (notes + features saved together)
- Better data cohesion
- Simpler sync logic

---

## Switching to Production

When ready to use production credentials, update [src/background/supabase-sync.js](src/background/supabase-sync.js#L6):

```javascript
// const TABLE = 'car_data_local';  // Development
const TABLE = 'car_data';           // Production
```

Then create the same table in your production database with:
```sql
CREATE TABLE car_data ( /* same schema as car_data_local */ );
```

---

## Troubleshooting

**"HTTP 401" error with code 42501?**
- ✅ Fixed by disabling RLS with `ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;`
- Alternatively: Set up public INSERT/UPDATE/SELECT policies

**Can't connect?**
- Verify Supabase URL and API key in extension options
- Check table exists: Go to Supabase Dashboard → Tables → `car_data_local`

**Missing old data?**
- Run the migration script above to combine old separate tables
- Or manually recreate from listings

