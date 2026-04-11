# Fresh Schema Migration Guide

## Overview
`MIGRATION_FRESH_SCHEMA.sql` creates all database tables with `_local` suffix for development.

**Tables created:**
- `car_data_local` - Core car records (notes, metadata, features tracking)
- `features_config_local` - Feature dictionary (26 features with priorities)
- `car_features_local` - Car-feature relationships

**For production:** Copy the SQL file, replace `_local` with `_prod`, then run in production Supabase.

---

## Quick Start (2 Steps)

### Step 1: Copy SQL
Open [MIGRATION_FRESH_SCHEMA.sql](MIGRATION_FRESH_SCHEMA.sql) and **copy entire contents**.

### Step 2: Run in Supabase
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the SQL
6. Click **Run** (or press `Ctrl+Enter`)
7. Wait for "Command completed successfully"

---

## Verify Schema Created

After running, verify tables exist. Copy into SQL Editor:

```sql
-- Check tables exist (should show 3)
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE '%_local' AND table_schema = 'public'
ORDER BY table_name;

-- Check features (should show 26)
SELECT COUNT(*) as feature_count FROM features_config_local;

-- Show all columns in car_data_local
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'car_data_local' ORDER BY ordinal_position;
```

## Schema Structure

### car_data_local (Core Car Records)
- `id`: Primary key (BIGSERIAL)
- `car_id`: Unique identifier for car (TEXT)
- `text`: Note text from user (TEXT)
- `color`: Note color (TEXT, default #FFEB3B yellow)
- `make`: Vehicle make (TEXT)
- `model`: Vehicle model (TEXT)
- `price`: Listing price (TEXT)
- `sort`: Global sort order (INTEGER, default 0)
- `features_source`: Where features came from (TEXT: 'parsed', 'manual', etc)
- `confirmed`: Whether features have been confirmed (BOOLEAN, default false)
- **Metadata columns**:
  - `year`: Рік (Year)
  - `mileage`: Пробіг (Mileage in km)
  - `address`: Адреса (Address)
  - `interior`: Салон (Interior/Trim)
  - `seat_type`: Тип сидінь (Seat Type)
  - `climate`: Клімат (Climate Control Type)
  - `owners`: Власників (Number of Owners)
  - `tow_hitch_type`: Фаркоп тип (Tow Hitch Type)

### features_config_local (Feature Dictionary)
- `id`: Primary key (BIGSERIAL)
- `key`: Unique identifier (e.g., 'feature_acc')
- `category`: Feature category (Security, Technology, Comfort, etc.)
- `name_uk`: Ukrainian display name
- `sort`: Global sort order (10, 20, 30... up to 260) - allows easy insertion of new features
- `priority`: 0=low (white), 1=medium (yellow), 2=high (red)
- `multiplier`: Rating calculation multiplier (0.5 to 1.5)

### car_features_local (Car-Feature Relationships)
- `id`: Primary key (BIGSERIAL)
- `car_id`: Reference to car_data_local.car_id (TEXT)
- `feature_id`: Reference to features_config_local.id (BIGINT)
- `state`: Feature state - true (✓), false (✗), NULL (?)
- **UNIQUE(car_id, feature_id)**: Each car has one state per feature
- **CASCADE delete**: Removes features when car is deleted

## Features List (26 Total)

### HIGH Priority (2) - Red in UI
1. ACC (10)
2. Android Auto / CarPlay (20)
3. Камера (30)
4. Парктроніки (40)
5. Blind spot (50)
6. Фаркоп (60)

### MEDIUM Priority (1) - Yellow in UI
7. Lane assist (70)
8. Знаки (80)
9. Keyless (90)
10. Digital cockpit (100)
11. Підігрів сидінь (110)
12. Масаж (120)
13. Matrix (130)
14. Електробагажник (140)

### LOW Priority (0) - White in UI
15. Rear traffic alert (150)
16. Traffic Jam Assist (160)
17. Підігрів лобового (170)
18. Підігрів керма (180)
19. Пам'ять сидінь (190)
20. DCC (200)
21. Webasto (210)
22. Автопаркування (220)
23. 360 камера (230)
24. Автобагажник (240)
25. Панорама (250)
26. HUD (260)

## Adding New Features

To add a new feature **without changing schema**:
```sql
INSERT INTO features_config_local (key, category, name_uk, sort, priority, multiplier)
VALUES ('feature_new_feature', 'Category', 'Нова функція', 265, 1, 1.0);
```

Sort values use 10-unit gaps (10, 20, 30... 260), allowing insertion between existing features.

## Why Idempotent?

All CREATE statements use `IF NOT EXISTS`:
- ✅ Safe to run multiple times
- ✅ No errors if tables already exist
- ✅ Easy to include in automated deployment pipelines
- ✅ All indexes check `IF NOT EXISTS` before creation
- ✅ `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for metadata

## Migration to Production

### Create Production Migration File

Copy [MIGRATION_FRESH_SCHEMA.sql](MIGRATION_FRESH_SCHEMA.sql) as `MIGRATION_FRESH_SCHEMA_PROD.sql` and replace:
- `car_data_local` → `car_data_prod`
- `features_config_local` → `features_config_prod`
- `car_features_local` → `car_features_prod`

**Easy way (VS Code Find & Replace):**
1. Open copied file
2. Press `Ctrl+H`
3. Find: `_local`
4. Replace: `_prod`
5. Replace All
6. Save as `MIGRATION_FRESH_SCHEMA_PROD.sql`

Then run in production Supabase project the same way as development.

---

## Future Incremental Migrations

After initial deployment, all future migrations should be **incremental**:

```sql
-- Example: Add new feature
INSERT INTO features_config_local (key, category, name_uk, sort, priority, multiplier)
VALUES ('feature_wireless_charging', 'Technology', 'Бездротова зарядка', 270, 1, 1.0);
```

Save as `MIGRATION_v2.sql`, `MIGRATION_v3.sql`, etc. and run in SQL Editor like the initial migration.

## Technical Notes

- **Tables with _local suffix** - Easy to duplicate and convert to _prod for production
- **Idempotent design** - Safe to run migration multiple times (uses `IF NOT EXISTS`)
- **Automatic indexes** - Created for car_id, sort, confirmed, priority, state
- **Foreign key constraints** - Deleting a car cascades to delete its features
- **Unique constraint** - Ensures no duplicate feature states per car
- **RLS disabled** - Tables accessible via REST API without authentication logic
- **Sort values** - Use 10-260 range with 10-unit gaps, allows easy insertion of new features

## Rollback

If needed (removes all data - be careful!):
```sql
DROP TABLE IF EXISTS car_features_local CASCADE;
DROP TABLE IF EXISTS features_config_local CASCADE;
DROP TABLE IF EXISTS car_data_local CASCADE;
```

Then run the migration again.
