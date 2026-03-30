# Car Notes Chrome Extension

A Chrome extension for adding colored notes to car listings on sites like mobile.de and otomoto.pl.

## Features

- **Add Colored Notes**: Create notes with custom background colors for each car listing
- **Auto-detect Car IDs**: Automatically extract car IDs from URLs
- **Manage Notes**: View all notes in one place, delete, or copy to clipboard
- **Visual Indicators**: See note indicators directly on car listings
- **Note Tooltips**: Hover over indicators to see note content
- **Persistent Storage**: Notes are saved in browser storage

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `CarNotesExtension` folder
6. The extension will appear in your Chrome toolbar

## Usage

### Adding a Note

1. Click the extension icon in the Chrome toolbar
2. Go to the "Add Note" tab
3. Enter the Car ID (or click auto-detect to extract from current URL)
4. Write your note
5. Choose a background color
6. Click "Add Note"

### Viewing Notes

1. Click the extension icon
2. Go to the "All Notes" tab
3. View all your notes sorted by creation date
4. Click the copy button (📋) to copy a note to clipboard
5. Click the delete button (🗑️) to remove a note

### On Car Listing Pages

- Notes appear as colored circular badges with a 📝 icon on car listings
- Click the badge to see the full note content
- Colors match the note's background color

## Supported Sites

- mobile.de
- otomoto.pl
- More sites can be added to manifest.json

## Information for Car Details Page

Future versions will include:
- Spoiler expansion on car detail pages
- Advanced clipboard copy options
- Note templates

## Storage

All notes are stored in Chrome's local storage (`chrome.storage.local`). Data persists across browser sessions but is specific to your browser profile.

## Privacy

This extension:
- Does NOT send data to external servers
- Does NOT track your browsing
- Stores all data locally on your computer
- Does NOT modify website content beyond adding note indicators

## Keyboard Shortcuts

- In note textarea: `Ctrl+Enter` to submit the note

## File Structure

```
CarNotesExtension/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── content.js          # Content script for listing pages
├── content.css         # Content script styles
├── storage.js          # Storage management
├── background.js       # Service worker
└── README.md           # This file
```

## Troubleshooting

### Extension not showing notes on listings
- Some sites have complex DOM structures. Check the browser console for errors
- The car ID might not be properly extracted. Try entering it manually

### Notes not saving
- Check Chrome permissions for storage
- Try clearing Chrome cache and reloading the extension

### Auto-detect not working
- The current URL must be a car listing or details page
- The URL must contain an ID parameter or follow a recognized pattern

## Development

To modify colors or add new sites:
1. Edit `manifest.json` to add new `host_permissions`
2. Update `content.js` with new extraction methods for the site
3. Reload the extension in `chrome://extensions/`

## License

Free to use and modify for personal use.
