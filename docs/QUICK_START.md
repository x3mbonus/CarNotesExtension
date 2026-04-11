# 🎯 Quick Start - Enable Auto-Saving

## What's Working ✅
- ✅ Panel UI with all 5 sections
- ✅ Auto-save architecture (no save button needed!)
- ✅ Background worker ready to save

## What You Need To Do (15 minutes)

### Step 1️⃣: Get Supabase Credentials (5 min)

1. Go to **https://supabase.com**
2. Sign up (free account is fine)
3. Create a new project
4. Once created, click **Settings** (gear icon)
5. Go to **API** section
6. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (under "PROJECT API KEYS")

### Step 2️⃣: Enter Credentials in Extension (5 min)

**Option A - Via UI (Recommended)**
```
1. Click extension icon → "Car Notes Settings" option
2. Paste Project URL + API Key
3. Click "✅ Save & Test"
4. Should show "✅ Connected to Supabase"
```

**Option B - Via Console**
```javascript
// Open browser console (F12) and paste this:
chrome.storage.sync.set({
  'supabaseUrl': 'https://your-xxxxx.supabase.co',
  'supabaseKey': 'your-anon-key-here'
});
```

### Step 3️⃣: Create Database Table (5 min)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS car_data_local (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  car_id TEXT UNIQUE NOT NULL,
  text TEXT,
  color TEXT DEFAULT '#FFEB3B',
  sort INT DEFAULT -1,
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

ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_car_data_local_car_id ON car_data_local(car_id);
```

4. Click **Run** or `Ctrl+Enter`
5. Should show: `Success. No rows returned`

### Done! 🎉

Now go to any car detail page on mobile.de or otomoto.pl and:
- ✅ Click a **feature button** → saves instantly
- ✅ Change **rating** → saves instantly
- ✅ **Type a note** → saves after 500ms
- ✅ Click **verified** button → saves instantly

All data will appear in Supabase!

## Verify It's Working

### In Browser Console
When you click a feature or change a note, you should see:
```
[FeaturesManager] Toggling feature...
✅ Save successful
```

### In Supabase Dashboard
1. Go to **Table Editor**
2. Click **car_data_local** table
3. Should see rows with car IDs and your data!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Receiving end does not exist" | Reload extension (Extensions page → Reload) |
| "car_data_local table does not exist" | Create table using SQL above |
| No data in Supabase after saving | Check credentials in options page |
| "RLS policy blocks write access" | Run `ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;` |

## Auto-Save Behavior

Each interaction saves automatically without any button:

```
FEATURE CLICK (e.g., "✓ ACC")
  ↓
Immediately cycles state (✓ → ? → ✗)
  ↓
Sends message to background worker
  ↓
Worker writes to car_data_local table
  ✅ Saved in < 1 second

NOTE TYPING (textarea)
  ↓
Debounced 500ms delay
  ↓
Sends saveNote message
  ↓
Worker writes to car_data_local table
  ✅ Saved after you stop typing

RATING CLICK (Best/Good/Fair/Poor/Excluded)
  ↓
Immediately updates all features with confirmed=true
  ↓
Sends saveCarFeatures message
  ↓
Worker writes to car_data_local table
  ✅ Saved in < 1 second

VERIFIED BUTTON CLICK
  ↓
Toggles verified state
  ↓
Sends all features with confirmed status
  ↓
Worker writes to car_data_local table
  ✅ Saved in < 1 second
```

## Need Help?

Open the browser console (F12 → Console tab) and let me know what error messages you see!
