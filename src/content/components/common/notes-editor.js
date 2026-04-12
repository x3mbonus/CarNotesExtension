/**
 * Unified Notes Editor Component
 * Handles both modal dialog and side panel display modes
 * Single source of truth for note editing logic
 */

window.NotesEditor = {
    // Track pending saves to flush before closing
    pendingSaves: {},

    /**
     * Show temporary save notification
     */
    showSaveNotification(message, type = 'info', duration = 2000) {
        const notif = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' :
                       type === 'error' ? '#f44336' :
                       '#2196F3';
        const icon = type === 'success' ? '✓' :
                    type === 'error' ? '✕' :
                    '💾';

        notif.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            z-index: 100000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        notif.textContent = `${icon} ${message}`;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, duration);
    },

    /**
     * Create and show notes editor (modal or panel)
     * @param {Object} config - Configuration
     * @param {string} config.carId - Car ID to edit
     * @param {Object} config.existingNote - Existing note data (null for new)
     * @param {HTMLElement} config.article - Article element (for parsing context)
     * @param {string} config.displayMode - 'modal' or 'panel'
     * @param {HTMLElement} config.targetContainer - Container to populate (for panel mode)
     * @param {Function} config.onClose - Callback when closed
     */
    async create(config) {
        const { carId, existingNote, article, displayMode = 'modal', targetContainer, onClose } = config;

        console.log(`[NotesEditor] Creating ${displayMode} for car:`, carId);

        // Initialize pending saves tracking for this editor instance
        const editorKey = `editor_${carId}_${Date.now()}`;
        console.log('[NotesEditor] Generated editorKey:', editorKey);
        this.pendingSaves[editorKey] = {
            textSave: null,
            colorSave: null,
            saveCallbacks: []
        };

        // ===== INITIALIZE STATE =====
        let state = {
            carId: carId,
            text: existingNote?.text || '',
            color: existingNote?.color || '#e0e0e0',
            sort: existingNote?.sort ?? null,
            confirmed: existingNote?.confirmed || false,
            features: existingNote?.features || {},
            // Metadata fields
            make: existingNote?.make || '',
            model: existingNote?.model || '',
            price: existingNote?.price || '',
            price_eur: existingNote?.price_eur || '',
            mileage: existingNote?.mileage || '',
            year: existingNote?.year || '',
            seat_type: existingNote?.seat_type || '',
            climate: existingNote?.climate || '',
            owners: existingNote?.owners || '',
            tow_hitch_type: existingNote?.tow_hitch_type || ''
        };

        // Auto-populate metadata from extracted data if not already set
        if (!existingNote?.price && article) {
            try {
                const extractedData = window.extractCarData?.();
                if (extractedData && window.MetadataParser) {
                    const parsedMetadata = window.MetadataParser.extractMetadata(extractedData);
                    console.log('[NotesEditor] Auto-populated metadata from extracted data:', parsedMetadata);

                    let autoSavePromises = [];
                    // Only fill in empty fields
                    if (!state.make && parsedMetadata.make) { state.make = parsedMetadata.make; }
                    if (!state.model && parsedMetadata.model) { state.model = parsedMetadata.model; }
                    if (!state.price && parsedMetadata.price) { state.price = parsedMetadata.price; }
                    if (!state.price_eur && parsedMetadata.price_eur) { state.price_eur = parsedMetadata.price_eur; }
                    if (!state.mileage && parsedMetadata.mileage) { state.mileage = parsedMetadata.mileage; }
                    if (!state.year && parsedMetadata.year) { state.year = parsedMetadata.year; }

                    // Auto-save extracted metadata to database immediately
                    console.log('[NotesEditor] Saving auto-extracted metadata...');
                    const autoSaveData = {
                        make: state.make,
                        model: state.model,
                        price: state.price,
                        price_eur: state.price_eur,
                        mileage: state.mileage,
                        year: state.year
                    };

                    // Save all auto-extracted fields in parallel
                    for (const [fieldName, fieldValue] of Object.entries(autoSaveData)) {
                        if (fieldValue) {
                            autoSavePromises.push(
                                window.NoteCallbacks.updateMetadataField(carId, fieldName, fieldValue)
                                    .then(() => console.log('[NotesEditor] ✅ Auto-saved', fieldName, '=', fieldValue))
                                    .catch(err => console.error('[NotesEditor] ❌ Error auto-saving', fieldName, ':', err))
                            );
                        }
                    }

                    // Wait for all saves to complete (but don't block modal opening)
                    if (autoSavePromises.length > 0) {
                        Promise.all(autoSavePromises)
                            .then(() => {
                                console.log('[NotesEditor] ✅ All auto-extracted metadata saved');
                                window.NotesEditor.showSaveNotification('Auto-extracted data saved', 'success', 2000);
                            })
                            .catch(err => {
                                console.error('[NotesEditor] ❌ Error in auto-save:', err);
                                window.NotesEditor.showSaveNotification('Error auto-saving data', 'error', 3000);
                            });
                    }
                }
            } catch (error) {
                console.warn('[NotesEditor] Error auto-populating metadata:', error);
            }
        }

        // ✅ Skip re-fetching features if they're already in existingNote (avoid duplicate requests)
        const hasExistingFeatures = existingNote && Object.keys(existingNote.features || {}).length > 0;
        console.log(`[NotesEditor] hasExistingFeatures=${hasExistingFeatures}, existingNote=${!!existingNote}, features.length=${Object.keys(existingNote?.features || {}).length}`);

        if (!hasExistingFeatures) {
            // Only call initializeFeatures if we don't have features already
            try {
                console.log('[NotesEditor] Features not in existingNote, calling initializeFeatures...');
                const featureState = await window.FeaturesManager?.initializeFeatures?.(carId, article ? { frameText: article } : null);
                if (featureState?.features) {
                    state.features = featureState.features;
                    console.log(`[NotesEditor] Loaded ${Object.keys(state.features).length} features from DB`);
                }
            } catch (error) {
                console.error('[NotesEditor] Error loading features:', error);
            }
        } else {
            console.log(`[NotesEditor] Using existing features (${Object.keys(state.features).length} features)`);
        }

        // ===== CREATE UI =====
        const container = this.createUI(state, displayMode, article, targetContainer, onClose, editorKey);

        // ===== ATTACH HANDLERS =====
        this.attachHandlers(container, state, displayMode, article, onClose, editorKey);

        return container;
    },

    /**
     * Create UI structure (same for both modes)
     */
    createUI(state, displayMode, article, targetContainer, onClose, editorKey) {
        let backdrop, container, content, sections;

        if (displayMode === 'modal') {
            backdrop = document.createElement('div');
            backdrop.className = 'car-note-modal-backdrop';
            backdrop.id = 'notes-editor-backdrop';
            backdrop.dataset.editorKey = editorKey;  // Store editor key for flush on close

            container = document.createElement('div');
            container.className = 'car-note-modal';
            container.id = 'notes-editor-modal';

            backdrop.appendChild(container);
            document.body.appendChild(backdrop);

            const header = this.createHeader(state.carId, displayMode, article, onClose, editorKey);
            content = document.createElement('div');
            content.className = 'car-note-modal-content';
            container.appendChild(header);
            container.appendChild(content);

            sections = content;
        } else {
            // Panel mode - use provided target container
            if (!targetContainer) {
                console.error('[NotesEditor] Panel mode requires targetContainer');
                return null;
            }
            targetContainer.innerHTML = '';  // Clear existing content
            sections = targetContainer;
            container = targetContainer;
        }

        // ===== POPULATE SECTIONS (same for both) =====

        // NOTES section
        const noteSection = document.createElement('div');
        noteSection.className = 'modal-section';
        noteSection.style.zIndex = '10000';  // Ensure notes section stays above carousel
        noteSection.appendChild(window.UIComponents.createSectionLabel('NOTES'));

        // Add stars display that updates with rating
        const starsDisplay = document.createElement('div');
        starsDisplay.id = 'stars-display-' + Date.now();
        starsDisplay.style.cssText = 'font-size: 14px; margin-bottom: 8px; letter-spacing: 1px; min-height: 20px; font-weight: 500;';
        starsDisplay.textContent = state.sort === null || state.sort === undefined ? '' :
                                   state.sort === -1 ? '🚫 Excluded' :
                                   '⭐'.repeat(5 - state.sort);
        noteSection.appendChild(starsDisplay);

        // Store reference to update stars when rating changes
        const updateStarsDisplay = (newSort) => {
            starsDisplay.textContent = newSort === null || newSort === undefined ? '' :
                                      newSort === -1 ? '🚫 Excluded' :
                                      '⭐'.repeat(5 - newSort);
        };

        // Debounced save for color changes
        let colorSaveTimeout;
        const colorGridContainer = document.createElement('div');
        const createColorGridUI = () => {
            colorGridContainer.innerHTML = '';
            colorGridContainer.appendChild(window.UIComponents.createColorGrid(
                window.UIComponents.getColors(),
                state.color,
                async (color, colorIndex) => {
                    // Color selection mapping to sort values:
                    // Index 0 (gray) → sort null (no rating)
                    // Index 1-5 (colors) → sort 0-3 and -1 (excluded) for rating
                    // Index 6+ (optional) → sort null (no rating)
                    const colorToSortMap = {
                        0: null,     // No rating (gray)
                        1: 0,        // 5 stars (dark green)
                        2: 1,        // 4 stars (green)
                        3: 2,        // 3 stars (yellow)
                        4: 3,        // 2 stars (orange)
                        5: -1        // Excluded (red)
                    };

                    const newSort = colorToSortMap[colorIndex] !== undefined ? colorToSortMap[colorIndex] : null;

                    state.color = color;
                    state.sort = newSort;

                    // Update display
                    updateNoteTextarea();
                    updateStarsDisplay(newSort);

                    // Re-render color grid to show new selection
                    createColorGridUI();

                    // Save BOTH color and sort in SINGLE request (synchronized)
                    clearTimeout(colorSaveTimeout);
                    window.NotesEditor.showSaveNotification('Saving rating...', 'info', 3000);
                    colorSaveTimeout = setTimeout(async () => {
                        try {
                            const savePromise = window.NoteCallbacks.upsertNoteWithSort(state.carId, {
                                text: state.text,
                                color: state.color,
                                sort: state.sort
                            });
                            // Track this save so it can be flushed if modal closes quickly
                            if (window.NotesEditor.pendingSaves[editorKey]) {
                                console.log('[NotesEditor] Registering color save promise for editor:', editorKey);
                                window.NotesEditor.pendingSaves[editorKey].colorSave = savePromise;
                            }
                            await savePromise;
                            window.NotesEditor.showSaveNotification('Rating saved', 'success', 2000);
                        } catch (error) {
                            console.error('[NotesEditor] Error saving rating:', error);
                            window.NotesEditor.showSaveNotification('Failed to save rating', 'error', 3000);
                        }
                    }, 800);
                }
            ));
        };
        createColorGridUI();
        noteSection.appendChild(colorGridContainer);

        // Debounced save for textarea
        let textSaveTimeout;
        const textarea = window.UIComponents.createNoteTextarea(
            state.text,
            state.color,
            (e) => {
                state.text = e.target.value;
                // Debounced auto-save (800ms delay)
                clearTimeout(textSaveTimeout);
                window.NotesEditor.showSaveNotification('Saving note...', 'info', 3000);
                textSaveTimeout = setTimeout(async () => {
                    try {
                        const savePromise = window.NoteCallbacks.upsertNote(state.carId, { text: state.text, color: state.color });
                        // Track this save so it can be flushed if modal closes quickly
                        if (window.NotesEditor.pendingSaves[editorKey]) {
                            console.log('[NotesEditor] Registering text save promise for editor:', editorKey);
                            window.NotesEditor.pendingSaves[editorKey].textSave = savePromise;
                        }
                        await savePromise;
                        window.NotesEditor.showSaveNotification('Note saved', 'success', 2000);
                    } catch (error) {
                        console.error('[NotesEditor] Error saving note:', error);
                        window.NotesEditor.showSaveNotification('Failed to save note', 'error', 3000);
                    }
                }, 800);
            }
        );
        noteSection.appendChild(textarea);

        function updateNoteTextarea() {
            textarea.style.backgroundColor = state.color;
            textarea.style.color = window.getTextColorForBackground(state.color);
        }

        sections.appendChild(noteSection);

        // VERIFICATION section
        const verifySection = document.createElement('div');
        verifySection.className = 'modal-section';
        verifySection.appendChild(window.UIComponents.createSectionLabel('VERIFICATION STATUS'));

        let verifyBtn = window.UIComponents.createVerificationButton(
            state.confirmed,
            async () => {
                state.confirmed = !state.confirmed;
                console.log('[NotesEditor] Toggling verified to:', state.confirmed);
                window.NotesEditor.showSaveNotification('Saving verification...', 'info', 3000);
                try {
                    // Save ONLY the verified status to database (independent operation)
                    await window.NoteCallbacks.updateVerified(state.carId, state.confirmed);
                    // Update button UI
                    verifyBtn.textContent = state.confirmed ? '✓ Verified' : '○ Not Verified';
                    if (state.confirmed) {
                        verifyBtn.setAttribute('data-verified', 'true');
                    } else {
                        verifyBtn.removeAttribute('data-verified');
                    }
                    window.NotesEditor.showSaveNotification('Verification saved', 'success', 2000);
                } catch (error) {
                    console.error('[NotesEditor] Error updating verified:', error);
                    window.NotesEditor.showSaveNotification('Failed to save verification', 'error', 3000);
                }
            }
        );
        verifySection.appendChild(verifyBtn);
        sections.appendChild(verifySection);

        // METADATA section
        const metadataSection = document.createElement('div');
        metadataSection.className = 'modal-section';
        metadataSection.appendChild(window.UIComponents.createMetadataSection(
            state,
            (updatedMeta) => {
                Object.assign(state, updatedMeta);
                window.NotesEditor.showSaveNotification('Saving metadata...', 'info', 3000);
                // Save each metadata field independently
                Object.entries(updatedMeta).forEach(async ([fieldName, fieldValue]) => {
                    try {
                        await window.NoteCallbacks.updateMetadataField(state.carId, fieldName, fieldValue);
                        // Show success for the first field updated
                        window.NotesEditor.showSaveNotification('Metadata saved', 'success', 2000);
                    } catch (error) {
                        console.error('[NotesEditor] Error updating metadata:', error);
                        window.NotesEditor.showSaveNotification('Failed to save metadata', 'error', 3000);
                    }
                });
            }
        ));
        sections.appendChild(metadataSection);

        // FEATURES section
        const featuresSection = document.createElement('div');
        featuresSection.className = 'modal-section';
        const featuresLabel = window.UIComponents.createSectionLabel('FEATURES');
        featuresSection.appendChild(featuresLabel);

        // Add reparse button (disabled in modal, enabled in panel)
        if (displayMode === 'panel' && article) {
            const reparseBtn = document.createElement('button');
            reparseBtn.textContent = '↻ Re-parse';
            reparseBtn.style.cssText = `
                margin-left: 8px;
                padding: 4px 8px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                pointer-events: auto;
                position: relative;
                z-index: 10002;
            `;
            reparseBtn.onclick = async (e) => {
                console.log('[NotesEditor] Re-parse button clicked!');
                e.preventDefault();
                e.stopPropagation();

                // Ask for confirmation before re-parsing
                const confirmMessage = 'Re-parse will update features from the page.\n\nManually marked features will be preserved.\nFeatures not found on page will be reset to unknown (?).\n\nContinue?';
                if (!confirm(confirmMessage)) {
                    console.log('[NotesEditor] Re-parse cancelled by user');
                    return;
                }

                console.log('[NotesEditor] Re-parsing features from page...');
                const extracted = window.extractCarData?.();
                console.log('[NotesEditor] Extracted features array:', extracted?.features);
                if (extracted?.features && Array.isArray(extracted.features)) {
                    // Convert extracted array to object format: { feature_key: true }
                    const newFeatures = { ...state.features }; // Keep existing features
                    const configList = window.UIComponents?.getFeaturesList?.() || [];

                    // Create a mapping of various names to feature keys for better matching
                    const featureAliases = {
                        'camera': ['Камера', 'камера', 'camera', 'Camera'],
                        'feature_acc': ['ACC', 'acc', 'Adaptive Cruise Control'],
                        'feature_android_auto_carplay': ['Android Auto', 'CarPlay', 'Android', 'Apple CarPlay'],
                        'feature_parking_sensors': ['Парктроніки', 'парктроніки', 'Parking sensors', 'Parking'],
                        'feature_blind_spot': ['Blind spot', 'blind spot monitor', 'BSM'],
                        'feature_lane_assist': ['Lane assist', 'lane keeping', 'Lane keeping assist'],
                        'feature_signs': ['Знаки', 'знаки', 'sign recognition'],
                        'feature_rear_traffic_alert': ['Rear traffic alert', 'traffic alert'],
                        'feature_traffic_jam_assist': ['Traffic Jam Assist', 'traffic jam'],
                        'feature_keyless': ['Keyless', 'keyless entry', 'Безключевой доступ'],
                        'feature_digital_cockpit': ['Digital cockpit', 'Virtual cockpit', 'cockpit'],
                        'feature_heated_seats': ['Підігрів сидінь', 'підігрів сидінь', 'heated seats', 'Heated seats'],
                        'feature_heated_windshield': ['Підігрів лобового', 'heated windshield'],
                        'feature_heated_steering_wheel': ['Підігрів керма', 'heated steering wheel'],
                        'feature_massage_seats': ['Масаж', 'масаж', 'massage seats'],
                        'feature_memory_seats': ['Пам\'ять сидінь', 'memory seats'],
                        'feature_dcc': ['DCC', 'Dynamic Chassis Control'],
                        'feature_webasto': ['Webasto', 'webasto'],
                        'feature_matrix_headlights': ['Matrix', 'Matrix lights', 'matrix headlights'],
                        'feature_auto_parking': ['Автопаркування', 'auto parking', 'automatic parking'],
                        'feature_360_camera': ['360 камера', '360 camera', '360°'],
                        'feature_tow_hitch': ['Фаркоп', 'фаркоп', 'Tow hitch', 'tow hook'],
                        'feature_electric_tailgate': ['Електробагажник', 'electric tailgate'],
                        'feature_auto_tailgate': ['Автобагажник', 'auto tailgate'],
                        'feature_panoramic_roof': ['Панорама', 'panoramic roof', 'panorama'],
                        'feature_hud': ['HUD', 'Head-up display']
                    };

                    // Mark extracted features as present
                    extracted.features.forEach(extractedName => {
                        console.log('[NotesEditor] Trying to match extracted feature:', extractedName);
                        const lowerExtracted = extractedName.toLowerCase();

                        // Try to find matching feature using aliases
                        let matched = false;
                        for (const [featureKey, aliases] of Object.entries(featureAliases)) {
                            for (const alias of aliases) {
                                if (lowerExtracted === alias.toLowerCase() ||
                                    lowerExtracted.includes(alias.toLowerCase()) ||
                                    alias.toLowerCase().includes(lowerExtracted)) {
                                    // Find the config feature
                                    const matchingConfigFeature = configList.find(f =>
                                        f.label.toLowerCase() === alias.toLowerCase() ||
                                        f.key === featureKey
                                    );
                                    if (matchingConfigFeature) {
                                        newFeatures[matchingConfigFeature.key] = true;
                                        console.log('[NotesEditor] ✅ Matched', extractedName, '→', matchingConfigFeature.label);
                                        matched = true;
                                        break;
                                    }
                                }
                            }
                            if (matched) break;
                        }

                        if (!matched) {
                            console.log('[NotesEditor] ⚠️ Could not match extracted feature:', extractedName);
                        }
                    });

                    state.features = newFeatures;
                    console.log('[NotesEditor] Updated state features:', Object.keys(newFeatures).filter(k => newFeatures[k] === true).length, 'marked as present');
                    updateFeaturesGrid();
                    console.log('[NotesEditor] Features grid updated');
                    window.NotesEditor.showSaveNotification('Features re-parsed', 'success', 2000);
                }
            };
            featuresLabel.appendChild(reparseBtn);

            // Add Clear & Re-parse All button
            const clearReparseBtn = document.createElement('button');
            clearReparseBtn.textContent = '◄► Clear & Re-parse All';
            clearReparseBtn.title = 'Clear all metadata and features, then re-parse fresh from page';
            clearReparseBtn.style.cssText = `
                margin-left: 8px;
                padding: 4px 8px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                pointer-events: auto;
                position: relative;
                z-index: 10002;
            `;
            clearReparseBtn.onclick = async (e) => {
                console.log('[NotesEditor] Clear & Re-parse All button clicked!');
                e.preventDefault();
                e.stopPropagation();

                // Ask for confirmation before clearing and re-parsing
                const confirmMessage = 'CLEAR & RE-PARSE ALL\n\nThis will:\n• Clear all metadata (price, mileage, year, etc.)\n• Clear all feature selections\n• Re-extract everything fresh from the page\n\nAll manual edits will be LOST!\n\nContinue?';
                if (!confirm(confirmMessage)) {
                    console.log('[NotesEditor] Clear & Re-parse All cancelled by user');
                    return;
                }

                console.log('[NotesEditor] Clearing all data and re-parsing from page...');

                try {
                    // Reset all metadata to empty
                    state.make = '';
                    state.model = '';
                    state.price = '';
                    state.price_eur = '';
                    state.mileage = '';
                    state.year = '';
                    state.seat_type = '';
                    state.climate = '';
                    state.owners = '';
                    state.tow_hitch_type = '';

                    // Reset all features to unknown
                    const configList = window.UIComponents?.getFeaturesList?.() || [];
                    state.features = {};
                    configList.forEach(feature => {
                        state.features[feature.key] = '?'; // Reset to unknown
                    });

                    // Extract fresh data from page
                    const extracted = window.extractCarData?.();
                    console.log('[NotesEditor] Extracted fresh data:', extracted);

                    if (extracted) {
                        // Parse metadata
                        if (window.MetadataParser) {
                            const parsedMetadata = window.MetadataParser.extractMetadata(extracted);
                            console.log('[NotesEditor] Parsed metadata:', parsedMetadata);
                            state.make = parsedMetadata.make || '';
                            state.model = parsedMetadata.model || '';
                            state.price = parsedMetadata.price || '';
                            state.price_eur = parsedMetadata.price_eur || '';
                            state.mileage = parsedMetadata.mileage || '';
                            state.year = parsedMetadata.year || '';
                        }

                        // Parse features
                        if (extracted.features && Array.isArray(extracted.features)) {
                            console.log('[NotesEditor] Parsing', extracted.features.length, 'extracted features');
                            const featureAliases = {
                                'camera': ['Камера', 'камера', 'camera', 'Camera'],
                                'feature_acc': ['ACC', 'acc', 'Adaptive Cruise Control'],
                                'feature_android_auto_carplay': ['Android Auto', 'CarPlay', 'Android', 'Apple CarPlay'],
                                'feature_parking_sensors': ['Парктроніки', 'парктроніки', 'Parking sensors', 'Parking'],
                                'feature_blind_spot': ['Blind spot', 'blind spot monitor', 'BSM'],
                                'feature_lane_assist': ['Lane assist', 'lane keeping', 'Lane keeping assist'],
                                'feature_signs': ['Знаки', 'знаки', 'sign recognition'],
                                'feature_rear_traffic_alert': ['Rear traffic alert', 'traffic alert'],
                                'feature_traffic_jam_assist': ['Traffic Jam Assist', 'traffic jam'],
                                'feature_keyless': ['Keyless', 'keyless entry', 'Безключевой доступ'],
                                'feature_digital_cockpit': ['Digital cockpit', 'Virtual cockpit', 'cockpit'],
                                'feature_heated_seats': ['Підігрів сидінь', 'підігрів сидінь', 'heated seats', 'Heated seats'],
                                'feature_heated_windshield': ['Підігрів лобового', 'heated windshield'],
                                'feature_heated_steering_wheel': ['Підігрів керма', 'heated steering wheel'],
                                'feature_massage_seats': ['Масаж', 'масаж', 'massage seats'],
                                'feature_memory_seats': ['Пам\'ять сидінь', 'memory seats'],
                                'feature_dcc': ['DCC', 'Dynamic Chassis Control'],
                                'feature_webasto': ['Webasto', 'webasto'],
                                'feature_matrix_headlights': ['Matrix', 'Matrix lights', 'matrix headlights'],
                                'feature_auto_parking': ['Автопаркування', 'auto parking', 'automatic parking'],
                                'feature_360_camera': ['360 камера', '360 camera', '360°'],
                                'feature_tow_hitch': ['Фаркоп', 'фаркоп', 'Tow hitch', 'tow hook'],
                                'feature_electric_tailgate': ['Електробагажник', 'electric tailgate'],
                                'feature_auto_tailgate': ['Автобагажник', 'auto tailgate'],
                                'feature_panoramic_roof': ['Панорама', 'panoramic roof', 'panorama'],
                                'feature_hud': ['HUD', 'Head-up display']
                            };

                            extracted.features.forEach(extractedName => {
                                const lowerExtracted = extractedName.toLowerCase();
                                let matched = false;

                                for (const [featureKey, aliases] of Object.entries(featureAliases)) {
                                    for (const alias of aliases) {
                                        if (lowerExtracted === alias.toLowerCase() ||
                                            lowerExtracted.includes(alias.toLowerCase()) ||
                                            alias.toLowerCase().includes(lowerExtracted)) {
                                            const matchingConfigFeature = configList.find(f =>
                                                f.label.toLowerCase() === alias.toLowerCase() ||
                                                f.key === featureKey
                                            );
                                            if (matchingConfigFeature) {
                                                state.features[matchingConfigFeature.key] = true;
                                                console.log('[NotesEditor] ✅ Matched', extractedName, '→', matchingConfigFeature.label);
                                                matched = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (matched) break;
                                }

                                if (!matched) {
                                    console.log('[NotesEditor] ⚠️ Could not match extracted feature:', extractedName);
                                }
                            });
                        }
                    }

                    // Save all metadata to database
                    console.log('[NotesEditor] Saving all metadata to database...');
                    const metadataFields = ['make', 'model', 'price', 'price_eur', 'mileage', 'year', 'seat_type', 'climate', 'owners', 'tow_hitch_type'];
                    const savePromises = metadataFields.map(field =>
                        window.NoteCallbacks.updateMetadataField(state.carId, field, state[field])
                            .then(() => console.log('[NotesEditor] ✅ Saved', field))
                            .catch(err => console.error('[NotesEditor] ❌ Error saving', field, ':', err))
                    );

                    // Save features to database
                    console.log('[NotesEditor] Saving all features to database...');
                    savePromises.push(
                        window.NoteCallbacks.updateNote(state.carId, { features: state.features })
                            .then(() => console.log('[NotesEditor] ✅ Saved features'))
                            .catch(err => console.error('[NotesEditor] ❌ Error saving features:', err))
                    );

                    // Wait for all saves
                    await Promise.all(savePromises);

                    // Update UI
                    updateFeaturesGrid();

                    // Reconstruct metadata section to reflect cleared/refreshed data
                    metadataSection.innerHTML = '';
                    metadataSection.appendChild(window.UIComponents.createMetadataSection(
                        state,
                        (updatedMeta) => {
                            Object.assign(state, updatedMeta);
                            window.NotesEditor.showSaveNotification('Saving metadata...', 'info', 3000);
                            Object.entries(updatedMeta).forEach(async ([fieldName, fieldValue]) => {
                                try {
                                    await window.NoteCallbacks.updateMetadataField(state.carId, fieldName, fieldValue);
                                    window.NotesEditor.showSaveNotification('Metadata saved', 'success', 2000);
                                } catch (error) {
                                    console.error('[NotesEditor] Error updating metadata:', error);
                                    window.NotesEditor.showSaveNotification('Failed to save metadata', 'error', 3000);
                                }
                            });
                        }
                    ));

                    console.log('[NotesEditor] ✅ Clear & Re-parse All completed successfully');
                    window.NotesEditor.showSaveNotification('Data cleared and re-parsed from page!', 'success', 3000);
                } catch (error) {
                    console.error('[NotesEditor] Error during Clear & Re-parse All:', error);
                    window.NotesEditor.showSaveNotification('Error clearing and re-parsing data', 'error', 3000);
                }
            };
            featuresLabel.appendChild(clearReparseBtn);
        } else if (displayMode === 'modal') {
            // Disabled reparse in modal (no article data available)
            const reparseBtn = document.createElement('button');
            reparseBtn.textContent = '↻ Re-parse (N/A in list)';
            reparseBtn.disabled = true;
            reparseBtn.style.cssText = `
                margin-left: 8px;
                padding: 4px 8px;
                background: #ccc;
                color: #666;
                border: none;
                border-radius: 3px;
                cursor: not-allowed;
                font-size: 11px;
            `;
            featuresLabel.appendChild(reparseBtn);
        }

        featuresSection.appendChild(window.UIComponents.createFeaturesGrid(
            window.UIComponents.getFeaturesList(),
            state.features,
            async (featureKey) => {
                const nextState = window.NoteCallbacks.toggleFeatureState(state.features[featureKey]);
                state.features[featureKey] = nextState;
                // Save ONLY this single feature to database (independent operation)
                await window.NoteCallbacks.updateFeature(state.carId, featureKey, nextState);
                // Refresh the grid to show the new state
                updateFeaturesGrid();
            }
        ));
        sections.appendChild(featuresSection);

        // DELETE BUTTON - at the very bottom (hidden by default, visible on hover)
        const deleteSection = document.createElement('div');
        deleteSection.className = 'modal-section';
        deleteSection.style.cssText = 'margin-top: auto; padding-top: 8px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'car-note-modal-delete-btn visible';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete this note';
        deleteBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Delete this note?')) {
                await window.NoteCallbacks.deleteCarData(state.carId);
                this.close(displayMode);
                // Trigger refresh callback after deletion
                if (typeof onClose === 'function') {
                    await onClose();
                }
            }
        };
        deleteSection.appendChild(deleteBtn);
        sections.appendChild(deleteSection);

        function updateFeaturesGrid() {
            // Rebuild features grid with new state
            const gridContainer = featuresSection.querySelector('.ui-features-grid');
            if (gridContainer) {
                gridContainer.remove();
            }
            featuresSection.appendChild(window.UIComponents.createFeaturesGrid(
                window.UIComponents.getFeaturesList(),
                state.features,
                async (featureKey) => {
                    const nextState = window.NoteCallbacks.toggleFeatureState(state.features[featureKey]);
                    state.features[featureKey] = nextState;
                    // Save ONLY this single feature to database (independent operation)
                    await window.NoteCallbacks.updateFeature(state.carId, featureKey, nextState);
                    // Refresh the grid to show the new state
                    updateFeaturesGrid();
                }
            ));
        }

        return displayMode === 'modal' ? document.getElementById('notes-editor-backdrop') : container;
    },

    /**
     * Create header for modal (close button only, delete moved to footer)
     */
    createHeader(carId, displayMode, article, onClose, editorKey) {
        const header = document.createElement('div');
        header.className = 'car-note-modal-header';
        header.innerHTML = `<h3>Car Details - ID: ${window.escapeHtml(carId)}</h3>`;

        // Close button (top right)
        const closeBtn = document.createElement('button');
        closeBtn.className = 'car-note-modal-close';
        closeBtn.textContent = '✕';
        closeBtn.title = 'Close';
        closeBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.close(displayMode, editorKey);
            // Trigger refresh callback
            if (typeof onClose === 'function') {
                await onClose();
            }
        };
        header.appendChild(closeBtn);

        return header;
    },

    /**
     * Attach event handlers
     */
    attachHandlers(container, state, displayMode, article, onClose, editorKey) {
        if (displayMode === 'modal') {
            const backdrop = container;
            backdrop.addEventListener('click', async (e) => {
                console.log('[NotesEditor] Backdrop click detected, e.target===backdrop?', e.target === backdrop);
                if (e.target === backdrop) {
                    console.log('[NotesEditor] Backdrop click confirmed - closing with flush');
                    await this.close(displayMode, editorKey);
                    onClose?.();
                }
            });
        }
    },

    /**
     * Flush any pending saves before closing
     */
    async flushPendingSaves(editorKey) {
        console.log('[NotesEditor.flushPendingSaves] Called for editorKey:', editorKey);
        if (!editorKey || !this.pendingSaves[editorKey]) {
            console.log('[NotesEditor.flushPendingSaves] No pending saves data found');
            return;
        }

        const pending = this.pendingSaves[editorKey];
        console.log('[NotesEditor.flushPendingSaves] Pending saves:', {
            hasTextSave: !!pending.textSave,
            hasColorSave: !!pending.colorSave
        });

        const promises = [];

        if (pending.textSave) {
            console.log('[NotesEditor] Flushing pending text save...');
            promises.push(Promise.resolve(pending.textSave));
        }

        if (pending.colorSave) {
            console.log('[NotesEditor] Flushing pending color save...');
            promises.push(Promise.resolve(pending.colorSave));
        }

        if (promises.length > 0) {
            try {
                this.showSaveNotification('Saving pending changes...', 'info', 3000);
                await Promise.all(promises);
                console.log('[NotesEditor] ✅ All pending saves flushed before close');
                this.showSaveNotification('All changes saved', 'success', 2000);
            } catch (error) {
                console.error('[NotesEditor] Error flushing saves:', error);
                this.showSaveNotification('Error saving changes', 'error', 3000);
            }
        } else {
            console.log('[NotesEditor] No promises to flush');
        }

        // Clean up
        delete this.pendingSaves[editorKey];
    },

    /**
     * Close editor
     */
    async close(displayMode, editorKey) {
        console.log('[NotesEditor.close] Called with displayMode:', displayMode, 'editorKey:', editorKey);

        // Flush any pending saves before closing (up to 2 seconds max)
        if (editorKey) {
            const flushPromise = this.flushPendingSaves(editorKey);
            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => {
                    console.warn('[NotesEditor] Save flush timeout - closing anyway');
                    resolve();
                }, 2000)
            );
            await Promise.race([flushPromise, timeoutPromise]);
        } else {
            console.warn('[NotesEditor.close] No editorKey provided, skipping flush');
        }

        if (displayMode === 'modal') {
            const backdrop = document.getElementById('notes-editor-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
        // Panel: just hide or leave persistent
    }
};
