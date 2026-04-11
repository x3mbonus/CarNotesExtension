# Database Redesign - Features Refactoring

## 🎯 Overview
Moved features from 26 individual columns in `car_data_local` to a normalized structure using:
- **features_config**: Global feature dictionary (read-mostly)
- **car_features**: Car-feature relationships (1:M)

## ⚠️ Before You Apply the Migration

1. **Backup your Supabase data** - This migration is significant
2. **Read through the migration SQL** - Understand each step
3. **Test on a dev database first** - If possible

## 📋 Step-by-Step Migration

### Step 1: Create New Tables
```sql
-- features_config: Master dictionary of all features
-- car_features: Car-to-feature relationships
-- (See MIGRATION_features_to_separate_table.sql)
```

### Step 2: Run the Migration Script
Execute `MIGRATION_features_to_separate_table.sql` in your Supabase SQL editor:
- Creates `features_config` table with all 26 current features
- Creates `car_features` junction table
- Populates `features_config` with feature definitions (priority, multiplier)
- **Migrates existing data** from old feature columns to new tables
- Adds Ukrainian metadata fields to `car_data_local`
- Drops old feature columns

### Step 3: Verify Migration
```sql
-- Check feature config was created
SELECT COUNT(*) FROM features_config;  -- Should be 26

-- Check car features were migrated
SELECT COUNT(*) FROM car_features;  -- Should match your existing data

-- Check old columns are gone
SELECT * FROM car_data_local LIMIT 1;  -- Should not have feature_acc, feature_blind_spot, etc.
```

## 🔄 Feature State Cycle

Users can now cycle through **3 states** instead of 2:

1. **✓ (true)** - Feature is present
2. **? (null)** - Feature state unknown
3. **✗ (false)** - Feature is NOT present
4. Back to ✓

Cycle: true → null → false → true

## 🎨 Feature Display Based on Priority

### Present Feature (Always Green)
- State = true
- Color: `#E8F5E9` (light green)
- Icon: ✓

### Unknown Feature (Always Gray)
- State = null
- Color: `#FAFAFA` (light gray)
- Icon: ?

### Missing Feature (Color by Priority)
- State = false
- **Priority 0 (Low)**: White `#FFFFFF` - "Nice to have"
- **Priority 1 (Medium)**: Yellow `#FFF8E1` - "Normal feature"
- **Priority 2 (High)**: Red `#FFEBEE` - "Important feature"
- Icon: ✗

## ➕ Adding New Features (NO Code Changes!)

Before: Had to modify DB schema AND migrate data AND update code
Now: Just add one row!

```sql
INSERT INTO features_config
(key, category, name_uk, sort_order, priority, multiplier)
VALUES
('feature_sunroof', 'Comfort', 'Sunroof', 8, 0, 0.5),
('feature_adaptive_headlights', 'Technology', 'Adaptive Headlights', 5, 2, 1.5);
```

That's it! Features are immediately available in the UI.

## 🔧 Code Changes

### features-manager.js
- New method: `getFeatureConfig()` - Loads feature dictionary
- Updated: `initializeFeatures()` - Works with car_features table
- Updated: `toggleFeature()` - Now cycles through 3 states
- New: `toggleFeatureState()` - Helper for state cycling

### supabase-client.js
- New: `getFeatureConfig()` - Fetches feature dictionary
- New: `getCarFeatures(carId)` - Fetches car-specific features with config
- New: `saveCarFeaturesNew(carId, features)` - Bulk upsert to car_features
- New: `updateCarFeature(carId, featureKey, state)` - Update single feature

### ui-components.js
- Updated: `createFeaturesGrid()` - Shows 3 states: ✓, ?, ✗
- Added `.missing` CSS class for false state display

### content.css
- Added: `.ui-feature-btn.missing` - Styling for missing/false features

## 📊 Feature Config Defaults

| Feature | Category | Priority | Multiplier | Notes |
|---------|----------|----------|-----------|-------|
| ACC | Security | HIGH (2) | 1.5 | Important safety |
| Blind spot | Security | HIGH (2) | 1.5 | Important safety |
| Camera | Cameras & Parking | HIGH (2) | 1.5 | Important safety |
| Parking sensors | Cameras & Parking | HIGH (2) | 1.5 | Important safety |
| Lane assist | Security | HIGH (2) | 1.5 | Important safety |
| Rear traffic alert | Security | HIGH (2) | 1.5 | Important safety |
| Android Auto/CarPlay | Technology | MEDIUM (1) | 1.0 | Normal feature |
| Matrix headlights | Technology | MEDIUM (1) | 1.0 | Normal feature |
| Heated seats | Comfort | MEDIUM (1) | 1.0 | Normal feature |
| Keyless | Comfort | MEDIUM (1) | 1.0 | Normal feature |
| Digital cockpit | Comfort | MEDIUM (1) | 1.0 | Normal feature |
| *Others* | * | LOW(0) | 0.5 | Nice to have |

**You can customize these priorities and multipliers anytime!**

## 🆙 Customizing Feature Importance

Change a feature's priority and multiplier:

```sql
-- Make heated seats more important
UPDATE features_config
SET priority = 2, multiplier = 1.5
WHERE key = 'feature_heated_seats';

-- Make webasto less important
UPDATE features_config
SET priority = 0, multiplier = 0.3
WHERE key = 'feature_webasto';
```

## 🗂️ Database Size Impact

**Before**: 26 feature columns per row in `car_data_local`
**After**: Feature data in separate table

```
Before: car_data_local = ~100 columns (plus all feature columns)
After:  car_data_local = ~37 columns (much leaner)
        car_features = ~4 columns (normalized)
        features_config = ~7 columns (small, static)
```

Result: More efficient queries, easier to add features, no schema bloat.

## 🚀 Next Steps

1. Backup your current database
2. Run `MIGRATION_features_to_separate_table.sql`
3. Verify data integrity
4. Deploy updated code (with new features-manager.js, supabase-client.js, etc.)
5. Test thoroughly in your environment

## 📝 Ukrainian Metadata Fields Added

The main `car_data_local` table now includes:

| Field | Ukrainian | Description |
|-------|-----------|-------------|
| year_uk | Рік | Vehicle year |
| mileage_uk | Пробіг | Vehicle mileage/kilometers |
| address_uk | Адреса | Vehicle location/address |
| interior_uk | Салон | Interior type/trim |
| seat_type_uk | Тип сидінь | Seat material/type |
| climate_uk | Клімат | Climate control system type |
| owners_uk | Власників | Number of previous owners |

## ❓ FAQ

**Q: Will existing data be lost?**
A: No! The migration script preserves all existing feature data during the transformation.

**Q: Can I add a feature without migrations?**
A: Yes! Just INSERT into features_config. The UI will pick it up automatically.

**Q: Can I change feature priorities later?**
A: Yes! UPDATE features_config anytime. Changes take effect immediately.

**Q: What if I want multi-language support later?**
A: Easy! Just add `name_en`, `name_pl` columns to features_config and update the UI.

**Q: How do I calculate a rating from features?**
A: Use the multiplier field: Rating = (present_count × multiplier) / total_weight
