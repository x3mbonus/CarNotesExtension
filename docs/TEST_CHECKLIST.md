# Testing Checklist - Vehicle Data Extraction

## Setup Complete ✅

You've just added vehicle data extraction to your Car Notes extension. Follow this checklist to verify everything works.

---

## Phase 1: Installation & Loading

- [ ] **Reload extension in chrome://extensions** (click reload icon on Car Notes extension)
- [ ] **Check for manifest errors** - No red warnings in chrome://extensions
- [ ] **Check console for errors** - Open DevTools (F12) → Console → No red errors related to content.js

---

## Phase 2: Navigation Tests

### Test on Mobile.de Listing Page
1. [ ] Visit https://www.mobile.de/
2. [ ] Search for any vehicle (e.g., "Volkswagen")
3. [ ] Verify **extraction panel does NOT appear** (correct - only on detail pages)
4. [ ] Verify **regular note buttons (✏️) appear** on listings (your existing functionality)

### Test on Mobile.de Detail Page
1. [ ] Click on any vehicle listing to open detail page
2. [ ] **Look for blue "Extract Data" panel** in bottom-right corner
3. [ ] If panel appears → ✅ **GOOD** → Continue to Phase 3
4. [ ] If panel **doesn't appear** → Check troubleshooting below

---

## Phase 3: Extraction Functions

### Test: Copy as Text
1. [ ] Click **"📋 Copy (Text)"** button
2. [ ] Verify **green success notification** appears ("✅ Copied TEXT to clipboard")
3. [ ] Open text editor (Notepad, Google Docs, etc.)
4. [ ] Paste (Ctrl+V) and verify:
   - [ ] Contains "VEHICLE DATA REPORT" header
   - [ ] Contains vehicle name (e.g., "Volkswagen Passat")
   - [ ] Contains price information
   - [ ] Contains specifications (mileage, power, fuel, etc.)
   - [ ] Contains features list
   - [ ] Contains dealer information
   - [ ] Contains timestamp

### Test: Copy as JSON
1. [ ] Click **"📋 Copy (JSON)"** button
2. [ ] Verify **green success notification** appears
3. [ ] Open https://jsoncrack.com/ (free JSON viewer)
4. [ ] Paste (Ctrl+V) into the text area
5. [ ] Verify:
   - [ ] Valid JSON (no red errors)
   - [ ] Contains `basics`, `specs`, `features`, `price`, `dealer`, `extracted` fields
   - [ ] All data is structured properly

### Test: Download as TXT
1. [ ] Click **"⬇️ Download (TXT)"** button
2. [ ] Verify **green success notification** appears
3. [ ] Check **Downloads folder** - should have file like `vehicle-Volkswagen-Passat.txt`
4. [ ] Open the file and verify:
   - [ ] Same content as "Copy Text" test
   - [ ] Formatted in sections with borders

### Test: Download as JSON
1. [ ] Click **"⬇️ Download (JSON)"** button
2. [ ] Verify **green success notification** appears
3. [ ] Check **Downloads folder** - should have file like `vehicle-Volkswagen-Passat.json`
4. [ ] Open with text editor and verify valid JSON

---

## Phase 4: UI Functionality

### Test: Minimize/Expand Panel
1. [ ] Click **"−" button** (top-right of panel)
2. [ ] The 4 buttons should **disappear** (panel collapses)
3. [ ] The "−" should change to **"+"**
4. [ ] Click **"+"** button
5. [ ] The 4 buttons should **reappear**

### Test: Notifications Auto-Dismiss
1. [ ] Click any button and watch the notification
2. [ ] Verify notification **auto-disappears after ~3.5 seconds**
3. [ ] Try clicking multiple buttons - each shows its own notification

### Test: Panel Positioning
1. [ ] Scroll the page up and down
2. [ ] Panel should **stay fixed in bottom-right corner**
3. [ ] Panel should **not interfere with page content**
4. [ ] Panel should be **above other elements** (high z-index)

---

## Phase 5: Multiple Pages

### Test: Panel Persists Across Pages
1. [ ] Visit vehicle detail page A → See extraction panel
2. [ ] Go back, visit different vehicle detail page B
3. [ ] Extraction panel should appear again
4. [ ] Try extraction on page B → Verify correct vehicle name in download

---

## Phase 6: Integration with Existing Features

### Test: Notes + Extraction Work Together
1. [ ] Visit a vehicle detail page
2. [ ] You should see **BOTH**:
   - ✏️ Note button (existing feature, top-right area)
   - 📋 Extract panel (new feature, bottom-right corner)
3. [ ] Test that **clicking both doesn't interfere**:
   - [ ] Click note button → Modal opens
   - [ ] Close modal
   - [ ] Click extraction button → Extraction works
   - [ ] Both features work independently ✅

---

## Troubleshooting

### Issue: Panel doesn't appear

**Check 1: Are you on a detail page?**
```javascript
// Run in console on the page:
document.querySelector('[data-testid="vip-price-label"]')
```
- If this returns an element → You're on a detail page ✅
- If this returns `null` → You're not on the right page (visit a different URL)

**Check 2: Are scripts loaded?**
```javascript
// Run in console:
window.copyCarDataToClipboard
window.extractCarData
```
- If both return functions → Scripts loaded ✅
- If either returns `undefined` → Scripts didn't load → Check manifest.json

**Check 3: Check manifest.json**
Open `manifest.json` and verify:
```json
"content_scripts": [
  {
    "matches": ["https://mobile.de/*", "https://www.mobile.de/*", ...],
    "js": ["vehicle-extractor-simple.js", "content.js"],  // ← Simple comes first!
    "run_at": "document_idle"
  }
]
```

**Check 4: Reload extension**
1. Open chrome://extensions
2. Find "Car Notes" extension
3. Click reload icon
4. Retry on mobile.de detail page

### Issue: Copy doesn't work

**Check 1: Verify script function exists**
```javascript
// Run in console:
window.copyCarDataToClipboard('json')
// Should return: Promise { <pending> ... }
```

**Check 2: Check for console errors**
- Open DevTools (F12) → Console tab
- Look for RED errors
- Share any errors in your messages

### Issue: Data is incomplete or missing fields

**Possible causes:**
- Listing is very old and doesn't have all fields
- mobile.de changed their HTML structure
- Vehicle missing certain specifications

**Verify selectors are correct:**
1. Right-click on vehicle price → Inspect
2. Check if class/data-testid matches what's in `vehicle-extractor-simple.js`
3. If different → provide new selectors in your message

---

## Success Criteria ✅

Your setup is **complete and working** when:

- [x] Extraction panel appears on mobile.de detail pages
- [x] All 4 copy/download buttons work without errors
- [x] Notifications appear and auto-dismiss
- [x] Download files appear in Downloads folder
- [x] Copied data is valid (proper text format or valid JSON)
- [x] Panel can be minimized/expanded
- [x] Existing note feature still works
- [x] No red console errors

---

## Next Steps

Once testing is complete:

1. **Test on multiple different vehicles** - Verify it works across different listings
2. **Check data completeness** - Note any missing fields and share in feedback
3. **Check for selector changes** - If data seems wrong, mobile.de may have updated
4. **Optional: Add to popup** - Could add quick-export buttons to extension popup

---

## Debug Mode - Get Full Data

If you want to see the complete extracted data object:

```javascript
// Run in console on a detail page:
const data = window.extractCarData();
console.log(JSON.stringify(data, null, 2));
// This will print all extracted data to console
```

---

## Questions or Issues?

If something doesn't work:

1. **Check Phase by Phase** - Find which phase fails
2. **Run debug commands** - Try the troubleshooting checks above
3. **File > Save console output** - Take screenshot of errors
4. **Share the following:**
   - URL of the vehicle page that failed
   - Any red console errors
   - What you expected vs. what happened

Good luck! 🚗
