# 🚗 Car Notes Extension - Quick Start

Your Chrome extension for adding colored notes to car listings is ready!

## What You Got

A fully functional Chrome extension that lets you:
- ✅ Add colored notes to car listings on mobile.de & otomoto.pl
- ✅ Auto-detect car IDs from URLs
- ✅ View all notes in one place
- ✅ See note indicators on listing pages
- ✅ Copy notes to clipboard
- ✅ Persistent storage (notes don't disappear)

## 5-Minute Setup

1. **Open Chrome** → Go to `chrome://extensions/`
2. **Enable** "Developer mode" (top-right toggle)
3. **Click** "Load unpacked"
4. **Select** your `CarNotesExtension` folder
5. **Done!** Extension is ready to use

👉 See [INSTALLATION_WINDOWS.md](INSTALLATION_WINDOWS.md) for detailed steps

## First Use

1. Click the **Car Notes** icon in your toolbar
2. Go to a car listing page (mobile.de or otomoto.pl)
3. Click **"🔍 Auto-detect from URL"** to get the car ID
4. Write a note and pick a color
5. Click **"Add Note"**
6. Refresh the listing page - you'll see a colored badge on the car

## File Overview

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration |
| `popup.html/css/js` | Main popup interface |
| `content.js/css` | Runs on car listing pages |
| `storage.js` | Manages saved notes |
| `background.js` | Background service worker |

## Key Features

### Color Coding
Choose from 8 colors to quickly identify your car preferences:
🟡 Yellow, 🟠 Orange, 🔴 Red, 🔴 Pink, 🟣 Purple, 🔵 Blue, 🟢 Green, 🔷 Cyan

### Auto-Detection
Click auto-detect to extract the car ID from the current URL:
- mobile.de: `?id=123456` → `123456`
- otomoto.pl: `/ad/123456/` → `123456`

### Note Indicators
On car listing pages, notes appear as colored circles with 📝
- Click the badge to see your full note
- Colors match your note's background color

### All Notes Tab
View all your notes sorted by date:
- See which cars you've noted
- Copy notes to clipboard (📋)
- Delete individual notes (🗑️)

## Common Tasks

**Add a note**: Click extension → Enter Car ID → Write note → Pick color → Add

**See note on listing**: Go to listing page → Click colored badge

**Copy note**: All Notes tab → Click 📋 button

**Delete note**: All Notes tab → Click 🗑️ button → Confirm

**Delete all notes**: Click 🗑️ in header → Confirm (careful!)

## Documentation Files

- **[INSTALLATION_WINDOWS.md](INSTALLATION_WINDOWS.md)** - Step-by-step installation
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Detailed feature guide
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - How to add new features
- **[README.md](README.md)** - Technical reference

## Next Steps

### Start Using
1. Install the extension (see INSTALLATION_WINDOWS.md)
2. Go to mobile.de or otomoto.pl
3. Start adding notes to cars you're interested in

### Customize
- Edit colors in popup.html (line with color presets)
- Modify color picker colors in popup.css
- Add new sites to manifest.json

### Future Features (In Development)
- Spoiler/detail expansion on car pages
- Advanced clipboard copy options
- Note templates
- More car websites

## Tips

💡 **Use specific notes**: "Engine knocks at startup" is better than "bad"

💡 **Color code by priority**: Green = must see, Red = skip, Yellow = maybe

💡 **Include contact info**: Save seller phone numbers in notes

💡 **Auto-detect is your friend**: Click the 🔍 button instead of manual ID entry

💡 **Keyboard shortcut**: Press Ctrl+Enter to save a note (in popup)

## Troubleshooting

**Icon not showing?** → Click 🧩 puzzle icon → pin Car Notes

**Notes not visible?** → Refresh the page (F5)

**Auto-detect not working?** → Enter Car ID manually

**Need more help?** → See USAGE_GUIDE.md Troubleshooting section

## Privacy

✅ All notes stored **locally** on your computer
✅ **No cloud sync** - notes don't leave your browser
✅ **No tracking** - no external connections
✅ **Your data is yours** - delete anytime

## File Locations

- **Extension**: `c:\MyRepos\CarNotesExtension\`
- **Notes**: Chrome local storage (automatic)
- **Settings**: manifest.json

## Support for New Sites

Want to add another car website? See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - How to Add New Sites section

## Questions?

1. Check the relevant documentation file
2. Look at browser console for errors (F12)
3. Try refreshing the extension in chrome://extensions/

## Version Info

- **Version**: 1.0.0
- **Chrome Minimum**: 88 (2021+)
- **Storage**: ~5MB available
- **Status**: ✅ Ready to use

---

**Ready to find your next car?** Start adding notes now! 🚗✨
