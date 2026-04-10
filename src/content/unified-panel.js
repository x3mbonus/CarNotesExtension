// Car Detail Panel - Combines notes + features + export in one panel

window.CarDetailPanel = {
    currentCarId: null,
    currentFeatures: null,
    isVerified: false,
    currentSort: -1,  // -1 = excluded, 0-3 = sort levels
    currentNote: '',
    currentColor: '#FFEB3B',
    panelElement: null,
    isExpanded: true,
    isInitializing: false,  // Prevent duplicate initialization
    noteSaveTimeout: null,  // Persistent timeout for note debouncing

    /**
     * Show unified panel with all car data
     */
    async showPanel(carId, data) {
        console.log('🔍 CarDetailPanel.showPanel called with carId:', carId);

        // Prevent duplicate initialization of same car
        if (this.currentCarId === carId && this.panelElement) {
            console.log('⊙ Panel already shown for this car, skipping duplicate initialization');
            return;
        }

        // Prevent concurrent initialization
        if (this.isInitializing) {
            console.log('⏳ Panel initialization already in progress, skipping duplicate call');
            return;
        }

        this.isInitializing = true;

        this.currentCarId = carId;

        if (!this.panelElement) {
            this.createPanel();
            console.log('✅ Panel created');
        }

        // Load or initialize features
        console.log('[CarDetailPanel] FeaturesManager exists?', !!window.FeaturesManager);
        try {
            console.log('[CarDetailPanel] Calling initializeFeatures...');
            const featureState = await window.FeaturesManager?.initializeFeatures?.(carId, data);
            console.log('[CarDetailPanel] initializeFeatures returned:', featureState);
            this.currentFeatures = featureState?.features || {};
            this.isVerified = featureState?.confirmed || false;
            this.currentSort = featureState?.sort ?? null;  // null = no rating, not -1

            // If features were parsed (not from DB), save them automatically
            if (!featureState?.isFromDb && featureState?.featuresSource === 'parsed') {
                console.log('[CarDetailPanel] Auto-saving parsed features on first open...');
                await window.FeaturesManager?.confirmAllFeatures?.(carId, this.currentFeatures, this.currentSort, false);
                console.log('[CarDetailPanel] Parsed features auto-saved');
            }

            // If verified and sort is set, update note color to match sort level
            if (this.currentSort !== null && this.currentSort !== -1 && this.isVerified) {
                this.updateNoteColorBySort(this.currentSort);
            }
            console.log('✅ Features loaded:', Object.keys(this.currentFeatures).length, 'features');
        } catch (error) {
            console.error('❌ Error loading features:', error);
            this.currentFeatures = {};
        }

        // Load note
        console.log('[CarDetailPanel] Calling getNote...');
        try {
            const notePromise = window.getNote?.(carId);
            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => resolve(null), 2000) // 2 second timeout
            );
            const noteData = notePromise ? await Promise.race([notePromise, timeoutPromise]) : null;
            console.log('[CarDetailPanel] getNote returned:', noteData);
            if (noteData) {
                this.currentNote = noteData.text || '';
                this.currentColor = noteData.color || '#FFEB3B';
                console.log('✅ Note loaded');
            }
        } catch (error) {
            console.error('❌ Error loading note:', error);
        }

        console.log('📝 Updating panel content...');
        this.updateNoteSection();
        this.updateSortSection();
        this.updateVerifiedSection();
        this.updateFeaturesSection();
        this.updateExportSection();

        this.isInitializing = false;
    },

    /**
     * Create the unified panel structure
     */
    createPanel() {
        // Container wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'car-notes-unified-panel-wrapper';
        wrapper.style.cssText = `
            position: fixed;
            top: 80px;
            right: 0;
            height: calc(100vh - 80px);
            z-index: 9998;
            max-width: 500px;
            width: 100%;
            transition: transform 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        `;

        // Main panel
        const panel = document.createElement('div');
        panel.id = 'car-notes-unified-panel';
        panel.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            border-left: 3px solid #667eea;
            overflow: hidden;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            flex: 1;
        `;
        title.textContent = '📋 Car Details';
        header.appendChild(title);

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'unified-panel-refresh';
        refreshBtn.textContent = '🔄';
        refreshBtn.title = 'Refresh data';
        refreshBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
        `;
        refreshBtn.onmouseover = () => refreshBtn.style.background = 'rgba(255,255,255,0.3)';
        refreshBtn.onmouseout = () => refreshBtn.style.background = 'rgba(255,255,255,0.2)';
        refreshBtn.onclick = async () => {
            console.log('[CarDetailPanel] Refreshing...');
            await this.showPanel(this.currentCarId);
        };
        header.appendChild(refreshBtn);

        // Collapse button
        const collapseBtn = document.createElement('button');
        collapseBtn.id = 'unified-panel-collapse';
        collapseBtn.textContent = '→';
        collapseBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
        `;
        collapseBtn.onmouseover = () => collapseBtn.style.background = 'rgba(255,255,255,0.3)';
        collapseBtn.onmouseout = () => collapseBtn.style.background = 'rgba(255,255,255,0.2)';
        collapseBtn.onclick = () => this.togglePanel();
        header.appendChild(collapseBtn);

        panel.appendChild(header);

        // Scrollable content
        const content = document.createElement('div');
        content.id = 'unified-panel-content';
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 0;
        `;

        // Section 1: Note (moved before features)
        const noteSection = document.createElement('div');
        noteSection.id = 'unified-note-section';
        noteSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(noteSection);

        // Section 2: Sort/Rating
        const sortSection = document.createElement('div');
        sortSection.id = 'unified-sort-section';
        sortSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(sortSection);

        // Section 3: Verified Status
        const verifiedSection = document.createElement('div');
        verifiedSection.id = 'unified-verified-section';
        verifiedSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(verifiedSection);

        // Section 4: Features
        const featuresSection = document.createElement('div');
        featuresSection.id = 'unified-features-section';
        featuresSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(featuresSection);

        // Section 5: Export Buttons
        const exportSection = document.createElement('div');
        exportSection.id = 'unified-export-section';
        exportSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(exportSection);

        panel.appendChild(content);
        wrapper.appendChild(panel);
        document.body.appendChild(wrapper);

        this.panelElement = panel;
        this.wrapperElement = wrapper;
        console.log('✅ Panel structure created and appended to DOM');
    },

    /**
     * Update panel content
     */
    async updatePanelContent() {
        console.log('[UnifiedPanel] updatePanelContent called, panelElement exists?', !!this.panelElement);
        if (!this.panelElement) {
            console.warn('[UnifiedPanel] ⚠️ panelElement is null/undefined, cannot update content');
            return;
        }

        try {
            // 1. Verified section
            this.updateVerifiedSection();

            // 2. Sort section
            this.updateSortSection();

            // 3. Note section
            this.updateNoteSection();

            // 4. Features section
            this.updateFeaturesSection();

            // 5. Export section
            this.updateExportSection();
        } catch (error) {
            console.error('❌ Error updating panel content:', error);
        }
    },

    /**
     * Update verified status section
     */
    updateVerifiedSection() {
        const section = document.getElementById('unified-verified-section');
        if (!section) {
            console.warn('⚠️ Verified section not found');
            return;
        }

        section.innerHTML = '';
        section.appendChild(window.UIComponents.createSectionLabel('VERIFICATION STATUS'));

        const btn = window.UIComponents.createVerificationButton(this.isVerified, async () => {
            this.isVerified = !this.isVerified;
            console.log('🔄 Toggling verified status to:', this.isVerified);
            await window.FeaturesManager?.confirmAllFeatures?.(
                this.currentCarId,
                this.currentFeatures,
                this.currentSort,
                this.isVerified
            );
            this.updateVerifiedSection();
        });

        section.appendChild(btn);
        console.log('✅ Verified section updated');
    },

    /**
     * Update sort section
     */
    updateSortSection() {
        const section = document.getElementById('unified-sort-section');
        if (!section) {
            console.warn('⚠️ Sort section not found');
            return;
        }

        section.innerHTML = '';
        section.appendChild(window.UIComponents.createSectionLabel('RATING'));

        const sortColors = {
            0: '#2E7D32',    // Best - bright green
            1: '#CDDC39',    // Good - yellow-green
            2: '#FDD835',    // Fair - yellow
            3: '#FF7043',    // Poor - orange-red
            '-1': '#F44336'  // Excluded - red
        };

        const select = window.UIComponents.createRatingSelect(this.currentSort, async (sortId) => {
            console.log(`[CarDetailPanel] Rating changed to: ${sortId}`);
            this.currentSort = sortId !== null ? sortId : null;  // Keep null as null, not -1

            // Update note color to match rating
            if (sortId !== null && sortColors[sortId]) {
                this.currentColor = sortColors[sortId];
                await window.saveNote(this.currentCarId, {
                    text: this.currentNote,
                    color: this.currentColor
                });
            }

            console.log(`[CarDetailPanel] Saving rating: carId=${this.currentCarId}, sort=${this.currentSort}`);
            const result = await window.FeaturesManager.confirmAllFeatures(
                this.currentCarId,
                this.currentFeatures,
                this.currentSort,
                this.isVerified
            );
            console.log(`[CarDetailPanel] Rating saved:`, result);

            this.updateSortSection();
            this.updateFeaturesSection();
            this.updateNoteSection();
        });

        section.appendChild(select);
        console.log('✅ Rating dropdown updated');
    },

    /**
     * Update note color based on sort level
     */
    updateNoteColorBySort(sortId) {
        const sortColors = {
            0: '#2E7D32',  // Best - bright green
            1: '#CDDC39',  // Good - yellow-green
            2: '#FDD835',  // Fair - yellow
            3: '#FF7043',  // Poor - orange-red
            '-1': '#F44336'   // Excluded - red
        };

        if (sortColors[sortId]) {
            this.currentColor = sortColors[sortId];
        }
    },

    /**
     * Update note section
     */
    updateNoteSection() {
        const section = document.getElementById('unified-note-section');
        if (!section) {
            console.warn('⚠️ Note section not found');
            return;
        }

        section.innerHTML = '';
        section.appendChild(window.UIComponents.createSectionLabel('NOTES'));

        // Color grid with immediate save on color change
        const colorGrid = window.UIComponents.createColorGrid(
            window.UIComponents.getColors(),
            this.currentColor,
            async (color) => {
                this.currentColor = color;
                console.log('[CarDetailPanel] Color changed to:', color);
                // Save color immediately with current note
                await window.saveNote(this.currentCarId, {
                    text: this.currentNote,
                    color: this.currentColor
                });
                this.updateNoteSection();
            }
        );
        section.appendChild(colorGrid);

        // Textarea with debounced save
        const textarea = window.UIComponents.createNoteTextarea(
            this.currentNote,
            this.currentColor,
            () => {}
        );

        textarea.oninput = () => {
            console.log('[CarDetailPanel] Note input changed');
            this.currentNote = textarea.value;

            // Update textarea text color in real-time
            const textColor = window.getTextColorForBackground(this.currentColor);
            textarea.style.color = textColor;

            // Debounced save
            clearTimeout(this.noteSaveTimeout);
            this.noteSaveTimeout = setTimeout(() => {
                console.log('[CarDetailPanel] Saving note after 500ms debounce...');
                window.saveNote?.(this.currentCarId, {
                    text: this.currentNote,
                    color: this.currentColor
                }).then(() => {
                    console.log('[CarDetailPanel] Note saved successfully');
                }).catch((error) => {
                    console.error('[CarDetailPanel] Error saving note:', error);
                });
            }, 500);
        };

        section.appendChild(textarea);
        console.log('✅ Note section updated');
    },

    /**
     * Update features section
     */
    updateFeaturesSection() {
        const section = document.getElementById('unified-features-section');
        if (!section) {
            console.warn('⚠️ Features section not found');
            return;
        }

        console.log('[updateFeaturesSection] Starting, currentFeatures has', Object.keys(this.currentFeatures || {}).length, 'features');

        section.innerHTML = '';
        section.appendChild(window.UIComponents.createSectionLabel('FEATURES'));

        // Defensive: ensure currentFeatures is initialized
        if (!this.currentFeatures || Object.keys(this.currentFeatures).length === 0) {
            console.warn('[updateFeaturesSection] ⚠️ No features in currentFeatures, trying to reload...');
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'color: #999; font-size: 12px; padding: 8px; text-align: center;';
            placeholder.textContent = 'No features found. Try refreshing the page.';
            section.appendChild(placeholder);
            return;
        }

        // Create scrollable features grid using UIComponents
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = 'max-height: 500px; overflow-y: auto;';

        const grid = window.UIComponents.createFeaturesGrid(
            window.UIComponents.getFeaturesList(),
            this.currentFeatures,
            async (featureKey) => {
                this.currentFeatures[featureKey] = !this.currentFeatures[featureKey];
                const featureLabel = window.UIComponents.getFeaturesList().find(f => f.key === featureKey)?.label || featureKey;
                console.log(`[CarDetailPanel] Feature ${featureLabel} toggled to:`, this.currentFeatures[featureKey]);

                // Save to DB
                await window.FeaturesManager?.saveFeatures?.(
                    this.currentCarId,
                    this.currentFeatures,
                    this.currentSort,
                    this.isVerified
                );

                this.updateFeaturesSection();
            }
        );

        gridContainer.appendChild(grid);
        section.appendChild(gridContainer);
        console.log('[CarDetailPanel] Features section updated successfully');
    },

    /**
     * Update export section
     */
    updateExportSection() {
        const section = document.getElementById('unified-export-section');
        if (!section) {
            console.warn('[UnifiedPanel] Export section not found in DOM');
            return;
        }

        console.log('[UnifiedPanel] Updating export section');
        section.innerHTML = '';

        const label = document.createElement('div');
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px;';
        label.textContent = 'EXPORT';
        section.appendChild(label);

        const container = document.createElement('div');
        container.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px;';

        const exports = [
            { name: 'JSON', action: 'json', icon: '{}' },
            { name: 'Text', action: 'text', icon: '📝' },
            { name: 'Excel', action: 'excel', icon: '📊' },
            { name: 'Download', action: 'download', icon: '⬇️' }
        ];

        exports.forEach(exp => {
            const btn = document.createElement('button');
            btn.textContent = `${exp.icon} ${exp.name}`;
            btn.style.cssText = `
                padding: 8px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 11px;
                transition: all 0.2s;
            `;

            btn.onmouseover = () => btn.style.background = '#5568d3';
            btn.onmouseout = () => btn.style.background = '#667eea';

            btn.onclick = async () => {
                if (exp.action === 'json') {
                    await window.copyCarDataToClipboard?.('json');
                    this.showNotification('✅ Copied as JSON');
                } else if (exp.action === 'text') {
                    await window.copyCarDataToClipboard?.('text');
                    this.showNotification('✅ Copied as Text');
                } else if (exp.action === 'excel') {
                    this.exportAsExcel();
                } else if (exp.action === 'download') {
                    await window.downloadCarDataAsJson?.();
                    this.showNotification('✅ Downloading...');
                }
            };

            container.appendChild(btn);
        });

        section.appendChild(container);
        console.log('[UnifiedPanel] Export section updated successfully');
    },

    /**
     * Export data as Excel format (TSV for easy paste)
     */
    exportAsExcel() {
        const data = window.extractCarData?.();
        if (!data) return;

        const rows = [
            ['Field', 'Value'],
            ['Car ID', data.carId || ''],
            ['Title', data.title || ''],
            ['Price', data.price || ''],
            ['Mileage', data.mileage || ''],
            ['Year', data.year || ''],
            ['Engine', data.engine || ''],
            ['Transmission', data.transmission || ''],
            ['Fuel', data.fuel || ''],
            ['Note', this.currentNote || ''],
            ['Verified', this.isVerified ? 'Yes' : 'No'],
            ['Sort', this.currentSort === -1 ? 'Excluded' : `Level ${this.currentSort}`],
            ...Object.entries(this.currentFeatures).map(([name, state]) => [
                `Feature: ${name}`,
                state === true ? 'Yes' : (state === null ? 'Unknown' : 'No')
            ])
        ];

        const tsv = rows.map(row => row.join('\t')).join('\n');

        const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `car_${this.currentCarId}_data.tsv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('✅ Exported as Excel');
    },

    /**
     * Show temporary notification
     */
    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #333;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 99999;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    },

    /**
     * Toggle panel collapse
     */
    togglePanel() {
        if (!this.wrapperElement) return;

        this.isExpanded = !this.isExpanded;
        this.wrapperElement.style.transform = this.isExpanded ? 'translateX(0)' : 'translateX(100%)';
    }
};
