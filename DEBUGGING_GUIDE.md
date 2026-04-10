# Debugging Guide - Unified Panel Testing

## Overview
The unified panel has been debugged with comprehensive logging throughout. All 5 update methods now log completion with detailed information.

## Console Logging Locations

### Panel Initialization (`showPanel()`)
```
🔍 UnifiedPanel.showPanel called with carId: [ID]
```
**Indicates**: Panel is being shown for a specific car

### Section Updates (All 5 logged)
```
✅ Verified section updated
✅ Sort section updated
✅ Note section updated
✅ Features section updated successfully, features count: [N]
✅ Export section updated successfully
```

### Defensive Checks (Warning logs)
```
⚠️ Features section not found
⚠️ Sort section not found
⊙ Note section not found
[UnifiedPanel] Export section not found in DOM
[UnifiedPanel] Features section not found in DOM
[UnifiedPanel] Verified section not found in DOM
```
**Indicates**: DOM element missing - check if createPanel() ran successfully

### Feature Toggles
```
🔄 Toggling verified status to: [true|false]
```

## How to Test

### Step 1: Open Extension
1. Open any car detail page on mobile.de or otomoto.pl
2. Look for the unified panel on the right side
3. Open **Developer Console** (F12 → Console tab)

### Step 2: Watch the Logs
When the panel loads, you should see:
```
🔍 UnifiedPanel.showPanel called with carId: 12345
```

Immediately followed by all 5 update success logs:
```
✅ Verified section updated
✅ Sort section updated
✅ Note section updated
✅ Features section updated successfully, features count: 26
✅ Export section updated successfully
```

### Step 3: Verify Panel Rendering
- [ ] Panel appears on the right side (500px wide)
- [ ] All 5 sections are visible with proper styling
- [ ] No red error messages in console
- [ ] All 5 section completion logs appear

### Step 4: Test Interactions

#### Verified Status
- Click "⊙ Not Verified" or "✓ Verified" button
- Should see: `🔄 Toggling verified status to: [true|false]`

#### Sort Category
- Click any of: Best/Good/Fair/Poor/Excluded
- Should see sort level change in button background

#### Notes
- Click any color button - note textarea updates
- Type in textarea - note auto-saves after 500ms

#### Features
- Click any feature button (e.g., "✓ ACC")
- Should cycle: ✓ → ? → ✗ → ✓
- Stats bar should update

#### Export
- Click any export button (JSON/Text/Excel/Download)
- Should see notification popup

## Troubleshooting

### If Sections Are Empty
1. Check console for section creation warnings
2. Look for any JavaScript errors (red messages)
3. Verify `createPanel()` ran - it adds "Loading..." placeholder HTML

### If Logs Don't Appear
1. Make sure console is open BEFORE clicking on a car
2. Check if page is from mobile.de or otomoto.pl (only supported sites)
3. Verify manifest.json has correct content_scripts order

### If Export Buttons Don't Work
1. Check for copyCarDataToClipboard function in Window
2. Verify downloadCarDataAsJson function exists
3. Check browser console for specific error messages

## Expected Complete Log Sequence

```
[Content] Initializing content.js...
[Content] Car ID found: 12345
[Router] Platform detected: mobile-de
🔍 UnifiedPanel.showPanel called with carId: 12345
[UnifiedPanel] Showing panel for car ID: 12345
✅ Verified section updated
✅ Sort section updated
✅ Note section updated
✅ Features section updated successfully, features count: 26
✅ Export section updated successfully
[UnifiedPanel] Panel displayed successfully
```

If this sequence appears, everything is working correctly!

## Database Integration (When Ready)

After creating the Supabase table, you should also see:
```
[FeaturesManager] Saving all features to database...
[supabase-sync] Sending message to background worker...
[Background] Received message to save features
[supabase-sync] Response: Success
[FeaturesManager] Features saved successfully
```

## Notes
- Logging uses emoji prefixes for quick visual scanning
- Defensive checks log warnings but don't crash the app
- All 5 sections update independently when content changes
- Messages are sent to background worker with retry logic (500ms delay if not ready)
