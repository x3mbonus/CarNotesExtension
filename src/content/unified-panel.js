// Unified Detail Page Panel - Combines notes + features + export in one panel

window.UnifiedPanel = {
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
        console.log('🔍 UnifiedPanel.showPanel called with carId:', carId);

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
        console.log('[UnifiedPanel] FeaturesManager exists?', !!window.FeaturesManager);
        try {
            console.log('[UnifiedPanel] Calling initializeFeatures...');
            const featureState = await window.FeaturesManager?.initializeFeatures?.(carId, data);
            console.log('[UnifiedPanel] initializeFeatures returned:', featureState);
            this.currentFeatures = featureState?.features || {};
            this.isVerified = featureState?.confirmed || false;
            this.currentSort = featureState?.sort ?? -1;
            console.log('✅ Features loaded:', Object.keys(this.currentFeatures).length, 'features');
        } catch (error) {
            console.error('❌ Error loading features:', error);
            this.currentFeatures = {};
        }

        // Load note
        console.log('[UnifiedPanel] Calling getNote...');
        try {
            const notePromise = window.getNote?.(carId);
            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => resolve(null), 2000) // 2 second timeout
            );
            const noteData = notePromise ? await Promise.race([notePromise, timeoutPromise]) : null;
            console.log('[UnifiedPanel] getNote returned:', noteData);
            if (noteData) {
                this.currentNote = noteData.text || '';
                this.currentColor = noteData.color || '#FFEB3B';
                console.log('✅ Note loaded');
            }
        } catch (error) {
            console.error('❌ Error loading note:', error);
        }

        console.log('📝 Updating panel content...');
        this.updatePanelContent();
        this.isInitializing = false;
        console.log('✅ Panel initialization complete for carId:', carId);
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
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-height: 0;
        `;

        // Section 1: Verified Status
        const verifiedSection = document.createElement('div');
        verifiedSection.id = 'unified-verified-section';
        verifiedSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(verifiedSection);

        // Section 2: Sort Level
        const sortSection = document.createElement('div');
        sortSection.id = 'unified-sort-section';
        sortSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(sortSection);

        // Section 3: Note
        const noteSection = document.createElement('div');
        noteSection.id = 'unified-note-section';
        noteSection.innerHTML = '<div style="color: #ccc; font-size: 12px;">Loading...</div>';
        content.appendChild(noteSection);

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

        const label = document.createElement('div');
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px;';
        label.textContent = 'VERIFICATION STATUS';
        section.appendChild(label);

        const button = document.createElement('button');
        button.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
            background: ${this.isVerified ? '#E8F5E9' : '#FFF3E0'};
            color: ${this.isVerified ? '#1B5E20' : '#E65100'};
            border-color: ${this.isVerified ? '#4CAF50' : '#FF9800'};
        `;
        button.textContent = this.isVerified ? '✓ Verified' : '⊙ Not Verified';

        button.onclick = async () => {
            this.isVerified = !this.isVerified;
            console.log('🔄 Toggling verified status to:', this.isVerified);
            await window.FeaturesManager?.confirmAllFeatures?.(
                this.currentCarId,
                this.currentFeatures,
                this.currentSort,
                this.isVerified
            );
            this.updateVerifiedSection();
        };

        section.appendChild(button);
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

        const label = document.createElement('div');
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px;';
        label.textContent = 'SORT CATEGORY';
        section.appendChild(label);

        const container = document.createElement('div');
        container.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';

        const sorts = [
            { id: 0, label: 'Best ★★★★', color: '#4CAF50', bg: '#C8E6C9' },
            { id: 1, label: 'Good ★★★', color: '#2196F3', bg: '#BBDEFB' },
            { id: 2, label: 'Fair ★★', color: '#FF9800', bg: '#FFE0B2' },
            { id: 3, label: 'Poor ★', color: '#F44336', bg: '#FFCDD2' },
            { id: -1, label: 'Excluded ✕', color: '#999', bg: '#F5F5F5', span: true }
        ];

        sorts.forEach(sort => {
            const button = document.createElement('button');
            const isSelected = this.currentSort === sort.id;

            button.textContent = sort.label;
            button.style.cssText = `
                padding: 10px;
                border: 2px solid ${sort.color};
                border-radius: 6px;
                background: ${isSelected ? sort.bg : 'white'};
                color: ${sort.color};
                cursor: pointer;
                font-weight: 600;
                font-size: 12px;
                transition: all 0.2s;
                ${sort.span ? 'grid-column: 1 / -1;' : ''}
            `;

            button.onmouseover = () => {
                if (!isSelected) button.style.background = sort.bg;
            };
            button.onmouseout = () => {
                if (!isSelected) button.style.background = 'white';
            };

            button.onclick = async () => {
                console.log(`[UnifiedPanel] Sort button clicked: ${sort.label} (id=${sort.id})`);
                this.currentSort = sort.id;
                console.log(`[UnifiedPanel] currentFeatures before confirmAllFeatures: ${Object.keys(this.currentFeatures).length} features`);
                console.log(`[UnifiedPanel] Calling confirmAllFeatures with carId=${this.currentCarId}, sort=${this.currentSort}, verified=${this.isVerified}`);
                const result = await window.FeaturesManager.confirmAllFeatures(
                    this.currentCarId,
                    this.currentFeatures,
                    this.currentSort,
                    this.isVerified
                );
                console.log(`[UnifiedPanel] confirmAllFeatures result:`, result);
                console.log(`[UnifiedPanel] currentFeatures after confirmAllFeatures:`, Object.keys(this.currentFeatures).length, 'features');

                // Force refresh features from DB after sort change
                console.log(`[UnifiedPanel] Refreshing features from database after sort change...`);
                const refreshedFeatures = await window.FeaturesManager.initializeFeatures(this.currentCarId);
                if (refreshedFeatures && refreshedFeatures.features) {
                    this.currentFeatures = refreshedFeatures.features;
                    this.isVerified = refreshedFeatures.confirmed || false;
                    this.currentSort = refreshedFeatures.sort ?? -1;
                    console.log(`[UnifiedPanel] Features refreshed after sort, now has`, Object.keys(this.currentFeatures).length, 'features');
                }

                this.updateSortSection();
                this.updateFeaturesSection();  // Also refresh features after sort change
            };

            container.appendChild(button);
        });

        section.appendChild(container);
        console.log('✅ Sort section updated');
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

        const label = document.createElement('div');
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px;';
        label.textContent = 'NOTES';
        section.appendChild(label);

        // Color picker
        const colorContainer = document.createElement('div');
        colorContainer.style.cssText = 'display: flex; gap: 6px; margin-bottom: 8px;';

        const colors = ['#FFEB3B', '#FF9800', '#F44336', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63'];
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.style.cssText = `
                width: 24px;
                height: 24px;
                border: ${this.currentColor === color ? '2px solid #333' : '2px solid #ddd'};
                background: ${color};
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            colorBtn.onclick = () => {
                this.currentColor = color;
                this.updateNoteSection();
            };
            colorContainer.appendChild(colorBtn);
        });

        section.appendChild(colorContainer);

        // Text area
        const textarea = document.createElement('textarea');
        textarea.value = this.currentNote;
        textarea.placeholder = 'Add a note...';
        textarea.style.cssText = `
            width: 100%;
            height: 80px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            font-size: 13px;
            resize: vertical;
            background: ${this.currentColor};
            color: #333;
        `;

        let saveTimeout;
        textarea.oninput = () => {
            console.log('[UnifiedPanel] Note input changed');
            this.currentNote = textarea.value;
            clearTimeout(this.noteSaveTimeout);
            this.noteSaveTimeout = setTimeout(() => {
                console.log('[UnifiedPanel] Saving note after 500ms debounce...');
                window.saveNote?.(this.currentCarId, {
                    text: this.currentNote,
                    color: this.currentColor
                }).then(() => {
                    console.log('[UnifiedPanel] Note saved successfully');
                }).catch((error) => {
                    console.error('[UnifiedPanel] Error saving note:', error);
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

        const label = document.createElement('div');
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px;';
        label.textContent = 'FEATURES';
        section.appendChild(label);

        // Defensive: ensure currentFeatures is initialized
        if (!this.currentFeatures || Object.keys(this.currentFeatures).length === 0) {
            console.warn('[updateFeaturesSection] ⚠️ No features in currentFeatures, trying to reload...');
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'color: #999; font-size: 12px; padding: 8px; text-align: center;';
            placeholder.textContent = 'No features found. Try refreshing the page.';
            section.appendChild(placeholder);
            return;
        }

        const groupedFeatures = window.FeaturesDisplay?.getGroupedFeatures(this.currentFeatures) || {};
        console.log('[updateFeaturesSection] Grouped features:', Object.keys(groupedFeatures));

        const stats = window.FeaturesParser?.getStatistics?.(this.currentFeatures) || {};
        console.log('[updateFeaturesSection] Stats:', stats);

        // Stats bar
        const statsBar = document.createElement('div');
        statsBar.style.cssText = `
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 11px;
            font-weight: 600;
        `;

        const statItems = [
            { label: '✓', count: stats.present || 0, color: '#4CAF50' },
            { label: '?', count: stats.unknown || 0, color: '#FFC107' },
            { label: '✗', count: stats.missing || 0, color: '#F44336' }
        ];

        statItems.forEach(item => {
            const stat = document.createElement('div');
            stat.style.cssText = `
                background: ${item.color}22;
                color: ${item.color};
                padding: 4px 8px;
                border-radius: 4px;
                flex: 1;
                text-align: center;
            `;
            stat.textContent = `${item.label} ${item.count}`;
            statsBar.appendChild(stat);
        });

        section.appendChild(statsBar);

        // Features grid
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px; max-height: 250px; overflow-y: auto; border: 1px solid #eee; padding: 8px; border-radius: 4px;';

        Object.entries(groupedFeatures).forEach(([category, features]) => {
            Object.entries(features).forEach(([featureName, state]) => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    padding: 6px;
                    font-size: 11px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    cursor: pointer;
                    background: ${window.FeaturesDisplay?.getFeatureBackground(featureName, state)};
                    color: ${window.FeaturesDisplay?.getFeatureTextColor(featureName, state)};
                    transition: all 0.2s;
                `;

                btn.textContent = `${window.FeaturesDisplay?.getFeatureIcon(state)} ${featureName}`;
                btn.title = 'Click to cycle: ✓ → ? → ✗ → ✓';

                btn.onclick = async () => {
                    console.log(`[UnifiedPanel] Feature button clicked: ${featureName}, current state: ${state}`);
                    const nextState = window.FeaturesDisplay?.getNextState(state);
                    console.log(`[UnifiedPanel] Next state: ${nextState}`);
                    this.currentFeatures[featureName] = nextState;
                    console.log(`[UnifiedPanel] Updated currentFeatures[${featureName}] to ${nextState}, feature count now:`, Object.keys(this.currentFeatures).length);
                    console.log(`[UnifiedPanel] Calling toggleFeature with carId=${this.currentCarId}, feature=${featureName}, currentState=${state}`);
                    const result = await window.FeaturesManager.toggleFeature(this.currentCarId, featureName, state);
                    console.log(`[UnifiedPanel] toggleFeature result:`, result);
                    console.log(`[UnifiedPanel] currentFeatures after save has`, Object.keys(this.currentFeatures).length, 'features');

                    // Force refresh features from DB to ensure sync
                    console.log(`[UnifiedPanel] Refreshing features from database...`);
                    const refreshedFeatures = await window.FeaturesManager.initializeFeatures(this.currentCarId);
                    if (refreshedFeatures && refreshedFeatures.features) {
                        this.currentFeatures = refreshedFeatures.features;
                        this.isVerified = refreshedFeatures.confirmed || false;
                        this.currentSort = refreshedFeatures.sort ?? -1;
                        console.log(`[UnifiedPanel] Features refreshed, now has`, Object.keys(this.currentFeatures).length, 'features');
                    }

                    this.updateFeaturesSection();
                };

                grid.appendChild(btn);
            });
        });

        section.appendChild(grid);
        console.log('[UnifiedPanel] Features section updated successfully, features count:', Object.keys(this.currentFeatures).length);
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
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px;';
        label.textContent = 'EXPORT';
        section.appendChild(label);

        const container = document.createElement('div');
        container.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';

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
                padding: 10px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 12px;
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
