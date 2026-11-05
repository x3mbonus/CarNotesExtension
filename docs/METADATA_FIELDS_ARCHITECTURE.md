# Metadata Fields Architecture

## System Overview

The CarNotes extension manages 4 metadata fields for each car:
- **seat_type**: Type of seat material (Leather, Cloth, Suede, etc.)
- **climate**: Climate control level (2-zone, 3-zone, Auto, None)
- **owners**: Number of previous owners (1, 2, 3, 4+)
- **tow_hitch_type**: Type of tow hitch (Fixed, Swiveling, Detachable, None)

These fields are stored in the `car_data` table and displayed in the metadata section of the notes editor.

## Database Schema

```sql
TABLE car_data {
  car_id TEXT PRIMARY KEY
  text TEXT                    -- Note text
  color TEXT                   -- Rating color
  seat_type TEXT              -- Metadata
  climate TEXT                -- Metadata
  owners TEXT                 -- Metadata
  tow_hitch_type TEXT         -- Metadata
  ...other fields...
}
```

## Data Flow Architecture

### 1. Loading Metadata

```
CarDetailPanel.showPanel(carId)
  └─> FeaturesManager.initializeFeatures(carId)
       └─> getCarDataMetadata(carId)  [uses cache]
           └─> SupabaseApi.getCarDataMetadataOnly(carId)
               ├─ Query: SELECT car_id, seat_type, climate, owners, tow_hitch_type FROM car_data WHERE car_id = ?
               └─ Returns: { seat_type, climate, owners, tow_hitch_type, ... }
       └─ Cache result in carDataCache[carId]
  └─> Store in CarDetailPanel.current*
       ├─ currentSeatType
       ├─ currentClimate
       ├─ currentOwners
       ├─ currentTowHitchType
  └─> Pass to NotesEditor.create()
       └─> UIComponents.createMetadataSection()
           └─ Render 4 select dropdowns with values
```

### 2. Saving Metadata

```
UIComponents.createMetadataSection (select change event)
  └─> onMetadataChange callback
       └─> NoteCallbacks.updateMetadataField(carId, fieldName, fieldValue)
           └─> SupabaseApi.updateMetadataField(carId, fieldName, fieldValue)
               ├─ Query: PATCH car_data SET {fieldName} = ? WHERE car_id = ?
               └─ Returns: { success: true }
```

### 3. Full Refresh (when all data needed)

```
CarDetailPanel.refresh()
  └─> SupabaseApi.getCarData(carId)
       ├─ Fetches car data WITH features
       └─ Returns: { seat_type, climate, owners, tow_hitch_type, features, ... }
  └─> Store all fields in CarDetailPanel.current*
```

## Code Locations

### Frontend Components

| Component | File | Responsibility |
|-----------|------|-----------------|
| **CarDetailPanel** | `src/content/components/unified-panel/unified-panel.js` | Stores current metadata values, manages panel display |
| **NotesEditor** | `src/content/components/common/notes-editor.js` | Receives metadata, passes to UIComponents |
| **UIComponents** | `src/content/components/common/ui-components.js` | Renders metadata dropdowns with proper coloring |
| **FeaturesManager** | `src/content/services/features-manager.js` | Loads metadata + features, manages cache |

### Backend/API

| Method | File | Purpose |
|--------|------|---------|
| `getCarData()` | `supabase-client.js` | Load all car data (with features) - used by refresh button |
| `getCarDataMetadataOnly()` | `supabase-client.js` | Load only metadata (no features) - lighter weight |
| `getDataByIds()` | `supabase-client.js` | Batch load multiple cars' data |
| `updateMetadataField()` | `supabase-client.js` | Update single metadata field |
| `saveCarNote()` | `supabase-client.js` | Save/insert complete car data |

### Callbacks

| Function | File | Triggered By |
|----------|------|--------------|
| `updateMetadataField()` | `note-callbacks.js` | Metadata dropdown change |

## Metadata Display Values

### Seat Type Options
```
['Не вказано', 'Alcantara', 'Leather', 'Part Leather', 'Cloth', 'Fabric', 'Suede']
```

### Climate Options
```
['Не вказано', '-', '2', '3', 'Auto']
```

### Owners Options
```
['Не вказано', '1', '2', '3', '4+']
```

### Tow Hitch Type Options
```
['Не вказано', 'No', 'Swiveling', 'Detachable', 'Fixed']
```

## Color Coding Rules

```javascript
// Seat Type
- Alcantara/Leather → Green (#E8F5E9) ✓ Good
- Cloth/Fabric → Red (#FFEBEE) ✗ Bad
- Others → Yellow (#FFF9C4) ⊘ Neutral

// Owners
- '1' → Green (#E8F5E9) ✓ Good
- 2+ → Red (#FFEBEE) ✗ Many owners

// Tow Hitch
- Swiveling → Dark Green (#C8E6C9) ✓✓ Best
- No → Red (#FFEBEE) ✗ Bad
- Others → Yellow (#FFF9C4) ⊘ Acceptable

// Climate
- No coloring (neutral)
```

## Caching Strategy

### carDataCache (FeaturesManager)
- **Purpose**: Prevent duplicate API calls for same car
- **Lifetime**: Entire page session
- **Cleared by**: Page reload or manual refresh
- **Keys**: carId → metadata object

### carFeaturesCache (FeaturesManager)
- **Purpose**: Cache feature data with metadata
- **Format**: { features: {...}, confirmed: bool, ... }
- **Contains**: Metadata loaded along with features

## Performance Considerations

### When metadata is loaded:
1. **Initial load**: `getCarDataMetadataOnly()` - lightweight, metadata only
2. **Refresh button**: `getCarData()` - full data including features
3. **Subsequent views**: Uses cache - no API call

### Query Optimization:
- `getCarDataMetadataOnly()` returns only needed fields
- `getDataByIds()` batch loads multiple records at once
- Both cache aggressively to minimize DB queries

## Error Handling

### Failed Metadata Load:
```javascript
// In showPanel():
try {
    const noteData = await getCarDataMetadataOnly(carId);
    if (!noteData) {
        // Show fallback values (empty strings)
        currentSeatType = '';
        currentClimate = '';
    }
} catch (error) {
    console.error('Failed to load metadata:', error);
    // Continue with empty values
}
```

### Failed Metadata Save:
```javascript
// updateMetadataField returns { success: false, error: '...' }
// Currently logged but no user feedback
// Should be improved with UI notification
```

## Future Improvements

1. **Batch Save**: Save multiple metadata fields in one request
2. **Validation**: Validate metadata values before saving
3. **Undo/Redo**: Track changes with ability to revert
4. **Autocomplete**: Suggest metadata values based on price/features
5. **History**: Track metadata changes over time
6. **Error UI**: Show user-friendly error messages on save failure

## Testing Strategy

See `TEST_METADATA_FIELDS.md` for comprehensive testing guide.

### Key Test Cases:
1. Load car with metadata → verify all fields display
2. Change metadata field → verify save to DB
3. Reload page → verify metadata persists
4. Export car data → verify metadata included
5. Batch load multiple cars → verify metadata for all
