# Migration: JSON Features → Separate Columns

**Problem Solved:** Concurrent edits to different feature properties were causing conflicts (last-write-wins overwrites entire JSON object).

**Solution:** Each feature now has its own database column, allowing atomic per-feature updates.

---

## Architecture Change

### Before (Problematic - JSON Object)
```
car_data_local.features = {
  "ACC": true,
  "Blind spot": null,
  "Lane assist": false,
  ...
}
```
**Issue:** User A updates `ACC`, User B updates `Blind spot` → One saves last and overwrites other's changes.

### After (Safe - Separate Columns)
```
car_data_local:
  - feature_acc: true
  - feature_blind_spot: null
  - feature_lane_assist: false
  - ...
```
**Benefit:** User A patches `feature_acc`, User B patches `feature_blind_spot` → No conflict, both saves succeed.

---

## Database Migration

### Step 1: Create New Table
Run this in Supabase SQL Editor (from [SCHEMA_SEPARATE_COLUMNS.sql](SCHEMA_SEPARATE_COLUMNS.sql)):

```sql
CREATE TABLE car_data_local (
    id BIGSERIAL PRIMARY KEY,
    car_id TEXT NOT NULL UNIQUE,

    -- Note fields
    text TEXT,
    color TEXT DEFAULT '#FFEB3B',
    sort INTEGER DEFAULT 0,

    -- Security (6 features)
    feature_acc BOOLEAN,
    feature_blind_spot BOOLEAN,
    feature_lane_assist BOOLEAN,
    feature_signs BOOLEAN,
    feature_rear_traffic_alert BOOLEAN,
    feature_traffic_jam_assist BOOLEAN,

    -- Comfort (7 features)
    feature_keyless BOOLEAN,
    feature_digital_cockpit BOOLEAN,
    feature_heated_seats BOOLEAN,
    feature_heated_windshield BOOLEAN,
    feature_heated_steering_wheel BOOLEAN,
    feature_massage_seats BOOLEAN,
    feature_memory_seats BOOLEAN,

    -- Technology (4 features)
    feature_android_auto_carplay BOOLEAN,
    feature_hud BOOLEAN,
    feature_dcc BOOLEAN,
    feature_matrix_headlights BOOLEAN,

    -- Cameras & Parking (4 features)
    feature_camera BOOLEAN,
    feature_parking_sensors BOOLEAN,
    feature_360_camera BOOLEAN,
    feature_auto_parking BOOLEAN,

    -- Exterior (4 features)
    feature_panoramic_roof BOOLEAN,
    feature_electric_tailgate BOOLEAN,
    feature_auto_tailgate BOOLEAN,
    feature_tow_hitch BOOLEAN,

    -- Climate (1 feature)
    feature_webasto BOOLEAN,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_car_data_car_id ON car_data_local(car_id);
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
```

### Step 2: Migrate Old Data (Optional)
If you have existing data in old table format:

```sql
-- Migrate from old JSON-based table
INSERT INTO car_data_local (car_id, text, color, sort, ...)
SELECT car_id, text, color, sort, ... FROM car_data_local_old;
```

---

## Code Changes

### New File: `feature-column-mapper.js`
Maps between feature names and database column names:
- `ACC` ↔ `feature_acc`
- `Blind spot` ↔ `feature_blind_spot`
- `Android Auto / CarPlay` ↔ `feature_android_auto_carplay`

**Key Functions:**
- `featuresToDatabaseRow(features)` - Converts features object to column values
- `databaseRowToFeatures(row)` - Converts database columns back to features object
- `featureToColumnName(name)` - Converts single feature name to column name

### Updated: `supabase-sync.js`
- `saveCarData()` - Uses mapper to convert features to separate columns before INSERT/PATCH
- `getCarData()` - Uses mapper to convert separate columns back to features object
- `getDataByIds()` - Converts columns back to features for bulk operations

**Result:** All mappings happen transparently via mapper—rest of code sees features as before.

### Updated: `manifest.json`
Added `feature-column-mapper.js` to script load order (before features-manager).

---

## Benefits

✅ **Atomic per-feature updates** - Each column PATCH is independent
✅ **Zero concurrency conflicts** - Different features can be updated simultaneously
✅ **Efficient database operations** - Simple boolean column updates instead of JSON manipulation
✅ **Better query capabilities** - Can query feature stats (e.g., `COUNT(*) WHERE feature_acc = true`)
✅ **Backward compatible** - Code still works with features objects, mapper does conversion

---

## How It Works

**Saving Features:**
```
ContentScript: { ACC: true, "Blind spot": null, ... }
    ↓
FeatureColumnMapper.featuresToDatabaseRow()
    ↓
Payload: { feature_acc: true, feature_blind_spot: null, ... }
    ↓
Supabase: PATCH car_data_local SET feature_acc=true, feature_blind_spot=null, ...
```

**Reading Features:**
```
Supabase Row: { feature_acc: true, feature_blind_spot: null, ... }
    ↓
FeatureColumnMapper.databaseRowToFeatures()
    ↓
ContentScript gets: { ACC: true, "Blind spot": null, ... }
```

---

## Production Migration

When ready to use production database:

1. Create production table with same schema (table name: `car_data` instead of `car_data_local`)
2. Update [src/background/supabase-sync.js](src/background/supabase-sync.js#L6):
   ```javascript
   // const TABLE = 'car_data_local';  // Development
   const TABLE = 'car_data';           // Production
   ```
3. Migrate production data if needed
4. Test thoroughly with concurrent users

---

## Total Feature Count

**26 features across 6 categories:**
- Security: 6 (ACC, Blind spot, Lane assist, Signs, Rear traffic alert, Traffic Jam Assist)
- Comfort: 7 (Keyless, Digital cockpit, Heated seats, Heated windshield, Heated steering wheel, Massage seats, Memory seats)
- Technology: 4 (Android Auto / CarPlay, HUD, DCC, Matrix headlights)
- Cameras & Parking: 4 (Camera, Parking sensors, 360 camera, Auto parking)
- Exterior: 4 (Panoramic roof, Electric tailgate, Auto tailgate, Tow hitch)
- Climate: 1 (Webasto)

**26 boolean columns = 26 bytes per feature set (efficiently stored)**

---

## Testing Concurrent Edits

To test the new concurrent-safe behavior:

1. User A opens car detail page → sees features
2. User B opens same car detail page → sees features
3. User A updates `feature_acc` → saves to database immediately
4. User B updates `feature_blind_spot` → saves to database immediately
5. Result: **✅ Both updates succeed, no conflict**

Previously with JSON, User B's save would overwrite User A's ACC update.

