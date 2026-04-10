// Car Notes - Content Script
// Adds pencil icons and notes to car listings on mobile.de and otomoto.pl

const processedArticles = new Set();
const queriedCarIds = new Set(); // Track which car IDs we've already fetched from DB
const notesCache = {}; // Cache fetched notes to avoid re-querying on reinit
let initializeTimer = null; // Debounce timer

// Initialize Supabase client immediately
(async () => {
    if (window.SupabaseClient) {
        await window.SupabaseClient.init();
    }
})();

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
    // DISABLED: No longer needed on detail pages, unified panel handles all note editing
    console.log('ℹ️ Detail page note button disabled (using unified panel instead)');
    return;
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

    // Initialize state from existing note or defaults
    const state = {
        color: existingNote?.color || '#607D8B',
        text: existingNote?.text || '',
        sort: existingNote?.sort ?? -1,
        confirmed: existingNote?.confirmed || false,
        features: existingNote?.features || {}
    };

    // Build modal HTML with header and content area (will fill with components)
    modal.innerHTML = `
        <div class="car-note-modal-header">
            <h3>Car Details - ID: ${escapeHtml(carId)}</h3>
            <button class="car-note-modal-close" title="Close">✕</button>
        </div>
        <div class="car-note-modal-content"></div>
        <div class="car-note-modal-actions">
            <button class="car-note-modal-delete-btn">🗑️ Delete</button>
            <div>
                <button class="car-note-modal-cancel-btn">Cancel</button>
                <button class="car-note-modal-save-btn">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    currentModal = { element: modal, backdrop: backdrop, carId: carId };

    const contentArea = modal.querySelector('.car-note-modal-content');

    // ===== NOTES SECTION =====
    const noteSection = document.createElement('div');
    noteSection.className = 'modal-section';
    noteSection.appendChild(window.UIComponents.createSectionLabel('NOTES'));
    noteSection.appendChild(window.UIComponents.createColorGrid(
        window.UIComponents.getColors(),
        state.color,
        (color) => {
            state.color = color;
            updateNoteTextarea();
        }
    ));
    
    const textarea = window.UIComponents.createNoteTextarea(
        state.text,
        state.color,
        (e) => {
            state.text = e.target.value;
        }
    );
    noteSection.appendChild(textarea);
    contentArea.appendChild(noteSection);

    function updateNoteTextarea() {
        textarea.style.backgroundColor = state.color;
        textarea.style.color = window.getTextColorForBackground(state.color);
    }

    // ===== RATING SECTION =====
    const ratingSection = document.createElement('div');
    ratingSection.className = 'modal-section';
    ratingSection.appendChild(window.UIComponents.createSectionLabel('RATING'));
    ratingSection.appendChild(window.UIComponents.createRatingSelect(
        state.sort,
        (sortId) => {
            state.sort = sortId;
        }
    ));
    contentArea.appendChild(ratingSection);

    // ===== VERIFICATION SECTION =====
    const verifySection = document.createElement('div');
    verifySection.className = 'modal-section';
    verifySection.appendChild(window.UIComponents.createSectionLabel('VERIFICATION STATUS'));
    verifySection.appendChild(window.UIComponents.createVerificationButton(
        state.confirmed,
        () => {
            state.confirmed = !state.confirmed;
        }
    ));
    contentArea.appendChild(verifySection);

    // ===== FEATURES SECTION =====
    const featuresSection = document.createElement('div');
    featuresSection.className = 'modal-section';
    featuresSection.appendChild(window.UIComponents.createSectionLabel('FEATURES'));
    featuresSection.appendChild(window.UIComponents.createFeaturesGrid(
        window.UIComponents.getFeaturesList(),
        state.features,
        (featureKey) => {
            state.features[featureKey] = !state.features[featureKey];
        }
    ));
    contentArea.appendChild(featuresSection);

    // ===== EVENT HANDLERS =====
    modal.querySelector('.car-note-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.car-note-modal-cancel-btn').addEventListener('click', closeModal);

    modal.querySelector('.car-note-modal-save-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!state.text.trim()) {
            alert('Please enter a note');
            return;
        }

        const noteResult = await saveNote(carId, {
            text: state.text,
            color: state.color,
            createdAt: existingNote?.createdAt || new Date().toISOString(),
            sort: state.sort,
            confirmed: state.confirmed,
            features: state.features
        });

        if (noteResult.success) {
            closeModal();
            initializeContentScript();
        } else {
            alert('Failed to save note: ' + (noteResult.error || 'Unknown error'));
        }
    });

    const deleteBtn = modal.querySelector('.car-note-modal-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (confirm('Delete this note?')) {
                if (typeof window.SupabaseApi !== 'undefined') {
                    await window.SupabaseApi.deleteCarData(carId);
                }

                delete notesCache[carId];
                document.querySelector(`[data-car-id="${carId}"].car-note-display`)?.remove();
                document.querySelector(`[data-car-id="${carId}"].car-note-display-detail`)?.remove();

                closeModal();
                initializeContentScript();
            }
        });
    }
}
