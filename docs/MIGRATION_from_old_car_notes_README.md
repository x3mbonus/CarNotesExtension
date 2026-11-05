# Migration Guide: Old car_notes → New Normalized Schema

## Overview
This migration moves data from your old `car_notes` table to the new normalized schema:
- **car_data_local** - Car records with metadata
- **features_config_local** - Feature dictionary (26 features)
- **car_features_local** - Car-feature relationships

## What the Migration Does

### 1. **Parses Sort Values**
Extracts rating from text like:
- `"1-СОРТ 20 км..."` → sort = 1
- `"3-СОРТ. не видно..."` → sort = 3
- `"простa, тканина..."` → sort = null

### 2. **Cleans Note Text**
Removes sort prefix so text is clean:
- Before: `"1-СОРТ 20 км Brühl Є: ACC..."`
- After: `"20 км Brühl Є: ACC..."`

### 3. **Extracts Features**
Parses text to identify mentioned features:
- Looks for "Є:" (has) → marks feature as TRUE
- Looks for "Немає:" (doesn't have) → marks feature as FALSE
- Unmentioned features → NULL (unknown)

Example:
```
"Є: ACC, blind spot, CarPlay
 Немає: масаж, електробагажник"
```
Creates:
- ACC → TRUE
- blind spot → TRUE
- CarPlay → TRUE
- massage → FALSE
- electric trunk → FALSE

## Setup Steps

### 1. Verify Prerequisites
```sql
-- Check that new tables exist
SELECT * FROM car_data_local LIMIT 0;
SELECT * FROM features_config_local LIMIT 1;
SELECT * FROM car_features_local LIMIT 0;
```

### 2. Run the Migration
**For Development (LOCAL):**
```sql
-- Copy entire MIGRATION_from_old_car_notes.sql and run
```

**For Production:**
Before running the script:
1. Open `MIGRATION_from_old_car_notes.sql`
2. Replace all `_local` with `_prod`
3. Run the modified script

### 3. Verify Results
```sql
-- Check migrated records
SELECT COUNT(*) FROM car_data_local WHERE features_source = 'imported';

-- View sample
SELECT car_id, text, sort, color FROM car_data_local
WHERE features_source = 'imported' LIMIT 3;

-- Check features were created
SELECT car_id, COUNT(*) as feature_count
FROM car_features_local
GROUP BY car_id LIMIT 5;
```

### 4. Manual Review
Open the app and check:
- ✅ All notes appear correctly
- ✅ Colors are preserved
- ✅ Sort values parsed correctly
- ✅ Features extracted reasonably

### 5. Mark as Reviewed
Once confirmed, update the records:
```sql
UPDATE car_data_local
SET confirmed = TRUE, features_source = 'manual'
WHERE features_source = 'imported';
```

### 6. Optional: Cleanup Old Data
After comprehensive testing:
```sql
-- Option A: Delete old table (DANGEROUS - backup first)
DROP TABLE car_notes;

-- Option B: Rename as backup (SAFER)
ALTER TABLE car_notes RENAME TO car_notes_old_backup;
```

## Important Notes

⚠️ **Always backup before running:** The script uses `ON CONFLICT ... DO UPDATE` which can modify existing data

⚠️ **Test on LOCAL first:** Run migration on `_local` tables first, verify in app, then repeat for `_prod`

⚠️ **Feature extraction is regex-based:** May not catch all features if text format varies. You can manually edit features in the app after migration

✅ **Data preserved:** Old `car_notes` table is NOT deleted. You can verify and roll back if needed.

## Feature Extraction Examples

### Status: "Є:" and "Немає:" sections
```
Input: "Є: ACC, blind spot, CarPlay
         Немає: масаж масажа"
Output:
- ACC → TRUE
- blind spot → TRUE
- CarPlay → TRUE
- massage → FALSE
```

### Status: Inline mentions
```
Input: "тканина, simple, no ACC, проста, АМ радіо"
Output:
- Detected features marked TRUE if found
- Others remain NULL
```

### Status: Partial text
```
Input: "3-СОРТ. не видно фаркопа... ACC, камери... Немає digital cockpit"
Output:
- sort = 3
- text = "не видно фаркопа... ACC, камери... Немає digital cockpit"
- ACC → TRUE
- camera → TRUE
- digital cockpit → FALSE
```

## Troubleshooting

### No records migrated?
```sql
-- Check if old car_notes table exists
SELECT COUNT(*) FROM car_notes;

-- Check if car_data_local is writable
INSERT INTO car_data_local (car_id, text) VALUES ('TEST-ID', 'test');
DELETE FROM car_data_local WHERE car_id = 'TEST-ID';
```

### Features not extracted?
- Text format may not match regex patterns
- Try manual feature entry in the app
- Features extracted are marked as `NULL` until user confirms

### Duplicate car_ids?
```sql
-- Check conflicts
SELECT car_id, COUNT(*)
FROM car_data_local
GROUP BY car_id
HAVING COUNT(*) > 1;
```

## Rollback

If issues occur:
```sql
-- Restore from backup
DROP TABLE car_data_local;
DROP TABLE car_features_local;
-- Recreate from MIGRATION_FRESH_SCHEMA.sql
```

## Next Steps

After successful migration:
1. Test the app with migrated data
2. Review and correct extracted features
3. Update `features_source` from 'imported' to 'manual'
4. Archive old `car_notes` table (don't delete immediately)

---

**Script Location:** `MIGRATION_from_old_car_notes.sql`
**Related Files:**
- `MIGRATION_FRESH_SCHEMA.sql` (new schema setup)
- `QUICK_START.md` (overall setup guide)
