# Installation Guide for Windows

## Quick Start (5 minutes)

### Step 1: Prepare the Extension Files

1. You already have all files in: `c:\MyRepos\CarNotesExtension\`
2. Make sure you have all these files:
   - `manifest.json`
   - `popup.html`, `popup.css`, `popup.js`
   - `content.js`, `content.css`
   - `storage.js`
   - `background.js`
   - `README.md`, `USAGE_GUIDE.md`
   - `images/` folder (with README.md)

### Step 2: Open Chrome Extensions Page

1. Open **Google Chrome**
2. Type in the address bar: `chrome://extensions/`
3. Press **Enter**

### Step 3: Enable Developer Mode

1. Look at the **top-right corner** of the extensions page
2. You'll see a toggle labeled **"Developer mode"**
3. Click it to turn it **ON** (it will turn blue)

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button (now visible after enabling Developer mode)
2. A file browser window will open
3. Navigate to: `C:\MyRepos\CarNotesExtension`
4. Click **"Select Folder"**

### Step 5: Verify Installation

You should see:
- ✅ The extension appears in your extensions list
- ✅ A **"Car Notes"** entry with an icon
- ✅ The extension icon appears in your Chrome toolbar

**You're done!** The extension is now installed.

## Using the Extension

### First Time Setup

1. Click the **Car Notes** icon in your toolbar
2. You'll see the popup window with two tabs:
   - **Add Note** (default)
   - **All Notes**

### Finding the Icon

If you don't see the extension icon:

1. Click the **puzzle icon** (🧩) in the top-right of Chrome
2. Find **"Car Notes"** in the list
3. Click the **pin icon** next to it to add it to your toolbar

## Updating the Extension

If you modify any files:

1. Go to `chrome://extensions/`
2. Find **"Car Notes"** in the list
3. Click the **refresh icon** (🔄) at the bottom-right of the extension card
4. Changes will take effect immediately

## Uninstalling the Extension

If you want to remove the extension:

1. Go to `chrome://extensions/`
2. Find **"Car Notes"**
3. Click the **"Remove"** button
4. Confirm the deletion

**Note**: This will delete all your saved notes.

## Troubleshooting on Windows

### Extension Won't Load

**Error**: "App installed, but not running"

**Solution**:
1. Make sure all files are in `C:\MyRepos\CarNotesExtension\`
2. Go to `chrome://extensions/`
3. Click **Refresh** on the Car Notes extension
4. If still not working, remove and reload it

### Folder Path Contains Spaces

**Problem**: If your path has spaces (e.g., `C:\My Repos\Car Notes Extension`)

**Solution**: This should work fine, but if it doesn't:
1. Move the folder to a path without spaces
2. Then load it again

### Extension Icon Not Showing in Toolbar

**Solution**:
1. Click the **puzzle icon** (🧩) in Chrome toolbar
2. Click the **pin icon** next to Car Notes
3. The icon will now appear in your main toolbar

## Testing the Extension

### Test on mobile.de

1. Go to https://mobile.de
2. Search for any car
3. You should see car listings
4. Try clicking the **"Auto-detect from URL"** button in the extension
5. The car ID should be extracted

### Test on otomoto.pl

1. Go to https://www.otomoto.pl
2. Search for any car
3. Try the auto-detect feature

### Test Adding a Note

1. Enter a Car ID: `12345` (or use auto-detect)
2. Write a test note: `Test note`
3. Pick a color
4. Click **"Add Note"**
5. You should see a success message

### Test Viewing on Listing

1. Go back to a listing page
2. Refresh the page (F5)
3. You should see colored badge with 📝 on cars with notes
4. Click the badge to see the note

## File Locations for Quick Reference

- **Extension folder**: `C:\MyRepos\CarNotesExtension\`
- **Configuration**: `C:\MyRepos\CarNotesExtension\manifest.json`
- **Popup UI**: `C:\MyRepos\CarNotesExtension\popup.html`
- **All notes are stored in**: Chrome local storage (automatic)

## Windows Defender / Antivirus

Some Windows security software might flag the extension during development:

- ✅ This is normal for unpacked extensions
- ✅ It's safe - the extension has no external network connections
- ✅ Just click "Allow" or "Run anyway"

## Chrome Version Requirement

- **Minimum**: Chrome 88 (from 2021)
- **Recommended**: Latest Chrome version

Check your version:
1. Click the **⋮** menu (top-right)
2. Go to **Help → About Google Chrome**
3. It will show your version and auto-update if needed

## Next Steps

1. Read the [USAGE_GUIDE.md](USAGE_GUIDE.md) for detailed features
2. Start adding notes to cars you're interested in
3. Use color coding to organize your cars
4. Check back regularly for new features!

## Getting Updates

To see if there's a newer version:

1. Check this folder regularly for updates
2. When new versions are available:
   - Replace the files
   - Refresh the extension in `chrome://extensions/`

## Support

If something doesn't work:

1. Check the [USAGE_GUIDE.md](USAGE_GUIDE.md) Troubleshooting section
2. Look for error messages in the popup
3. Open Chrome Developer Tools (F12) to see console errors
4. Check that all required files are present

---

**Ready to go!** 🚗 Happy car hunting!
