// Car Notes - Content Script
// Adds pencil icons and notes to car listings on mobile.de and otomoto.pl

const processedArticles = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', initializeContentScript);
window.addEventListener('load', initializeContentScript);
setTimeout(initializeContentScript, 500);

// Watch for dynamically added listings
const observer = new MutationObserver(() => {
    setTimeout(initializeContentScript, 200);
});

// Global modal reference
let currentModal = null;

async function initializeContentScript() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const search = window.location.search;

    // Check if it's a detail page
    // Mobile.de: /fahrzeuge/details.html, /auto-inserat/, or language versions like /ru/..../подробности.html
    const isMobileDeDetail = hostname.includes('mobile.de') &&
        (pathname.includes('/auto-inserat/') ||
         pathname.includes('/details.html') ||
        (pathname.endsWith('.html') && search.includes('id=') && !pathname.includes('/search')));
    const isOtomotoDetail = hostname.includes('otomoto.pl') &&
        pathname.includes('/oferta/') && pathname.endsWith('.html');

    // Handle detail pages
    if (isMobileDeDetail) {
        handleMobileDeDetail(search);
        return; // Don't process listings on detail pages
    } else if (isOtomotoDetail) {
        handleOtomotoDetail(pathname);
        return; // Don't process listings on detail pages
    }

    // Handle listing pages
    if (hostname.includes('mobile.de')) {
        handleMobileDe();
    } else if (hostname.includes('otomoto.pl')) {
        handleOtomoto();
    }

    // Start observing for dynamically added listings
    if (!observer.observerStarted) {
        observer.observe(document.body, { childList: true, subtree: true });
        observer.observerStarted = true;
    }
}

async function handleMobileDe() {
    // Find all article elements (car listings on mobile.de)
    const articles = document.querySelectorAll('article');

    for (const article of articles) {
        // Skip if already processed
        if (processedArticles.has(article)) {
            continue;
        }

        const carId = extractMobileDeId(article);
        // Only add button if we have a valid carId
        if (carId && carId.trim()) {
            processedArticles.add(article);
            addNoteButton(article, carId);
        } else {
            // Mark as processed even without ID to avoid reprocessing
            processedArticles.add(article);
            console.log('[CarNotes] Skipped mobile.de article without valid ID');
        }
    }
}

async function handleOtomoto() {
    // Find all article elements (car listings on otomoto.pl)
    const articles = document.querySelectorAll('article');

    // Clean up orphaned note displays (from pagination)
    const currentArticleIds = new Set();
    articles.forEach(article => {
        // Skip widget articles early
        if (article.closest('#car-valuation-slot') ||
            article.closest('[role="dialog"]') ||
            article.closest('.car-valuation') ||
            article.closest('aside')) {
            return;
        }

        const id = extractOtomotoId(article);
        if (id) currentArticleIds.add(id);
    });

    // Remove note displays that don't have corresponding articles on this page
    document.querySelectorAll('.car-note-display').forEach(noteDisplay => {
        const carId = noteDisplay.getAttribute('data-car-id');
        if (!currentArticleIds.has(carId)) {
            noteDisplay.remove();
        }
    });

    for (const article of articles) {
        if (processedArticles.has(article)) {
            continue;
        }

        // Skip articles inside widget containers (car valuation, modals, etc.)
        if (article.closest('#car-valuation-slot') ||
            article.closest('[role="dialog"]') ||
            article.closest('.car-valuation') ||
            article.closest('aside')) {
            processedArticles.add(article);
            continue;
        }

        const carId = extractOtomotoId(article);

        // Only add button if we have a valid carId
        if (carId && carId.trim()) {
            processedArticles.add(article);
            addNoteButton(article, carId);
        } else {
            // Mark as processed even without ID to avoid reprocessing
            processedArticles.add(article);
        }
    }
}

function handleMobileDeDetail(search) {
    // Extract ID from URL query parameter on detail page
    const match = search.match(/[?&]id=(\d+)/);
    if (match) {
        const carId = match[1];
        addNoteButtonDetail(carId);
    }
}

function handleOtomotoDetail(pathname) {
    // Extract ID from URL path on detail page
    // Pattern: /oferta/name-ID.html
    const match = pathname.match(/\/oferta\/.+-(\w+)\.html/);
    if (match) {
        const carId = match[1];
        addNoteButtonDetail(carId);
    }
}

function extractMobileDeId(article) {
    // Find the main link in the article
    const link = article.querySelector('a[href*="details.html"]');
    if (link && link.href) {
        // Extract ID from URL parameter: ?id=451756414
        const match = link.href.match(/[?&]id=(\d+)/);
        if (match && match[1]) {
            console.log('[CarNotes] Found mobile.de ID from details.html:', match[1]);
            return match[1];
        }
    }

    // Fallback: try any link with id parameter
    const anyLink = article.querySelector('a[href*="id="]');
    if (anyLink) {
        const match = anyLink.href.match(/id=(\d+)/);
        if (match && match[1]) {
            console.log('[CarNotes] Found mobile.de ID from fallback:', match[1]);
            return match[1];
        }
    }

    console.log('[CarNotes] No mobile.de ID found for article');
    return null;
}

function extractOtomotoId(element) {
    // PRIORITY 1: Try from href in article - this matches detail page IDs
    // The URL-based ID (e.g., ID6HVVQR) is what's used when saving notes on detail pages

    // Try multiple selector variations to find the link
    let link = element.querySelector('a[href*="/oferta/"]');

    // Fallback: look for links containing "oferta" in any form
    if (!link) {
        link = element.querySelector('a[href*="oferta"]');
    }

    // Fallback: look for any link in the article
    if (!link) {
        const allLinks = element.querySelectorAll('a[href]');
        for (const l of allLinks) {
            if (l.href && l.href.includes('oferta')) {
                link = l;
                break;
            }
        }
    }

    if (link && link.href) {
        // Extract ID - look for the ID pattern that appears before .html
        // URLs look like: /oferta/volkswagen-touran-ID6HVVQR.html
        // We need to capture the ID which starts with "ID" and contains alphanumeric chars
        const idMatch = link.href.match(/(ID[A-Za-z0-9]+)\.html/);
        if (idMatch && idMatch[1]) {
            return idMatch[1].trim();
        }

        // Fallback: try old /ad/ pattern
        const oldMatch = link.href.match(/\/ad\/(\d+)/);
        if (oldMatch && oldMatch[1]) {
            return oldMatch[1].trim();
        }
    }

    // PRIORITY 2: Try data-id attribute (doesn't match stored notes)
    let id = element.getAttribute('data-id');
    if (id && id.trim()) {
        // Skip data-id - it won't match stored notes
    }

    // PRIORITY 3: Try data-ad-id attribute (legacy)
    const adId = element.getAttribute('data-ad-id');
    if (adId && adId.trim()) {
        return adId.trim();
    }

    return null;
}

async function addNoteButton(article, carId) {
    if (!article || !carId || !carId.trim()) {
        return;
    }

    // Get the note for this car
    const note = await getNote(carId);

    // Create the note display container
    const noteDisplay = document.createElement('div');
    noteDisplay.className = 'car-note-display';
    noteDisplay.setAttribute('data-car-id', carId);

    if (note) {
        // Display the note
        const textColor = getTextColorForBackground(note.color);
        noteDisplay.innerHTML = `
            <div class="car-note-content" style="background-color: ${note.color}; color: ${textColor};">
                <div class="car-note-text">${escapeHtml(note.text)}</div>
                <button type="button" class="car-note-edit-btn" data-car-id="${carId}" title="Edit note">✏️</button>
            </div>
        `;
    } else {
        // Display empty state with pencil button only if carId is valid
        noteDisplay.innerHTML = `
            <button type="button" class="car-note-add-btn" data-car-id="${carId}" title="Add note">✏️</button>
        `;
    }

    // Insert note display as sibling after article
    article.parentNode.insertBefore(noteDisplay, article.nextSibling);

    // Attach event listeners
    const editBtn = noteDisplay.querySelector('.car-note-edit-btn');
    const addBtn = noteDisplay.querySelector('.car-note-add-btn');

    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showNoteModal(carId, note, article);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showNoteModal(carId, null, article);
        });
    }
}

async function addNoteButtonDetail(carId) {
    // For detail pages - use fixed positioning in top-right

    // Check if note display already exists for this car
    const existingDisplay = document.querySelector(`[data-car-id="${carId}"].car-note-display-detail`);
    if (existingDisplay) {
        return; // Already added, don't create duplicate
    }

    const note = await getNote(carId);

    // Create the note display container
    const noteDisplay = document.createElement('div');
    noteDisplay.className = 'car-note-display-detail';
    noteDisplay.setAttribute('data-car-id', carId);

    if (note) {
        // Display the note
        const textColor = getTextColorForBackground(note.color);
        noteDisplay.innerHTML = `
            <div class="car-note-content" style="background-color: ${note.color}; color: ${textColor};">
                <div class="car-note-text">${escapeHtml(note.text)}</div>
                <button type="button" class="car-note-edit-btn" data-car-id="${carId}" title="Edit note">✏️</button>
            </div>
        `;
    } else {
        // Display empty state with pencil button
        noteDisplay.innerHTML = `
            <button type="button" class="car-note-add-btn" data-car-id="${carId}" title="Add note">✏️</button>
        `;
    }

    // Add to page body with fixed positioning
    document.body.appendChild(noteDisplay);

    // Attach event listeners
    const editBtn = noteDisplay.querySelector('.car-note-edit-btn');
    const addBtn = noteDisplay.querySelector('.car-note-add-btn');

    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showNoteModal(carId, note, null);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showNoteModal(carId, null, null);
        });
    }
}

function showNoteModal(carId, existingNote, article) {
    // Remove existing modal if any
    if (currentModal) {
        currentModal.remove();
    }

    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'car-note-modal-backdrop';
    backdrop.addEventListener('click', closeModal);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'car-note-modal';

    const colors = ['#607D8B', '#4caf50', '#00bcd4', '#ff9800', '#f44336', '#9c27b0', '#ffeb3b', '#8b4513'];
    const currentColor = existingNote ? existingNote.color : '#607D8B';
    const currentText = existingNote ? existingNote.text : '';

    modal.innerHTML = `
        <div class="car-note-modal-header">
            <h3>Car Note - ID: ${escapeHtml(carId)}</h3>
            <button class="car-note-modal-close" title="Close">✕</button>
        </div>

        <div class="car-note-modal-content">
            <textarea
                class="car-note-modal-textarea"
                placeholder="Add your note here..."
                rows="6"
            >${escapeHtml(currentText)}</textarea>

            <div class="car-note-modal-colors">
                <label>Color:</label>
                <div class="car-note-color-grid">
                    ${colors.map(color => `
                        <button
                            class="car-note-color-btn ${color === currentColor ? 'selected' : ''}"
                            data-color="${color}"
                            style="background-color: ${color};"
                            title="Select color"
                        ></button>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="car-note-modal-actions">
            <button class="car-note-modal-delete-btn">🗑️ Delete Note</button>
            <div>
                <button class="car-note-modal-cancel-btn">Cancel</button>
                <button class="car-note-modal-save-btn">Save Note</button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    currentModal = { element: modal, backdrop: backdrop, carId: carId };

    // Focus textarea
    const textarea = modal.querySelector('.car-note-modal-textarea');
    textarea.focus();

    // Color selection
    modal.querySelectorAll('.car-note-color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            modal.querySelectorAll('.car-note-color-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Close button
    modal.querySelector('.car-note-modal-close').addEventListener('click', closeModal);

    // Cancel button
    modal.querySelector('.car-note-modal-cancel-btn').addEventListener('click', closeModal);

    // Save button
    modal.querySelector('.car-note-modal-save-btn').addEventListener('click', async () => {
        const text = textarea.value.trim();
        const selectedColorBtn = modal.querySelector('.car-note-color-btn.selected');
        const color = selectedColorBtn ? selectedColorBtn.dataset.color : '#607D8B';

        try {
            await saveNoteToStorage(carId, text, color);
            closeModal();

            // Check if we're on a detail page
            const detailDisplay = document.querySelector(`[data-car-id="${carId}"].car-note-display-detail`);
            if (detailDisplay) {
                // Detail page - just remove and recreate the display element
                detailDisplay.remove();
                await addNoteButtonDetail(carId);
            } else {
                // Listing page - full reinitialize
                updateNoteIndicators();
            }
        } catch (error) {
            alert('Error saving note: ' + error.message);
        }
    });

    // Delete button
    modal.querySelector('.car-note-modal-delete-btn').addEventListener('click', async () => {
        if (!confirm('Delete this note?')) return;

        try {
            await deleteNoteFromStorage(carId);
            closeModal();

            // Check if we're on a detail page
            const detailDisplay = document.querySelector(`[data-car-id="${carId}"].car-note-display-detail`);
            if (detailDisplay) {
                // Detail page - just remove and recreate the display element
                detailDisplay.remove();
                await addNoteButtonDetail(carId);
            } else {
                // Listing page - full reinitialize
                updateNoteIndicators();
            }
        } catch (error) {
            alert('Error deleting note: ' + error.message);
        }
    });

    // Close on Escape
    document.addEventListener('keydown', handleEscapeKey);
}

function closeModal() {
    if (currentModal) {
        currentModal.element.remove();
        currentModal.backdrop.remove();
        currentModal = null;
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

async function updateNoteIndicators() {
    // Remove old listing page displays
    document.querySelectorAll('.car-note-display').forEach(display => {
        display.remove();
    });

    // Remove old detail page displays
    document.querySelectorAll('.car-note-display-detail').forEach(display => {
        display.remove();
    });

    // Clear processed articles cache
    processedArticles.clear();

    // Re-initialize
    initializeContentScript();
}

// Get note from storage
async function getNote(carId) {
    return new Promise((resolve) => {
        if (!carId || !carId.trim()) {
            resolve(null);
            return;
        }

        chrome.storage.local.get(['carNotes'], (result) => {
            const notes = result.carNotes || {};
            resolve(notes[carId] || null);
        });
    });
}

// Save note to storage
async function saveNoteToStorage(carId, text, color) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['carNotes'], (result) => {
            const notes = result.carNotes || {};
            notes[carId] = {
                text: text,
                color: color,
                createdAt: notes[carId]?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            chrome.storage.local.set({ carNotes: notes }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Delete note from storage
async function deleteNoteFromStorage(carId) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['carNotes'], (result) => {
            const notes = result.carNotes || {};
            delete notes[carId];
            chrome.storage.local.set({ carNotes: notes }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Calculate text color for contrast based on background brightness
function getTextColorForBackground(hexColor) {
    // Parse hex color
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness (perceived luminance)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return dark text for light backgrounds, light text for dark backgrounds
    return brightness > 155 ? '#333333' : '#ffffff';
}

// Export all notes to JSON file
function exportNotesToJSON() {
    chrome.storage.local.get(['carNotes'], (result) => {
        const notes = result.carNotes || {};
        const jsonData = JSON.stringify(notes, null, 2);

        // Create blob and download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `car-notes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        console.log('✅ Notes exported successfully!');
    });
}

// Import notes from JSON file
function importNotesFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedNotes = JSON.parse(event.target.result);

                // Get existing notes
                chrome.storage.local.get(['carNotes'], (result) => {
                    const existingNotes = result.carNotes || {};
                    const importCount = Object.keys(importedNotes).length;

                    // First confirm: Merge?
                    const isMerge = confirm(`Merge with existing notes?\n\n(${importCount} notes to import)`);

                    if (isMerge) {
                        // Perform merge
                        performMergeImport(importedNotes, existingNotes);
                    } else {
                        // Second confirm: Replace?
                        const isReplace = confirm(`Replace all notes and delete existing?\n\n(${importCount} notes to import)`);

                        if (isReplace) {
                            // Perform replace
                            performReplaceImport(importedNotes);
                        }
                        // If no to replace, cancel (do nothing)
                    }
                });
            } catch (error) {
                alert('❌ Error importing notes: ' + error.message);
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// Perform merge import
function performMergeImport(importedNotes, existingNotes) {
    const merged = { ...existingNotes };
    let mergedCount = 0;
    let newCount = 0;
    let skippedCount = 0;
    let replacedCount = 0;

    for (const carId in importedNotes) {
        if (merged[carId]) {
            const existingText = (merged[carId].text || '').trim();
            const importedText = (importedNotes[carId].text || '').trim();

            // If texts are identical, skip
            if (existingText === importedText) {
                skippedCount++;
                continue;
            }

            // If imported text starts with existing text, replace with imported
            if (importedText.startsWith(existingText)) {
                merged[carId] = {
                    text: importedText,
                    color: importedNotes[carId].color,
                    createdAt: merged[carId].createdAt,
                    updatedAt: new Date().toISOString()
                };
                replacedCount++;
                continue;
            }

            // If existing text starts with imported text, skip (keep existing)
            if (existingText.startsWith(importedText)) {
                skippedCount++;
                continue;
            }

            // Otherwise combine text with delimiter
            merged[carId] = {
                text: existingText && importedText
                    ? `${existingText}\n---\n${importedText}`
                    : importedText || existingText,
                color: importedNotes[carId].color,
                createdAt: merged[carId].createdAt,
                updatedAt: new Date().toISOString()
            };
            mergedCount++;
        } else {
            // New note, just add it
            merged[carId] = importedNotes[carId];
            newCount++;
        }
    }

    chrome.storage.local.set({ carNotes: merged }, () => {
        console.log(`✅ Import complete! New: ${newCount}, Merged: ${mergedCount}, Replaced: ${replacedCount}, Skipped: ${skippedCount}`);
        updateNoteIndicators();
    });
}

// Perform replace import
function performReplaceImport(importedNotes) {
    chrome.storage.local.set({ carNotes: importedNotes }, () => {
        console.log(`✅ Replaced all notes! ${Object.keys(importedNotes).length} notes imported.`);
        updateNoteIndicators();
    });
}

// Make functions globally accessible
window.exportCarNotes = exportNotesToJSON;
window.importCarNotes = importNotesFromJSON;

// ==================== VEHICLE DATA EXTRACTION UI ====================

function createExtractionPanel() {
    // Only show on vehicle detail pages
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check if on mobile.de detail page
    const isMobileDeDetail = hostname.includes('mobile.de') &&
        document.querySelector('[data-testid="vip-price-label"]');

    // Check if on otomoto.pl detail page
    const isOtomotoDetail = hostname.includes('otomoto.pl') &&
        pathname.includes('/oferta/') && pathname.endsWith('.html');

    if (!isMobileDeDetail && !isOtomotoDetail) {
        return;
    }

    // Don't create duplicate panels
    if (document.getElementById('car-notes-extractor-panel')) {
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

// Watch for page changes and reinitialize panel
window.addEventListener('load', createExtractionPanel);
setTimeout(createExtractionPanel, 1000);

// ==================== END EXTRACTION UI ====================

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'export') {
        exportNotesToJSON();
        sendResponse({ status: 'exported' });
    } else if (request.action === 'import') {
        importNotesFromJSON();
        sendResponse({ status: 'importing' });
    }
    return true;
});
