# CLEANUP - Files to Remove

These files are **no longer needed** and can be safely deleted:

## Delete These Files:

1. **popup.html** - Not using the popup anymore
2. **popup.css** - Not using the popup anymore  
3. **popup.js** - Not using the popup anymore
4. **storage.js** - Storage logic moved to content.js
5. **background.js** - Not needed (no background service worker)
6. **USAGE_GUIDE.md** - Outdated
7. **INSTALLATION_WINDOWS.md** - Outdated
8. **DEVELOPMENT_GUIDE.md** - Outdated
9. **QUICK_START.md** - Outdated
10. **images/** folder - Not using extension icons in popup

## Keep These Files:

1. **manifest.json** - ✅ Simplified, updated
2. **content.js** - ✅ Simplified, main logic
3. **content.css** - ✅ Keep as is
4. **README_SIMPLE.md** - ✅ New minimal README

## After Cleanup:

Your extension folder will only have:
```
CarNotesExtension/
├── manifest.json
├── content.js
├── content.css
└── README_SIMPLE.md
```

Much simpler! 🎉

## Final Step:

1. Delete all the "Delete These Files" listed above
2. Reload extension in `chrome://extensions/`
3. Test on mobile.de
