# Content Folder Analysis - Obsolete & Unused Files

**Analysis Date:** April 11, 2026
**Analysis Scope:** `src/content/` folder complete audit
**Status:** Multiple obsolete files identified for cleanup

---

## Executive Summary

The content folder contains **15 active JavaScript files** and **3 empty stub directories**. Analysis identified:

- **✅ 11 files actively used** - Primary implementation files
- **❌ 2 files unused/obsolete** - Can be safely deleted
- **⚠️ 1 file deprecated but kept as fallback** - Can be deleted with minor code refactoring
- **🗂️ 3 empty stub directories** - Can be removed

**Estimated safe cleanup: 4 files + 3 directories**

---

## File-by-File Analysis

### ✅ ACTIVE FILES (Keep)

#### Content Script Core (3 files)

| File | Purpose | References | Status |
|------|---------|-----------|--------|
| `content.js` | Main entry point, initializes router, adds note buttons to listings | Called on DOM load | **ACTIVE** |
| `router.js` | Platform detection and routing logic | Used by content.js | **ACTIVE** |
| `handlers.js` | Listing page handler - processes multiple listings | Used by site adapters | **ACTIVE** |

#### Feature Processing (4 files)

| File | Purpose | References | Status |
|------|---------|-----------|--------|
| `vehicle-extractor-simple.js` | Extracts vehicle data from mobile.de & otomoto.pl detail pages | Called from: features-manager, features-display, unified-panel | **ACTIVE** |
| `features-parser.js` | Parses extracted vehicle data for feature detection | Called from: features-manager, features-display, unified-panel | **ACTIVE** |
| `features-manager.js` | Feature initialization, persistence, and state management | Called from: content.js, unified-panel | **ACTIVE** |
| `supabase-client.js` | Database API client for Supabase interactions | Called from: features-manager, everywhere | **ACTIVE** |

#### UI Components (4 files)

| File | Purpose | References | Status |
|------|---------|-----------|--------|
| `ui-components.js` | Shared UI utilities (color picker, textareas, etc.) | Used by: unified-panel, features-display | **ACTIVE** |
| `unified-panel.js` | **Primary detail page panel** - combines notes, features, ratings | Called from: sites/mobile-de.js, sites/otomoto.js | **ACTIVE PRIMARY** |
| `extraction-ui.js` | Export/copy vehicle data overlay on detail pages | Used by: unified-panel | **ACTIVE** |
| `utils.js` | Utility functions (luminance calculation, time formatting) | Used throughout | **ACTIVE** |

#### Site Adapters (2 files)

| File | Purpose | References | Status |
|------|---------|-----------|--------|
| `sites/mobile-de.js` | Mobile.de specific adapter (ID extraction, listing handling) | Called by: router.js via site detection | **ACTIVE** |
| `sites/otomoto.js` | Otomoto.pl specific adapter (ID extraction, listing handling) | Called by: router.js via site detection | **ACTIVE** |

---

### ❌ OBSOLETE / UNUSED FILES (Delete)

#### 1. **`features-display.js`** - OLD UI COMPONENT (OBSOLETE)

**Status:** Completely unused
**Why it exists:** Old implementation of features display panel that was replaced

**Detail:**
- Defines `window.FeaturesDisplay` with method `showFeaturesPanel(carId, data)`
- **This method is NEVER called anywhere in the codebase**
- **Replaced by:** `CarDetailPanel` in `unified-panel.js` which has the active `showPanel(carId, data)` method
- Called from: **NOTHING** (0 references)
- Used by site adapters: **No** - both mobile-de.js and otomoto.js call `window.CarDetailPanel.showPanel()` instead

**Evidence:**
```
grep "FeaturesDisplay" - only 1 match: the definition itself (line 3)
grep "showFeaturesPanel" - only 1 match: the definition itself
grep "CarDetailPanel.showPanel" - 4 matches: from mobile-de.js, otomoto.js (active)
```

**Recommendation:** **DELETE** - No active code depends on this.

---

#### 2. **`feature-column-mapper.js`** - OLD ARCHITECTURE (MOSTLY OBSOLETE)

**Status:** Referenced but inconsistent with new architecture
**Why it exists:** Maps feature display names to database column names from old architecture

**Background:**
- Session notes document major refactor (Session 3) moving from 26 feature columns to:
  - `features_config` table (master feature dictionary)
  - `car_features` table (junction table for feature states)
- Old mapper converted feature names to column names like `'ACC'` → `'feature_acc'`
- New architecture loads features from config, not from hard-coded mapping

**Detail:**
```
References in codebase:
- features-manager.js (lines 88-89): Used as FALLBACK if feature not in config
- features-display.js (lines 377-378, 445-446): Used for feature lookup
- unified-panel.js (line 619): Used for feature name conversion
```

**Problem:**
- Features should come from `features_config` table, not from this static mapping
- Fallback mechanism suggests incomplete migration from old to new architecture
- The mapping function `featureToColumnName()` duplicates logic that should only exist in database

**Recommendation:** **DELETE with minor refactoring**
- Remove fallback references in:
  - `features-manager.js` (lines 86-90)
  - `features-display.js` (lines 377-378, 445-446)
  - `unified-panel.js` (line 619)
- Ensure feature names are ALWAYS looked up from `features_config` table
- Removes technical debt from incomplete migration

---

### ⚠️ DEPRECATED BUT HARMLESS FILES (Optional Delete)

None identified. All kept files serve active purposes, even if they appear redundant UI code for two different implementations, `unified-panel.js` is clearly the primary active one.

---

### 🗂️ EMPTY STUB DIRECTORIES (Delete)

| Directory | Purpose | Contents | Status |
|-----------|---------|----------|--------|
| `car-data-panel/` | Stub for data panel module | Empty | **UNUSED** |
| `car-detail/` | Stub for detail page module | Empty | **UNUSED** |
| `car-listing/` | Stub for listing page module | Empty | **UNUSED** |

**Note:** These were clearly planned as future modularization but never implemented. Code instead went into `unified-panel.js` and site adapters.

---

## Manifest.json Impact

The manifest lists all files in `content_scripts`:

```json
"js": [
  "src/content/utils.js",                          ✅ KEEP
  "src/content/ui-components.js",                  ✅ KEEP
  "src/content/vehicle-extractor-simple.js",       ✅ KEEP
  "src/content/features-parser.js",                ✅ KEEP
  "src/content/feature-column-mapper.js",          ❌ DELETE*
  "src/content/supabase-client.js",                ✅ KEEP
  "src/content/features-manager.js",               ✅ KEEP
  "src/content/unified-panel.js",                  ✅ KEEP
  "src/content/extraction-ui.js",                  ✅ KEEP
  "src/content/features-display.js",               ❌ DELETE
  "src/content/router.js",                         ✅ KEEP
  "src/content/handlers.js",                       ✅ KEEP
  "src/content/sites/mobile-de.js",                ✅ KEEP
  "src/content/sites/otomoto.js",                  ✅ KEEP
  "src/content/content.js"                         ✅ KEEP
]
```

**After cleanup, manifest should have:** 13 files (remove feature-column-mapper.js and features-display.js)

---

## Cleanup Recommendations

### Priority 1: DELETE (No Dependencies, Zero Impact)

1. **`features-display.js`** - Completely unused UI component
   - Delete file
   - Remove from manifest.json
   - Impact: **ZERO** - nothing calls this

### Priority 2: DELETE + REFACTOR (Removes Technical Debt)

1. **`feature-column-mapper.js`** - Obsolete mapping from old architecture
   - Delete file
   - Update 4 references to remove fallback:
     - `features-manager.js` line 88-90
     - `features-display.js` line 377-378, 445-446 (if not deleted in Priority 1)
     - `unified-panel.js` line 619
   - Ensures features ONLY load from `features_config` table
   - Impact: **LOW** - removes fallback mechanism that shouldn't be needed

### Priority 3: DELETE (Empty Stubs)

1. **`car-data-panel/`** - Empty stub directory
2. **`car-detail/`** - Empty stub directory
3. **`car-listing/`** - Empty stub directory
   - Delete directories
   - Impact: **ZERO** - nothing references these directories

---

## Implementation Steps

### Step 1: Remove Completely Unused Files
```
1. Delete: src/content/features-display.js
2. Update manifest.json: Remove features-display.js entry
3. Test: Extension still loads and works
```

### Step 2: Remove Obsolete Mapping + Fix References
```
1. In features-manager.js (lines 86-90):
   Replace the FeatureColumnMapper fallback with proper error handling

2. In unified-panel.js (line 619):
   Remove optional chaining to FeatureColumnMapper

3. Delete: src/content/feature-column-mapper.js

4. Update manifest.json: Remove feature-column-mapper.js entry

5. Test: Features still load from config table correctly
```

### Step 3: Clean Up Empty Directories
```
1. Delete empty directories:
   - src/content/car-data-panel/
   - src/content/car-detail/
   - src/content/car-listing/

2. Test: No broken imports (should be none)
```

---

## Verification Checklist

After cleanup:

- [ ] Extension loads without errors
- [ ] Content scripts inject properly on mobile.de
- [ ] Content scripts inject properly on otomoto.pl
- [ ] Features parse and display correctly
- [ ] Features save to database correctly
- [ ] Features load from database correctly
- [ ] No console errors or undefined references
- [ ] Manifest.json has 13 files (down from 15)

---

## Notes

- **vehicle-extractor-simple.js** is named "simple" and is the ACTIVE extractor. There are no other extractor versions in the codebase.
- **unified-panel.js** is named as unified because it combines:
  - Notes (text + color + rating)
  - Features (parsed or from DB)
  - Metadata (seat type, owners, etc.)
  - Export functionality
- All site-specific code is isolated in `sites/` folder with clean adapters for each platform
- No `v1` or `v2` versioning or duplicates found in active code

