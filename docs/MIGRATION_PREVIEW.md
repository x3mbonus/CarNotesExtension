# Migration Preview: Your Data

Based on the sample data you provided, here's what will happen during migration:

## Row 1: "3-СОРТ. не видно фаркопа..."
```
BEFORE (old car_notes):
├─ car_id: 431175643
├─ text: "3-СОРТ. не видно фаркопа, тряпка, пробіг 152. 230 км від Bottrop..."
├─ color: #ff9800 (orange)
└─ created_at: 2026-03-31 18:18:38

AFTER (new schema):
car_data_local:
├─ car_id: 431175643
├─ text: "не видно фаркопа, тряпка, пробіг 152. 230 км від Bottrop..." ✅ (sort prefix removed)
├─ color: #ff9800 (preserved)
├─ sort: 3 ✅ (parsed from "3-СОРТ")
├─ features_source: 'imported'
├─ confirmed: FALSE
└─ created_at: 2026-03-31 18:18:38

car_features_local (extracted from text):
├─ ACC → TRUE ✅ (mentioned: "ACC, камера")
├─ camera → TRUE ✅ (mentioned: "камера")
├─ blind_spot → FALSE ✅ (mentioned in "Немає: blind spot")
├─ massage_seats → TRUE ✅ (mentioned: "масаж")
├─ digital_cockpit → FALSE ✅ (mentioned in "Немає: digital cockpit")
├─ electric_trunk → FALSE ✅ (mentioned in absence)
└─ tow_hitch → FALSE ✅ (mentioned in absence)
```

## Row 2: "проста, тканина, фаркоп..."
```
BEFORE (old car_notes):
├─ car_id: 449792293
├─ text: "проста, тканина, фаркоп, бита?"
├─ color: #607D8B (blue-gray)
└─ created_at: 2026-04-07 15:14:59

AFTER (new schema):
car_data_local:
├─ car_id: 449792293
├─ text: "проста, тканина, фаркоп, бита?" ✅ (no sort prefix to remove)
├─ color: #607D8B (preserved)
├─ sort: NULL ✅ (no sort prefix detected)
├─ features_source: 'imported'
├─ confirmed: FALSE
└─ created_at: 2026-04-07 15:14:59

car_features_local (extracted from text):
├─ tow_hitch → TRUE ✅ (mentioned: "фаркоп")
├─ Other features → NULL (not mentioned)
```

## Row 3: "1-СОРТ 20 км Brühl Є: ACC, blind spot..."
```
BEFORE (old car_notes):
├─ car_id: 450232956
├─ text: "1-СОРТ 20 км Brühl\n\nЄ: ACC, blind spot, [service history, winter package]\nНемає: electric seat regulation, massage..."
├─ color: #00bcd4 (cyan)
└─ created_at: 2026-03-31 17:51:36

AFTER (new schema):
car_data_local:
├─ car_id: 450232956
├─ text: "20 км Brühl\n\nЄ: ACC, blind spot, [service history...]\nНемає: electric seat regulation..." ✅ (sort prefix removed)
├─ color: #00bcd4 (preserved)
├─ sort: 1 ✅ (parsed from "1-СОРТ")
├─ features_source: 'imported'
├─ confirmed: FALSE
└─ created_at: 2026-03-31 17:51:36

car_features_local (extracted from text):
├─ ACC → TRUE ✅ (in "Є:" section)
├─ blind_spot → TRUE ✅ (in "Є:" section)
├─ heated_seats → TRUE ✅ (winter package implied)
├─ digital_cockpit → FALSE ✅ (mentioned in "Немає")
├─ massage_seats → FALSE ✅ (mentioned in "Немає")
└─ Other features → NULL or parsed based on text
```

## Summary of Changes

| Field | Before | After | Status |
|-------|--------|-------|--------|
| **text** | Includes sort prefix | Sort prefix removed | ✅ Cleaner |
| **color** | Preserved | Preserved | ✅ Same |
| **sort** | Not stored | Parsed from text | ✅ New field |
| **features** | Mixed in text | Separate records | ✅ Organized |
| **confirmed** | Not tracked | FALSE (user can verify) | ✅ New |
| **features_source** | Not tracked | 'imported' | ✅ New |

## Expected Counts

After migration:
```
✓ 3 cars migrated to car_data_local
✓ ~20-30 feature records created in car_features_local
  (varies based on feature mentions in text)
✓ All colors preserved
✓ All timestamps preserved
✓ All sort values extracted
```

## Manual Verification Checklist

- [ ] Open app, view all 3 cars in listing
- [ ] Check colors match (orange, gray, cyan)
- [ ] Check sort values: 3, null, 1
- [ ] Check features tab shows reasonable guesses
- [ ] For row 3: verify ACC and blind spot marked TRUE
- [ ] For row 1: verify digital cockpit marked FALSE
- [ ] Open detail panel, see refresh button works
- [ ] Try editing a feature to confirm save works

## Next Steps

1. Run migration on `_local` tables first
2. Test in app with this preview in mind
3. If everything looks good, migrate `_prod` tables
4. Update `features_source` to 'manual' once confirmed
5. Keep old `car_notes` as backup for 1-2 weeks

---

**File:** `MIGRATION_from_old_car_notes.sql`
**Guide:** `MIGRATION_from_old_car_notes_README.md`
