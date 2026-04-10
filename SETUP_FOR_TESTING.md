# Setup Guide - Enable Feature & Note Saving

## Quick Summary
Everything is built for **auto-save** - no save button needed:
- Click a **feature button** → auto-saves immediately
- Click a **sort rating** → auto-saves immediately  
- **Type a note** → auto-saves after 500ms
- Click **verified button** → auto-saves immediately

## Why It's Not Saving
Saving requires 3 things to be configured:

### 1. ❌ Supabase Project & Credentials
**Status**: Not set up yet  
**You need**:
- Supabase account (free tier at https://supabase.com)
- Project URL (looks like: `https://xxxxxxxxxxxx.supabase.co`)
- API Key (public key from Settings → API)

**To configure**:
1. Open extension settings/options page
2. Enter your Supabase credentials
3. The extension will save them to `chrome.storage.sync`

### 2. ❌ Database Table
**Status**: Not created yet  
**You need to create**: `car_data_local` table with the SQL below

Run this in Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS car_data_local (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  car_id TEXT UNIQUE NOT NULL,
  text TEXT,
  color TEXT DEFAULT '#FFEB3B',
  sort INT DEFAULT -1,
  
  -- Feature columns (26 boolean columns)
  feature_acc BOOLEAN,
  feature_blind_spot BOOLEAN,
  feature_lane_assist BOOLEAN,
  feature_signs BOOLEAN,
  feature_rear_traffic_alert BOOLEAN,
  feature_traffic_jam_assist BOOLEAN,
  feature_keyless BOOLEAN,
  feature_digital_cockpit BOOLEAN,
  feature_heated_seats BOOLEAN,
  feature_heated_windshield BOOLEAN,
  feature_heated_steering_wheel BOOLEAN,
  feature_massage_seats BOOLEAN,
  feature_memory_seats BOOLEAN,
  feature_android_auto_carplay BOOLEAN,
  feature_hud BOOLEAN,
  feature_dcc BOOLEAN,
  feature_matrix_headlights BOOLEAN,
  feature_camera BOOLEAN,
  feature_parking_sensors BOOLEAN,
  feature_360_camera BOOLEAN,
  feature_auto_parking BOOLEAN,
  feature_panoramic_roof BOOLEAN,
  feature_electric_tailgate BOOLEAN,
  feature_auto_tailgate BOOLEAN,
  feature_tow_hitch BOOLEAN,
  feature_webasto BOOLEAN,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS so extension can write without policies
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;

-- Optional: Create index for faster lookups
CREATE INDEX idx_car_data_local_car_id ON car_data_local(car_id);
```

### 3. ✅ Background Worker
**Status**: Already set up  
**File**: `src/background/background.js`  
**What it does**:
- Listens for messages from content scripts
- Handles `saveCarFeatures` and `getCarFeatures` requests
- Calls Supabase REST API to persist data

## How Saving Works (Technical Flow)

```
USER ACTION (click feature, type note, etc)
    ↓
Panel event handler triggers
    ↓
UnifiedPanel calls FeaturesManager method (toggleFeature, saveNote, etc)
    ↓
FeaturesManager sends message to background worker:
    chrome.runtime.sendMessage({ action: 'saveCarFeatures', carId, featuresData })
    ↓
Background worker (background.js) receives message
    ↓
Calls SupabaseClient to write to car_data_local table
    ↓
✅ Data saved in Supabase
```

## Debug Mode - Check If Saving Works

### Step 1: Set Up Supabase
```
1. Create free account at https://supabase.com
2. Create a new project
3. Go to Project Settings → API
4. Copy the Project URL and public Key (anon key)
```

### Step 2: Set Credentials in Extension
The extension needs to store credentials in `chrome.storage.sync`. 

**Option A - Manual (via background console)**:
```javascript
chrome.storage.sync.set({
  'supabaseUrl': 'https://your-project.supabase.co',
  'supabaseKey': 'your-anon-key'
});
```

**Option B - Via Options Page** (if we build one):
- Open `chrome-extension://YOUR_EXTENSION_ID/src/popup/options.html`
- Enter credentials
- Click Save

### Step 3: Create Database Table
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Paste the SQL from Section 2 above
4. Execute

### Step 4: Test Saving
1. Open a car detail page on mobile.de or otomoto.pl
2. Click on a feature button
3. Open browser console (F12) → Storage tab
4. Check if data appears in Supabase:
   - Go to Supabase Dashboard
   - Browse `car_data_local` table
   - Look for row with your car's ID

### Step 5: Watch Console Logs
When you click a feature, you should see:

```
[FeaturesManager] Parsing features from page content
✅ Features loaded: 26 features
[UnifiedPanel] Calling getNote...
📝 Updating panel content...
✅ Verified section updated
✅ Features section updated successfully, features count: 26
btn.onclick = async () => {
  [FeaturesManager] Toggling feature...
  [supabase-sync] Saving features to Supabase...
  ✅ Save successful
```

## Troubleshooting Saves

### Problem: "Getting TypeError: Cannot read property..."
**Cause**: Supabase credentials not set  
**Fix**: Run `chrome.storage.sync.set()` command above

### Problem: "Background worker not responding"
**Cause**: Service worker crashed or not loaded  
**Fix**: 
1. Reload extension (Chrome Extensions page → Reload)
2. Check background console (Extensions page → Service Worker)

### Problem: "Cannot insert - RLS policy"
**Cause**: Row Level Security blocking writes  
**Fix**: Run this in Supabase SQL:
```sql
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
```

### Problem: "relation 'car_data_local' does not exist"
**Cause**: Table not created  
**Fix**: Create table using SQL from Section 2 above

## Testing Checklist

- [ ] Supabase project created
- [ ] Credentials set in chrome.storage.sync
- [ ] car_data_local table exists in Supabase
- [ ] RLS is disabled on table
- [ ] Click feature button → data appears in Supabase within 1 second
- [ ] Type note → saves after 500ms
- [ ] Click sort rating → data saves immediately  
- [ ] Click verified button → data saves immediately
- [ ] Refresh page → all data persists from DB

## Next Steps

1. **Set up Supabase** (5 min)
2. **Create database table** (2 min)
3. **Configure credentials** (1 min)
4. **Test each interaction** (5 min)
5. **Watch console logs** to verify save messages

Once this is working, all saves happen in the background automatically!
