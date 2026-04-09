// Car Notes - Content Script
// Adds pencil icons and notes to car listings on mobile.de and otomoto.pl

const processedArticles = new Set();
const queriedCarIds = new Set(); // Track which car IDs we've already fetched from DB
const notesCache = {}; // Cache fetched notes to avoid re-querying on reinit
let initializeTimer = null; // Debounce timer

// Initialize
document.addEventListener('DOMContentLoaded', initializeContentScript);
window.addEventListener('load', initializeContentScript);
setTimeout(initializeContentScript, 500);

// Watch for dynamically added listings
const observer = new MutationObserver(() => {
    // Debounce: only call initializeContentScript after mutations stop for 300ms
    clearTimeout(initializeTimer);
    initializeTimer = setTimeout(initializeContentScript, 300);
});

// Global modal reference
let currentModal = null;

async function initializeContentScript() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const search = window.location.search;

    // Route to appropriate adapter
    await window.SiteRouter.route(hostname, pathname, search);

    // Start observing for dynamically added listings
    if (!observer.observerStarted) {
        observer.observe(document.body, { childList: true, subtree: true });
        observer.observerStarted = true;
    }
}

async function addNoteButton(article, carId, dbNote = null) {
    if (!article || !carId || !carId.trim()) {
        return;
    }

    // Use provided note from batch query
    // Only fallback to individual fetch if this car wasn't in a batch query
    let note = dbNote;
    if (note === null && !queriedCarIds.has(carId)) {
        // Car wasn't batch-queried yet, fetch individually
        note = await getNote(carId);
    }
    // If note is still null but carId IS in queriedCarIds, it means no note exists (don't fetch again)

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

function closeModal() {
    if (currentModal) {
        currentModal.element.remove();
        currentModal.backdrop.remove();
        currentModal = null;
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
    modal.querySelector('.car-note-modal-save-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const text = textarea.value.trim();
        const color = modal.querySelector('.car-note-color-btn.selected')?.getAttribute('data-color') || '#607D8B';

        if (!text) {
            alert('Please enter a note');
            return;
        }

        const result = await saveNote(carId, {
            text: text,
            color: color,
            createdAt: existingNote?.createdAt || new Date().toISOString()
        });

        if (result.success) {
            closeModal();

            // Remove old note displays so they get recreated with fresh data
            document.querySelector(`[data-car-id="${carId}"].car-note-display`)?.remove();
            document.querySelector(`[data-car-id="${carId}"].car-note-display-detail`)?.remove();

            // Reinitialize to show the newly saved note with updated content
            initializeContentScript();
        }
    });

    // Delete button
    const deleteBtn = modal.querySelector('.car-note-modal-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (confirm('Delete this note?')) {
                if (typeof SupabaseSync !== 'undefined') {
                    await SupabaseSync.deleteNoteFromSupabase(carId);
                }

                // Update cache - remove the note
                delete notesCache[carId];

                // Remove displays
                document.querySelector(`[data-car-id="${carId}"].car-note-display`)?.remove();
                document.querySelector(`[data-car-id="${carId}"].car-note-display-detail`)?.remove();

                closeModal();
                initializeContentScript();
            }
        });
    }
}
