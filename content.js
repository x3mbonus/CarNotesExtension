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
        if (carId) {
            processedArticles.add(article);
            addNoteButton(article, carId);
        }
    }
}

async function handleOtomoto() {
    // Find all article elements (car listings on otomoto.pl)
    const articles = document.querySelectorAll('article, [data-ad-id]');

    for (const article of articles) {
        if (processedArticles.has(article)) {
            continue;
        }

        const carId = extractOtomotoId(article);
        if (carId) {
            processedArticles.add(article);
            addNoteButton(article, carId);
        }
    }
}

function extractMobileDeId(article) {
    // Find the main link in the article
    const link = article.querySelector('a[href*="details.html"]');
    if (link && link.href) {
        // Extract ID from URL parameter: ?id=451756414
        const match = link.href.match(/[?&]id=(\d+)/);
        if (match) return match[1];
    }

    // Fallback: try any link with id parameter
    const anyLink = article.querySelector('a[href*="id="]');
    if (anyLink) {
        const match = anyLink.href.match(/id=(\d+)/);
        if (match) return match[1];
    }

    return null;
}

function extractOtomotoId(element) {
    // Try data attribute
    const id = element.getAttribute('data-ad-id');
    if (id) return id;

    // Try from href in article
    const link = element.querySelector('a[href*="/ad/"]');
    if (link) {
        const match = link.href.match(/\/ad\/(\d+)/);
        if (match) return match[1];
    }

    return null;
}

async function addNoteButton(article, carId) {
    if (!article) return;

    // Get the note for this car
    const note = await getNote(carId);

    // Find a good place to insert the note display - look for the car title/header area
    const titleSection = article.querySelector('h2') || article.querySelector('section');
    if (!titleSection) return;

    // Create the note display container
    const noteDisplay = document.createElement('div');
    noteDisplay.className = 'car-note-display';
    noteDisplay.setAttribute('data-car-id', carId);

    if (note) {
        // Display the note
        noteDisplay.innerHTML = `
            <div class="car-note-content" style="background-color: ${note.color};">
                <div class="car-note-text">${escapeHtml(note.text)}</div>
                <button class="car-note-edit-btn" data-car-id="${carId}" title="Edit note">✏️</button>
            </div>
        `;
    } else {
        // Display empty state with pencil button
        noteDisplay.innerHTML = `
            <button class="car-note-add-btn" data-car-id="${carId}" title="Add note">✏️</button>
        `;
    }

    // Find best insertion point
    const parent = titleSection.parentNode;
    if (parent) {
        parent.insertBefore(noteDisplay, titleSection);
    } else {
        article.insertBefore(noteDisplay, article.firstChild);
    }

    // Attach event listeners
    const editBtn = noteDisplay.querySelector('.car-note-edit-btn');
    const addBtn = noteDisplay.querySelector('.car-note-add-btn');

    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNoteModal(carId, note, article);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNoteModal(carId, null, article);
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

    const colors = ['#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#00bcd4'];
    const currentColor = existingNote ? existingNote.color : '#ffeb3b';
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
        if (!text) {
            alert('Please enter a note');
            return;
        }

        const selectedColorBtn = modal.querySelector('.car-note-color-btn.selected');
        const color = selectedColorBtn ? selectedColorBtn.dataset.color : '#ffeb3b';

        try {
            await saveNoteToStorage(carId, text, color);
            closeModal();
            updateNoteIndicators();
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
            updateNoteIndicators();
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
    // Clear processed articles cache
    processedArticles.clear();

    // Remove old displays
    document.querySelectorAll('.car-note-display').forEach(display => {
        display.remove();
    });

    // Re-initialize
    initializeContentScript();
}

// Get note from storage
async function getNote(carId) {
    return new Promise((resolve) => {
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
