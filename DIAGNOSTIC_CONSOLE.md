# 🔍 Diagnostic Checklist - Check Both Consoles

## Console 1: Content Script (Page Console)
**Where**: F12 → Console tab (while on mobile.de/otomoto.pl detail page)

Click a feature and look for:
```
[UnifiedPanel] Feature button clicked: ACC, current state: true
[UnifiedPanel] Next state: null
[UnifiedPanel] Calling toggleFeature with carId=447293961, feature=ACC, currentState=true
[FeaturesManager.sendMessage] Sending to background: action="updateFeature" ...
[FeaturesManager.sendMessage] Response received for action="updateFeature": {success: true}
[UnifiedPanel] toggleFeature result: {success: true}
```

## Console 2: Background Worker (Service Worker)
**Where**:
1. Open `chrome://extensions/`
2. Find "Car Notes"
3. Click "Inspect views" → "service_worker"
4. A new console opens showing SERVICE WORKER logs

### What to Look For in Service Worker Console

When you click a feature, you should see:

```
[Background.onMessage] Received request: updateFeature {...}
[Background] Handling updateFeature for carId: 447293961
[SupabaseSync.updateFeature] Called...
[SupabaseSync.updateFeature] Fetched current data: {...}
[SupabaseSync.updateFeature] Updated features: {...}
[SupabaseSync.saveFeatures] Calling saveCarData...
[SupabaseSync.saveCarData] Called with: {...}
[SupabaseClient.isReady] Checking: isConfigured=true, hasUrl=true, hasKey=true
[SupabaseClient.isReady] Supabase ready? true
[SupabaseSync.saveCarData] Making PATCH request to: https://xxxxx.supabase.co/rest/v1/car_data_local?car_id=eq.447293961
[SupabaseSync.saveCarData] PATCH response status: 200
✅ Car data updated (PATCH successful)
```

## If You See This - It Works!

Both consoles show complete flow → Data saved to Supabase ✅

## If It Stops at Service Worker Log

### Problem 1: "Supabase ready? false"
```
[SupabaseClient.isReady] Supabase ready? false
```
**Fix**: Set credentials in extension options:
```javascript
// Open Service Worker console and paste:
chrome.storage.sync.set({
  'supabaseUrl': 'https://your-project.supabase.co',
  'supabaseKey': 'your-anon-key'
});
// Then click feature again
```

### Problem 2: "PATCH response status: 404"
```
[SupabaseSync.saveCarData] PATCH response status: 404
```
**Fix**: Create `car_data_local` table in Supabase (see SETUP_FOR_TESTING.md)

### Problem 3: "PATCH response status: 401"
```
[SupabaseSync.saveCarData] PATCH response status: 401
```
**Fix**: API key is wrong or expired. Check Supabase Settings → API and update credentials.

### Problem 4: "PATCH response status: 403"
```
[SupabaseSync.saveCarData] PATCH response status: 403
```
**Fix**: Row Level Security (RLS) is blocking writes. In Supabase SQL editor, run:
```sql
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
```

## Quick Test

1. **Open both consoles side-by-side**:
   - Left: F12 (page console)
   - Right: Service Worker console

2. **Click a feature button**

3. **Watch both consoles**:
   - Page console should show full flow
   - Service Worker should show network request
   - Response status should be 200

4. **Check Supabase**:
   - Go to Supabase Dashboard
   - Browse `car_data_local` table
   - Look for row with your car's ID

## Still Not Working?

**Paste me BOTH console outputs:**
- Content script console (F12 → Console)
- Service Worker console (Service Worker inspector)

With both outputs, I can see exactly where the chain breaks!

---

**Key Point**: If you see `[SupabaseClient.isReady] Supabase ready? false`, that's the issue - credentials aren't set.
