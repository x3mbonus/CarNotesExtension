# Development Guide - Future Features

This guide explains how to extend the Car Notes extension with additional features.

## Current Architecture

### File Structure

```
CarNotesExtension/
├── manifest.json          # Extension config & permissions
├── popup.html/css/js      # Main UI popup
├── content.js/css         # Content script for listing pages
├── storage.js             # Storage API wrapper
├── background.js          # Service worker
└── images/                # Icons folder
```

### Data Flow

```
Popup UI ←→ Storage (Chrome.storage.local)
  ↓
Background Service Worker
  ↓
Content Script ←→ Car Listing Pages
```

## Adding New Features

### Feature 1: Spoiler Expansion on Car Detail Pages

**Goal**: Automatically expand hidden content sections on detailpages.

**Implementation Steps**:

1. **Create a new content script** `detail-content.js`:

```javascript
// detail-content.js
document.addEventListener('DOMContentLoaded', () => {
    expandAllSpoilers();
    showCarDetails();
});

function expandAllSpoilers() {
    // For mobile.de
    const spoilers = document.querySelectorAll('[aria-expanded="false"]');
    spoilers.forEach(spoiler => {
        spoiler.click();
    });

    // For otomoto.pl
    const otomotoDetails = document.querySelectorAll('.accordion-toggle');
    otomotoDetails.forEach(detail => {
        detail.click();
    });
}

function showCarDetails() {
    // Extract and log all visible details
    const allText = document.body.innerText;
    console.log('Car details expanded');
}
```

2. **Update** `manifest.json`:

```json
"content_scripts": [
    {
        "matches": [
            "https://mobile.de/*",
            "https://*.mobile.de/*",
            "https://otomoto.pl/ad/*",
            "https://www.otomoto.pl/ad/*"
        ],
        "js": ["content.js", "detail-content.js"],
        "css": ["content.css"]
    }
]
```

3. **Test on car detail pages**

### Feature 2: Copy Detail Content to Clipboard

**Goal**: Add a button to copy all car details at once.

**Implementation Steps**:

1. **Add popup UI element** in `popup.html`:

```html
<div id="detail-tools" class="tab-content">
    <h3>Car Detail Tools</h3>
    <button id="copy-all-details-btn" class="primary-btn">
        📋 Copy All Details from Current Page
    </button>
    <div id="copy-status"></div>
</div>
```

2. **Add logic in** `popup.js`:

```javascript
document.getElementById('copy-all-details-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'getPageDetails' }, (response) => {
        if (response && response.details) {
            navigator.clipboard.writeText(response.details);
            showStatus('Details copied to clipboard!', 'success');
        }
    });
});
```

3. **Update** `content.js`:

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageDetails') {
        const details = extractAllDetails();
        sendResponse({ details: details });
    }
});

function extractAllDetails() {
    const url = window.location.href;
    const title = document.title;
    const allText = document.body.innerText;

    return `URL: ${url}\n\nTitle: ${title}\n\nDetails:\n${allText}`;
}
```

### Feature 3: Note Templates

**Goal**: Quick templates for common note patterns.

**Implementation Steps**:

1. **Define templates** in `storage.js`:

```javascript
const NOTE_TEMPLATES = {
    'check_before_buy': 'Checklist:\n☐ Test drive\n☐ Check engine\n☐ Check brakes\n☐ Check tires\n☐ Check interior\n☐ Verify service history',
    'seller_contact': 'Seller Info:\nName: \nPhone: \nBest time to contact: ',
    'price_notes': 'Price Analysis:\nSelling Price: €\nMarket Price: €\nDifference: €\nNotes: ',
    'condition': 'Condition Assessment:\nExterior: Good/Fair/Poor\nInterior: Good/Fair/Poor\nEngine: Good/Fair/Poor\nMileage acceptable: Yes/No'
};
```

2. **Add template buttons in** `popup.html`:

```html
<div class="template-buttons">
    <h4>Quick Templates</h4>
    <button class="template-btn" data-template="check_before_buy">Pre-Buy Checklist</button>
    <button class="template-btn" data-template="seller_contact">Seller Contact</button>
    <button class="template-btn" data-template="price_notes">Price Analysis</button>
    <button class="template-btn" data-template="condition">Condition Assessment</button>
</div>
```

3. **Handle template selection** in `popup.js`:

```javascript
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const templateKey = e.target.dataset.template;
        const template = NOTE_TEMPLATES[templateKey];
        document.getElementById('note-text').value = template;
    });
});
```

### Feature 4: Note Categories/Tags

**Goal**: Organize notes with tags + filtering.

**Implementation Steps**:

1. **Extend note structure** in `storage.js`:

```javascript
async function saveNote(carId, text, color, tags = []) {
    const notes = await this.getAll();
    notes[carId] = {
        text: text.trim(),
        color: color || '#ffeb3b',
        tags: tags, // ['interested', 'needs-inspection', etc.]
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    // ... save logic
}
```

2. **Add tag selector in** `popup.html`:

```html
<div class="form-group">
    <label>Tags:</label>
    <div class="tag-selector">
        <input type="checkbox" id="tag-interested" value="interested">
        <label for="tag-interested">Interested</label>

        <input type="checkbox" id="tag-needs-inspection" value="needs-inspection">
        <label for="tag-needs-inspection">Needs Inspection</label>

        <input type="checkbox" id="tag-contacted" value="contacted">
        <label for="tag-contacted">Contacted Seller</label>
    </div>
</div>
```

3. **Add filtering in** `popup.js`:

```javascript
function filterNotesByTag(tag) {
    const noteItems = document.querySelectorAll('.note-item');
    noteItems.forEach(item => {
        const tags = item.dataset.tags?.split(',') || [];
        if (tag === '' || tags.includes(tag)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}
```

### Feature 5: Note Export/Backup

**Goal**: Export notes as CSV or JSON for backup.

**Implementation Steps**:

1. **Add export UI in** `popup.html`:

```html
<button id="export-notes-btn">📥 Export Notes as JSON</button>
<button id="export-csv-btn">📊 Export as CSV</button>
```

2. **Implement export** in `popup.js`:

```javascript
document.getElementById('export-notes-btn').addEventListener('click', async () => {
    const notes = await CarNoteStorage.getAll();
    const dataStr = JSON.stringify(notes, null, 2);
    downloadFile(dataStr, 'car-notes-backup.json', 'application/json');
});

document.getElementById('export-csv-btn').addEventListener('click', async () => {
    const notes = await CarNoteStorage.getAll();
    let csv = 'Car ID,Note,Color,Created Date\n';

    Object.entries(notes).forEach(([id, note]) => {
        csv += `"${id}","${note.text}","${note.color}","${note.createdAt}"\n`;
    });

    downloadFile(csv, 'car-notes-backup.csv', 'text/csv');
});

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
```

## Testing New Features

### Local Testing

1. **Modify files** as needed
2. Go to `chrome://extensions/`
3. Click **Refresh** on Car Notes extension
4. The changes take effect immediately

### Testing on Different Sites

- mobile.de: https://mobile.de/search/
- otomoto.pl: https://www.otomoto.pl/

## Common Patterns

### Message Passing

```javascript
// From popup to content script
chrome.tabs.sendMessage(tabId, { action: 'doSomething', data: data }, (response) => {
    console.log(response);
});

// In content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'doSomething') {
        const result = processData(request.data);
        sendResponse(result);
    }
});
```

### Accessing Storage

```javascript
// Save
await CarNoteStorage.saveNote(carId, text, color);

// Retrieve
const note = await CarNoteStorage.getNote(carId);
const allNotes = await CarNoteStorage.getAll();

// Update
await CarNoteStorage.updateNote(carId, { text: 'new text' });

// Delete
await CarNoteStorage.deleteNote(carId);
```

### DOM Manipulation in Content Scripts

```javascript
// Detect site type
const isMobileDe = window.location.hostname.includes('mobile.de');
const isOtomoto = window.location.hostname.includes('otomoto');

// Find elements
const listings = document.querySelectorAll('[class*="listing"]');

// Add custom elements
const badge = document.createElement('div');
badge.className = 'custom-badge';
element.appendChild(badge);
```

## Performance Tips

1. **Cache queries**: Store selectors instead of querying repeatedly
2. **Debounce events**: Use timeouts to prevent too many updates
3. **Lazy load**: Don't process all elements at once
4. **Minimize DOM**: Build elements in memory before adding to page

## Debugging

### Check Console Errors
- Press **F12** in Chrome
- Go to **Console** tab
- Look for any red errors

### Reload Extension
- Go to `chrome://extensions/`
- Click **Refresh** button

### Check Storage
- In popup, open browser console
- Type: `await CarNoteStorage.getAll()`

## Adding Support for New Sites

1. **Update** `manifest.json`:
   - Add site to `host_permissions`
   - Add to `content_scripts` matches

2. **Create extraction function** in `content.js`:
```javascript
function extractNewSiteId(element) {
    // Find car ID in the element
    return carId;
}
```

3. **Add handler** in `content.js`:
```javascript
if (hostname.includes('newsite.com')) {
    handleNewSite();
}
```

4. **Test** on the new site

## Best Practices

- ✅ Always validate user input
- ✅ Use `try/catch` for async operations
- ✅ Provide user feedback for all actions
- ✅ Test on multiple sites
- ✅ Keep code comments for future maintenance
- ✅ Use descriptive variable names
- ✅ Always clean up event listeners

## Need Help?

- Check Chrome extension docs: https://developer.chrome.com/docs/extensions/
- Reference this guide for patterns
- Test incrementally
- Use browser console for debugging

---

Happy developing! 🚀
