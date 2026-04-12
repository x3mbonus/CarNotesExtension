# Metadata Fields Testing Guide

## Overview
This guide verifies that all metadata fields (seat_type, climate, owners, tow_hitch_type) are properly loaded, displayed, and saved.

## Fixed Issues
1. ✅ `tow_hitch_type` was missing from the following methods:
   - `getCarData()`
   - `getCarDataMetadataOnly()`
   - `getDataByIds()`
   - Now all three methods properly return this field

## Testing Checklist

### 1. Loading Metadata from Database
- [ ] Open car detail panel
- [ ] Check console logs (look for `[CarDetailPanel] getCarDataMetadata returned:`)
- [ ] Verify metadata fields are logged with their values

**Expected Console Output:**
```
[CarDetailPanel] getCarDataMetadata returned: {
  text: "...",
  color: "...",
  seat_type: "Leather",  // Should be populated if saved
  climate: "Auto",
  owners: "1",
  tow_hitch_type: "Detachable"
  ...
}
```

### 2. Displaying Metadata in UI
- [ ] Open car note editor (modal or panel)
- [ ] Locate metadata section with 4 dropdown fields:
  - Тип сидінь (Seat Type)
  - Клімат (Climate)
  - Власників (Owners)
  - Фаркоп тип (Tow Hitch Type)
- [ ] Verify dropdowns are populated with correct values

**Expected Behavior:**
- Select dropdowns show current values from database
- Different metadata values have different background colors
- "Не вказано" (Not specified) is default option

### 3. Color Coding
Verify background colors based on field values:

**Seat Type:**
- Alcantara/Leather → Green (good)
- Cloth/Fabric → Red (bad/negative)
- Others → Yellow (neutral)

**Owners:**
- 1 → Green (good)
- 2+ → Red (bad/negative)

**Tow Hitch:**
- Swiveling → Dark Green (best)
- No → Red (bad)
- Other types → Yellow (acceptable)

**Climate:**
- No special coloring

### 4. Saving Metadata Changes
- [ ] Change a metadata field value (e.g., Seat Type to "Leather")
- [ ] Check console for: `[NoteCallbacks.updateMetadataField] Updating`
- [ ] Verify console shows: `[SupabaseApi.updateMetadataField] ✅ Updated <fieldName>`

**Expected Log:**
```
[NoteCallbacks.updateMetadataField] Updating seat_type to Leather for <carId>
[SupabaseApi.updateMetadataField] PATCH seat_type= Leather
[SupabaseApi.updateMetadataField] ✅ Updated seat_type
```

### 5. Persistence After Reload
- [ ] Save metadata changes
- [ ] Reload the page
- [ ] Open the car detail panel again
- [ ] Verify metadata fields show the previously saved values

### 6. Database Query Verification
Run these queries to verify data is saved:

```sql
-- Check specific car's metadata
SELECT car_id, seat_type, climate, owners, tow_hitch_type, updated_at
FROM car_data
WHERE car_id = '<your_car_id>'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Result:**
- All four metadata fields should show values (not NULL)
- updated_at should match the time you made changes

### 7. Refresh Button Test
- [ ] Save metadata changes
- [ ] Click refresh button (🔄) in panel header
- [ ] Verify metadata reloads from database
- [ ] Check console: `[CarDetailPanel] Data refreshed`

### 8. Export Test
- [ ] Fill in metadata fields
- [ ] Export as JSON/Text
- [ ] Verify metadata fields are included in export

**Expected in JSON Export:**
```json
{
  "seat_type": "Leather",
  "climate": "Auto",
  "owners": "1",
  "tow_hitch_type": "Detachable",
  ...
}
```

## Debugging Commands

### Check if FeaturesManager is properly initialized:
```javascript
console.log(window.FeaturesManager)
console.log(window.FeaturesManager?.carDataCache)
```

### Force reload metadata:
```javascript
await window.FeaturesManager?.clearCache?.();
await window.CarDetailPanel?.showPanel?.(carId);
```

### Check database directly:
```javascript
const data = await window.SupabaseApi?.getCarDataMetadataOnly?.('your-car-id');
console.log(data);
```

### Check metadata cache:
```javascript
console.log(window.CarDetailPanel.currentSeatType);
console.log(window.CarDetailPanel.currentClimate);
console.log(window.CarDetailPanel.currentOwners);
console.log(window.CarDetailPanel.currentTowHitchType);
```

## Success Criteria

✅ All metadata fields display in the UI
✅ Metadata values persist after page reload
✅ Metadata changes are saved to database
✅ Console logs show proper data flow
✅ Export includes all metadata fields
✅ Color coding works correctly
✅ All 4 dropdown options are selectable

## Known Limitations

- Metadata fields only load when opening car detail panel
- Changes are saved individually via `updateMetadataField`
- No batch save for multiple metadata changes
- Metadata requires car data record to exist in database (uses INSERT/UPDATE pattern)
