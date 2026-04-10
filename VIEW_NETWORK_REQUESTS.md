# 📡 How to View Supabase API Calls in Network Tab

## The Problem
Service Worker network requests **don't appear in the regular Network tab** because they run in a separate context from the web page.

## Solution 1: View in Service Worker Console ✅ (RECOMMENDED)

**This is the BEST way to see actual API calls:**

1. Open `chrome://extensions/`
2. Find "Car Notes" extension
3. Click **"Inspect views" → "service_worker"**
4. In the Service Worker console, go to **Network tab**
5. Click a feature button on the detail page
6. You should see:
   - `PATCH https://xxxxx.supabase.co/rest/v1/car_data_local?car_id=eq.447...` 
   - Status 200 (success)

This tab shows ONLY service worker network requests.

## Solution 2: Read Detailed Logs in Service Worker Console ✅

Service Worker console will show:

```
[SupabaseSync.saveCarData] ========== SUPABASE API REQUEST ==========
[SupabaseSync.saveCarData] Method: PATCH
[SupabaseSync.saveCarData] URL: https://xxxxx.supabase.co/rest/v1/car_data_local?car_id=eq.447293961
[SupabaseSync.saveCarData] Headers: Content-Type: application/json
[SupabaseSync.saveCarData] Body: {
  "feature_acc": true,
  "feature_blind_spot": null,
  ...
  "updated_at": "2026-04-10T12:34:56.789Z"
}
[SupabaseSync.saveCarData] ========== SUPABASE API RESPONSE ==========
[SupabaseSync.saveCarData] Status: 200 OK
[SupabaseSync.saveCarData] Headers:
  content-type: application/json
  x-request-id: abc123...
[SupabaseSync.saveCarData] Body: [{"id": 12345, "car_id": "447293961", ...}]
[SupabaseSync.saveCarData] ==========================================
```

## Solution 3: Check Supabase Dashboard Directly ✅

**Best for verifying data was actually saved:**

1. Open Supabase Dashboard
2. Go to **Table Editor**
3. Click **car_data_local** table
4. Look for row with your car's ID
5. Check if columns were updated
6. Timestamp in `updated_at` should be recent

This is the source of truth - if data is here, it definitely saved!

## Testing Flow

### To View API Request → Response:

1. **Split screen setup:**
   - Left: Service Worker console (from Extensions page)
   - Right: Supabase dashboard (supabase.com)

2. **Click a feature button:**
   - You type something, left console logs the PATCH request
   - Response appears immediately after
   - Check right side (Supabase) to see data updated

3. **Watch the logs:**
   - Request shows exact payload being sent
   - Response shows what Supabase returned
   - Status code tells you if it worked (200 = success)

## Common Status Codes

| Status | Meaning | Fix |
|--------|---------|-----|
| 200 | Success ✅ | Data saved! |
| 201 | Created ✅ | New row inserted |
| 400 | Bad Request | Check payload format |
| 401 | Unauthorized | API key is wrong |
| 403 | Forbidden | RLS blocking writes |
| 404 | Not Found | Table doesn't exist |
| 409 | Conflict | Unique constraint violation |
| 500 | Server Error | Supabase issue |

## Troubleshooting

### "I don't see any PATCH requests in Service Worker Network tab"

**Check:**
1. Are you looking at the right console?
   - Go to `chrome://extensions/` → Car Notes → Inspect views → service_worker
   - Not the page console!

2. Did you enable logging?
   - Reload extension (Extensions page → Reload button)
   - Try clicking a feature again

3. Is the message reaching the background worker?
   - Check page console for: `[FeaturesManager.sendMessage] Success for action="saveCarFeatures"`
   - If you see this, message reached background successfully

### "I see request but status 403 Forbidden"

**Fix:**
In Supabase, run this SQL:
```sql
ALTER TABLE car_data_local DISABLE ROW LEVEL SECURITY;
```

### "I see request but status 404 Not Found"

**Fix:**
Table doesn't exist. Create it using SQL from SETUP_FOR_TESTING.md

### "No requests at all"

**Check:**
1. Empty browser cache and reload
2. Is extension loaded? (Check chrome://extensions/)
3. Is Supabase configured? (Check Service Worker console for "Supabase ready? false")

## What a Successful Save Looks Like

**Page console:**
```
[UnifiedPanel] Feature button clicked: ACC, current state: true
[UnifiedPanel] Updated currentFeatures[ACC] to null
[UnifiedPanel] Calling toggleFeature...
[FeaturesManager.sendMessage] Sending to background: action="saveCarFeatures"
[FeaturesManager.sendMessage] Response received: {success: true}
[UnifiedPanel] Refreshing features from database...
[UnifiedPanel] Features refreshed, now has 26 features
```

**Service Worker console (Network tab):**
```
PATCH https://your-project.supabase.co/rest/v1/car_data_local?car_id=eq.447293961
Status: 200 OK
```

**Supabase Dashboard:**
- Row with your car ID exists
- `feature_acc` column = true
- `updated_at` = recent timestamp

All three aligned = ✅ **Save successful!**

## Pro Tip: Monitor Both Simultaneously

Use DevTools side-by-side:
```
┌──────────────────────┬──────────────────────┐
│  Service Worker      │   Supabase Dashboard │
│  Network Tab         │   car_data_local     │
│  (to see requests)   │   (to verify saved)  │
└──────────────────────┴──────────────────────┘
```

Click feature → See request in left → See data update in right instantly!
