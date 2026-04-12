# Make/Model Auto-Save Debugging Guide

## Issue
Make and model are not being saved to the database, even though seat_type and other metadata are being saved.

## Root Cause Investigation

### Data Extraction Pipeline
```
Page → extractCarData() → MetadataParser.extractMetadata() → NotesEditor auto-populate → updateMetadataField() → Database
```

### Verification Steps

#### Step 1: Check if Extraction Works
**In browser console (when on car listing):**
```javascript
const data = window.extractCarData();
console.log('Extracted data:', data);
console.log('Make:', data.basics.make);
console.log('Model:', data.basics.model);
console.log('Price:', data.price.amount);
console.log('Specs:', data.specs);
```

**Expected output:**
```
Extracted data: {
  basics: { make: "Toyota", model: "Corolla", name: "Toyota Corolla 2019...", ... },
  specs: { Year: "2019", Mileage: "150000 km", ... },
  price: { amount: "25000 PLN", ... },
  ...
}
```

**If make/model are null:**
- Check if vehicle title contains make/model (e.g., "Toyota - Corolla")
- Verify page structure matches expected selectors

---

#### Step 2: Check Metadata Parser
**In browser console:**
```javascript
const extracted =window.extractCarData();
const parsed = window.MetadataParser.extractMetadata(extracted);
console.log('Parsed metadata:', parsed);
```

**Expected output:**
```
Parsed metadata: {
  make: "Toyota",
  model: "Corolla",
  price: "25000",
  price_eur: "5875",
  mileage: "150000 km",
  year: "2019"
}
```

**If values are null:**
- Extraction failed in Step 1
- Parser didn't find matching fields

---

#### Step 3: Check Auto-Save When Modal Opens
**Steps:**
1. Click to open note modal
2. Open browser console (F12)
3. Look for these logs:

**Expected console output:**
```
[NotesEditor] Auto-populated metadata from extracted data: {
  make: "Toyota",
  model: "Corolla",
  price: "25000",
  price_eur: "5875",
  mileage: "150000 km",
  year: "2019"
}
[NotesEditor] Saving auto-extracted metadata...
[NotesEditor] ✅ Auto-saved make = Toyota
[NotesEditor] ✅ Auto-saved model = Corolla
[NotesEditor] ✅ Auto-saved price = 25000
[NotesEditor] ✅ Auto-saved price_eur = 5875
[NotesEditor] ✅ Auto-saved mileage = 150000 km
[NotesEditor] ✅ Auto-saved year = 2019
[NotesEditor] ✅ All auto-extracted metadata saved
Auto-extracted data saved ✓ (green notification)
```

**If you don't see these logs:**
- Auto-population didn't run
- Extraction returned null values
- Supabase client not ready

---

#### Step 4: Check Supabase updateMetadataField Logs
**Expected console output:**
```
[NoteCallbacks.updateMetadataField] Updating make to Toyota for ID6HZRuA
[SupabaseApi.updateMetadataField] PATCH make= Toyota
[SupabaseApi.updateMetadataField] ✅ Updated make
```

**If you don't see these:**
- Check network tab (F12 → Network)
- Should see PATCH request to `/rest/v1/car_data_local?car_id=eq.ID6HZRuA`
- Check if request body includes `{ "make": "Toyota", "updated_at": "..." }`
- Check response status (should be 200 or 204)

---

#### Step 5: Verify in Database
**After auto-save completes:**
1. Open Supabase console
2. Navigate to `car_data_local` table
3. Find car with car_id = `ID6HZRuA`
4. Check if `make` column contains value

**If still null:**
- SQL constraint preventing save
- Permission issue on database
- Supabase API key invalid

---

## Diagnostic Console Commands

Add these to test each component:

```javascript
// Test 1: Verify extraction
console.log('=== EXTRACTION TEST ===');
const extracted = window.extractCarData();
console.log('make:', extracted.basics.make);
console.log('model:', extracted.basics.model);
console.log('Full extraction:', JSON.stringify(extracted, null, 2));

// Test 2: Verify parsing
console.log('=== PARSING TEST ===');
const parsed = window.MetadataParser.extractMetadata(extracted);
console.log('Parsed result:', parsed);

// Test 3: Manual save test
console.log('=== MANUAL SAVE TEST ===');
const testCarId = 'ID6HZRuA';
window.NoteCallbacks.updateMetadataField(testCarId, 'make', 'TestMake')
  .then(result => console.log('Save result:', result))
  .catch(err => console.error('Save error:', err));

// Test 4: Check Supabase readiness
console.log('=== SUPABASE STATUS ===');
window.SupabaseClient.isReady()
  .then(ready => console.log('Supabase ready:', ready))
  .catch(err => console.error('Supabase error:', err));
```

---

## Common Issues & Fixes

### Issue 1: make/model null after extraction
**Cause:** Selectors don't match page structure

**Fix:** Use title fallback
```javascript
// Already implemented in vehicle-extractor-simple.js
// Extracts from title like "Toyota - Corolla - 2019"
```

**Verify:**
```javascript
const data = window.extractCarData();
console.log('Title:', data.basics.name);
console.log('Make:', data.basics.make);
console.log('Model:', data.basics.model);
```

---

### Issue 2: Auto-save logs don't appear
**Cause:** Modal opened without article context

**Check:**
- Are you clicking a car listing to open modal? ✓ (article passed)
- Or opening from panel/detail page? ✗ (no article, no extraction)

**Fix:** Pass article or existing note data to modal

---

### Issue 3: Save network request fails
**Cause:** Database permissions or API key issue

**Check Network Tab (F12 → Network):**
1. Filter for requests containing "car_data_local"
2. Find PATCH request
3. Check "Response" tab for error message
4. Check "Headers" → confirm API key is sent

**Example error:**
```
401 Unauthorized
- API key invalid or expired
```

---

### Issue 4: Save succeeds but data still null in DB
**Cause:** Race condition - data reloaded before save completes

**Check:**
- All auto-save console logs show ✅?
- Check if modal closed immediately (before save completed)?
- Auto-saves are non-blocking - should complete in background

**Fix:** Wait 2-3 seconds before closing modal

---

## Enhanced Testing Procedure

### Full Workflow Test
1. **Open listing page** - Check browser console for warnings
2. **Extract check:**
   ```javascript
   const e = window.extractCarData();
   console.log('Make:', e.basics.make, 'Model:', e.basics.model);
   ```
3. **Click car to open modal** - Check console for auto-save logs
4. **Wait 3 seconds** - Allow auto-saves to complete
5. **Close modal** - Check for success notification
6. **Refresh page** - Check if values persisted
7. **Reopen modal** - Verify values display from database

---

## Monitoring Dashboard

Create this query in browser console to monitor save operations:

```javascript
window.MetadataSaveMonitor = {
    saves: [],
    logSave(fieldName, value, status, error) {
        this.saves.push({
            time: new Date().toLocaleTimeString(),
            field: fieldName,
            value: value,
            status: status,  // 'pending', 'success', 'error'
            error: error
        });
        console.table(this.saves);
    }
};

// Monkey-patch to track saves
const originalUpdateField = window.NoteCallbacks.updateMetadataField;
window.NoteCallbacks.updateMetadataField = async function(carId, fieldName, fieldValue) {
    window.MetadataSaveMonitor.logSave(fieldName, fieldValue, 'pending');
    try {
        const result = await originalUpdateField.call(this, carId, fieldName, fieldValue);
        window.MetadataSaveMonitor.logSave(fieldName, fieldValue, result.success ? 'success' : 'error', result.error);
        return result;
    } catch (err) {
        window.MetadataSaveMonitor.logSave(fieldName, fieldValue, 'error', err.message);
        throw err;
    }
};

// Check saves:
window.MetadataSaveMonitor.saves
```

---

## Next Steps

1. **Run diagnostic tests** (copy commands from "Diagnostic Console Commands" section)
2. **Screenshot console output** - Share with debug report
3. **Check network requests** - F12 → Network tab, filter "car_data_local"
4. **Verify database** - Supabase console → check actual values
5. **Report findings** - Which step fails?

---

## Files That Handle Make/Model

| Component | File | Purpose |
|-----------|------|---------|
| Extraction | `vehicle-extractor-simple.js` | Extract make/model from page |
| Parsing | `metadata-parser.js` | Parse to standardized fields |
| Auto-save | `notes-editor.js:91-143` | Auto-save on modal open |
| Database | `supabase-client.js:812+` | `updateMetadataField()` saves to DB |
| Callbacks | `note-callbacks.js:78` | `updateMetadataField()` wrapper |

---

## Log Output Examples

### ✅ Success Flow
```
[extractCarData] Extracted from: otomoto.pl
[extractOtomotoCarData] Found make: Toyota
[extractOtomotoCarData] Found model: Corolla
[MetadataParser] Extracted metadata: {make: "Toyota", model: "Corolla", price: "25000", year: "2019", mileage: "150000"}
[NotesEditor] Auto-populated metadata: {make: "Toyota", model: "Corolla", ...}
[NotesEditor] Saving auto-extracted metadata...
[NoteCallbacks.updateMetadataField] Updating make to Toyota for ID6HZRuA
[SupabaseApi.updateMetadataField] PATCH make= Toyota
[SupabaseApi.updateMetadataField] ✅ Updated make
✅ Auto-extracted data saved (notification)
```

### ❌ Failure: No extraction
```
[extractCarData] Extracted from: otomoto.pl
[extractOtomotoCarData] Could not find make
[extractOtomotoCarData] Falling back to title: "Toyota - Corolla - 2019"
[NotesEditor] Auto-populated metadata: {make: "Toyota", model: "Corolla", ...}
[NotesEditor] Saving auto-extracted metadata...
```

### ❌ Failure: Save fails
```
[NoteCallbacks.updateMetadataField] Updating make to Toyota for ID6HZRuA
[SupabaseApi.updateMetadataField] PATCH make= Toyota
❌ Error in auto-save: 401 Unauthorized
```

---

Run the tests and share the console output to pinpoint the exact failure point.
