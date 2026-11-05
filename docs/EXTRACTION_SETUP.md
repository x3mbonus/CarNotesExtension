# Vehicle Data Extraction Setup Guide

## Quick Start

This guide shows how to add vehicle data extraction (copy to clipboard or download) to your Chrome extension.

## Option 1: Simple Approach (Recommended)

### Step 1: Add to manifest.json

```json
{
  "manifest_version": 3,
  // ... existing fields ...
  "content_scripts": [
    {
      "matches": ["*://www.mobile.de/*"],
      "js": ["content.js", "vehicle-extractor-simple.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "storage",
    "activeTab"
  ]
}
```

### Step 2: Create Extraction UI Component

Add this to your existing **content.js** (paste at the end):

```javascript
// ==================== VEHICLE DATA EXTRACTION UI ====================

function createExtractionPanel() {
  // Only show on vehicle detail pages
  if (!document.querySelector('[data-testid="vip-price-label"]')) {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'car-notes-extractor-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 12px;
    z-index: 10000;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 8px;
    color: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  title.innerHTML = `
    <span>📋 Extract Data</span>
    <button id="extractor-minimize" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 0; width: 20px; height: 20px;">−</button>
  `;

  const buttonsContainer = document.createElement('div');
  buttonsContainer.id = 'extractor-buttons';
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  const buttons = [
    { label: '📋 Copy (Text)', action: () => copyExtractedData('text') },
    { label: '📋 Copy (JSON)', action: () => copyExtractedData('json') },
    { label: '⬇️ Download (TXT)', action: () => downloadExtractedData('text') },
    { label: '⬇️ Download (JSON)', action: () => downloadExtractedData('json') }
  ];

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.label;
    button.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    `;
    button.onmouseenter = () => button.style.background = '#0056b3';
    button.onmouseleave = () => button.style.background = '#007bff';
    button.onclick = btn.action;
    buttonsContainer.appendChild(button);
  });

  panel.appendChild(title);
  panel.appendChild(buttonsContainer);
  document.body.appendChild(panel);

  // Minimize functionality
  document.getElementById('extractor-minimize').addEventListener('click', () => {
    const buttons = document.getElementById('extractor-buttons');
    const minimizeBtn = document.getElementById('extractor-minimize');
    if (buttons.style.display === 'none') {
      buttons.style.display = 'flex';
      minimizeBtn.textContent = '−';
    } else {
      buttons.style.display = 'none';
      minimizeBtn.textContent = '+';
    }
  });
}

async function copyExtractedData(format) {
  if (!window.copyCarDataToClipboard) {
    showNotification('Extraction not available', 'error');
    return;
  }

  try {
    const result = await window.copyCarDataToClipboard(format);
    if (result.success) {
      showNotification(`✅ Copied ${format.toUpperCase()} to clipboard`, 'success');
    } else {
      showNotification(`❌ Failed to copy: ${result.error}`, 'error');
    }
  } catch (err) {
    showNotification(`❌ Error: ${err.message}`, 'error');
  }
}

function downloadExtractedData(format) {
  if (!window.downloadCarData) {
    showNotification('Extraction not available', 'error');
    return;
  }

  try {
    window.downloadCarData(format);
    showNotification(`✅ Downloading ${format.toUpperCase()} file`, 'success');
  } catch (err) {
    showNotification(`❌ Error: ${err.message}`, 'error');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    border-radius: 4px;
    font-size: 13px;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3500);
}

// Initialize extraction panel when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createExtractionPanel);
} else {
  createExtractionPanel();
}
```

## Results

After setup, you'll see a floating panel in the bottom-right corner of mobile.de vehicle pages with 4 buttons:

- **📋 Copy (Text)** - Copies formatted text (human-readable)
- **📋 Copy (JSON)** - Copies structured JSON (for tools/processing)
- **⬇️ Download (TXT)** - Downloads formatted text file
- **⬇️ Download (JSON)** - Downloads JSON file

## What Gets Extracted

The extracted data includes:

- **Vehicle Basics**: Name, subtitle/model
- **Technical Specs**: Mileage, power, fuel type, transmission, CO₂, etc.
- **Features**: All checkbox items (ABS, cruise control, etc.)
- **Price**: Amount, net info, monthly rates
- **Dealer Info**: Name, address, rating
- **Timestamp**: When data was extracted

## Example Output (Text Format)

```
VEHICLE DATA REPORT
Extracted: 2024-03-31T14:23:45.123Z
============================================================

VEHICLE: Volkswagen Passat Business 1.4 TSI
MODEL: Sedan

PRICE:
  amount: €17,790
  netInfo: €14,950 (Net), 19% VAT

SPECIFICATIONS:
  Mileage: 104,000 km
  Power: 90 kW (122 hp)
  Fuel: Diesel
  ...

FEATURES (45):
  • ABS
  • Air conditioning
  • Adaptive cruise control
  ...

DEALER INFO:
  name: AS Automobile
  address1: Hafenbahnstr. 22a
  address2: DE-70329 Stuttgart
  rating: 4.8 stars (172 Ratings)
```

## Troubleshooting

**Panel doesn't appear:**
- Check that you're on a mobile.de vehicle detail page (not listing)
- Open DevTools console and run: `document.querySelector('[data-testid="vip-price-label"]')`
- If null, the page structure may have changed

**Copy doesn't work:**
- Check browser console for errors
- Verify permissions include "activeTab"
- Ensure "vehicle-extractor-simple.js" is loaded (check DevTools Sources tab)

**Data is incomplete:**
- Some fields may not exist on older listings
- Check DevTools console for any selector warnings
- mobile.de may update DOM structure - selectors may need adjustment

## Advanced: Custom Selectors

If mobile.de changes their HTML structure, update selectors in **vehicle-extractor-simple.js**:

```javascript
// Find new selector using DevTools:
// 1. Right-click on element
// 2. Select "Inspect"
// 3. Copy className or data-testid attribute
// 4. Update in vehicle-extractor-simple.js

const vehicleTitle = document.querySelector('h2.dNpqi'); // ← Update this selector
```

## Testing Instructions

1. Update **manifest.json** with the content_scripts entry above
2. Reload extension in `chrome://extensions`
3. Visit a mobile.de vehicle detail page (e.g., https://www.mobile.de/inserat/...)
4. Look for blue "Extract Data" panel (bottom-right corner)
5. Click a button and verify:
   - Success notification appears
   - Data is copied or downloaded correctly
   - Minimize button (−) collapses the panel

## Next Steps

- Test on 5-10 different mobile.de listings to verify selectors work
- Note any missing data fields and research new selectors if needed
- Optional: Add export format preference to popup.html
- Optional: Store extracted data in chrome.storage.local for a history
