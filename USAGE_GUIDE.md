# Car Notes Extension - Usage Guide

## Getting Started

### Step 1: Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** using the toggle in the top-right corner
3. Click **"Load unpacked"**
4. Navigate to and select your `CarNotesExtension` folder
5. The extension should now appear in your Chrome extensions list and toolbar

### Step 2: Access the Extension

Click the **Car Notes** extension icon in your Chrome toolbar (or in the extensions menu if pinned).

## Main Features

### Adding a Note (Quick Start)

1. Click the extension icon
2. You'll see the **"Add Note"** tab
3. Fill in the fields:
   - **Car ID**: The unique identifier for the car listing
   - **Note**: Your text (e.g., "Good condition, check brakes", "Contact seller on Friday")
   - **Color**: Choose a background color that matches your mood/category
4. Click **"Add Note"**
5. You'll see a success message

### Auto-Detecting Car ID

Instead of manually entering the car ID:

1. Navigate to a car listing page (mobile.de or otomoto.pl)
2. Click the **"🔍 Auto-detect from URL"** button
3. The extension will try to extract the car ID from the URL
4. If successful, the ID will appear in the Car ID field
5. Complete your note and save

### Viewing All Notes

1. Click the extension icon
2. Click the **"All Notes"** tab
3. You'll see a list of all your saved notes, ordered by newest first
4. Each note shows:
   - **Car ID**: The identifier for the car
   - **Date Added**: When you created the note
   - **Note Content**: Your full note text
   - **Action Buttons**:
     - 📋 Copy the note to clipboard
     - 🗑️ Delete the note

### Color Coding Strategy

Use different colors to categorize your notes:

- 🟡 **Yellow**: Interested, might buy
- 🟠 **Orange**: Good deal, check specs
- 🔴 **Red**: Problem found, needs inspection
- 🔴 **Pink**: Seller suspicious, be careful
- 🟣 **Purple**: Premium/high price
- 🔵 **Blue**: Good price, worth considering
- 🟢 **Green**: Great deal, high priority
- 🔷 **Cyan**: Already contacted seller

## On Car Listing Pages

### Seeing Notes

When you visit a car listing page (mobile.de or otomoto.pl):

- Cars with notes will have a colored circular badge with a 📝 icon
- The badge color matches your note's color
- The badge appears in the top-right corner of the listing

### Reading a Note

- **Click** the colored note badge to see your full note
- A tooltip will appear showing your note content
- The tooltip automatically closes after 5 seconds
- You can also press **ESC** to close the tooltip immediately

### Note Indicators

The note badges show:
- Which cars you've already noted
- At a glance category (by color)
- Easy identification of cars you're interested in

## Managing Notes

### Deleting a Single Note

**From the popup:**
1. Go to **"All Notes"** tab
2. Find the note you want to delete
3. Click the **🗑️ button**
4. Confirm the deletion

**From a listing page:**
- Unfortunately, the listing view only shows indicators. Use the popup to delete.

### Clearing All Notes

⚠️ **Use with caution!**

1. Click the extension icon
2. Click the **🗑️ button** in the header (top-right corner)
3. Confirm that you want to delete all notes
4. All notes will be immediately deleted

### Copying Notes

1. Go to **"All Notes"** tab
2. Click the **📋 button** next to a note
3. The note text is copied to your clipboard
4. You can now paste it in emails, documents, etc.

## Tips & Tricks

### Keyboard Shortcuts

- **Ctrl+Enter** in the note text area = Save note (when in popup)
- **ESC** on listing page = Close note tooltip

### Best Practices

1. **Be specific**: "Engine knock at 2000 RPM from cold start" is better than "bad engine"
2. **Include contact info**: "Seller: 0049-123-456, available weekends"
3. **Reference other sources**: "KBB value: €15,000, this is €12,500"
4. **Date important info**: "Inspection scheduled for Friday 3/31"

### Organizing Notes

- Use colors to prioritize (green = must see, red = skip)
- Use the date filter mentally (filter by when notes were added)
- Delete notes for cars you've already passed on

## Car Listing Websites

### Supported Websites

- **mobile.de** (all regions)
- **otomoto.pl** (Poland)

### Adding New Websites

To support additional car listing sites:

1. Navigate to the new website and identify the car listing structure
2. Update `manifest.json`:
   - Add `https://<domain>/*` to `host_permissions`
   - Add it to the `content_scripts` matches array
3. Update `content.js`:
   - Add a new handler function (like `handleMobileDe()`)
   - Add logic to extract car IDs from that site
4. Reload the extension

## Troubleshooting

### Extension Not Showing Notes on Listings

**Problem**: I see cars on the listing page but no note badges appear

**Solutions**:
1. Make sure the extension is enabled in `chrome://extensions/`
2. Refresh the car listing page (Ctrl+R or F5)
3. Check if the website is in the supported list
4. Open the browser console (F12) and check for errors

### Auto-Detect Not Working

**Problem**: The auto-detect button doesn't find the car ID

**Solutions**:
1. The page might not be a recognized car listing format
2. Manually copy the ID from the URL
3. If the URL pattern is new, report it so support can be added

### Notes Not Saving

**Problem**: I click "Add Note" but the note doesn't appear

**Solutions**:
1. Check for error messages in red text
2. Make sure you filled in both Car ID and Note fields
3. Check Chrome permissions: Settings → Privacy → Site Settings → Cookies and site data
4. Try clearing browser cache (Chrome → Settings → Clear browsing data)

### Notes Lost After Browser Update

**Notes are stored locally**, so:
- Clearing browser data will delete notes
- Uninstalling the extension will delete notes
- Reinstalling Chrome will delete notes
- **Backup**: You can see all notes in the popup anytime

## Using Storage Efficiently

Your notes are stored in Chrome's local storage (about 5MB limit for extensions). This means:

- You can store **hundreds of notes**
- Storage is **private** to your browser profile
- **No internet required** - everything works offline
- **No cloud sync** - notes don't sync across devices

## Advanced Usage (For Future Versions)

The extension architecture is designed to support:
- Spoiler expansion on car detail pages
- Advanced clipboard options (export as CSV, PDF)
- Note templates
- Integration with price comparison tools
- Notification reminders

## Feedback & Improvements

Current roadmap:
1. Support for more car websites
2. Note templates for common observations
3. Export notes functionality
4. Spoiler expansion automation
5. Advanced search and filtering

## Privacy & Data

This extension:
- ✅ Stores data **locally only**
- ✅ **No tracking** of your browsing
- ✅ **No external servers** contacted
- ❌ Does NOT require internet
- ❌ Does NOT share data
- ❌ Does NOT store passwords

All notes are yours and stay on your computer.

---

Need help? Check the README.md for technical details.
