// Features Display UI - Persistent side panel with manual correction and DB persistence

window.FeaturesDisplay = {
    currentCarId: null,
    currentFeatures: null,
    isConfirmed: false,
    currentSort: null,
    panelElement: null,
    isExpanded: true,

    /**
     * Show features in persistent side panel
     */
    async showFeaturesPanel(carId, data) {
        this.currentCarId = carId;

        // Create or update existing panel
        if (!this.panelElement) {
            this.createSidePanel();
        }

        // Load or initialize features
        const featureState = await window.FeaturesManager.initializeFeatures(carId, data);
        this.currentFeatures = featureState.features;
        this.isConfirmed = featureState.confirmed;
        this.currentSort = featureState.sort;

        // Update panel content
        this.updatePanelContent();
    },

    /**
     * Create the side panel structure
     */
    createSidePanel() {
        // Container wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'car-notes-features-panel-wrapper';
        wrapper.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            z-index: 9998;
            width: 420px;
            transition: transform 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        `;

        // Main panel
        const panel = document.createElement('div');
        panel.id = 'car-notes-features-panel';
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
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            flex: 1;
            min-width: 0;
        `;
        title.innerHTML = `🔍 Features`;
        header.appendChild(title);

        // Collapse button
        const collapseBtn = document.createElement('button');
        collapseBtn.textContent = '→';
        collapseBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
        `;
        collapseBtn.title = 'Collapse panel';
        collapseBtn.onclick = () => this.togglePanel(collapseBtn);
        header.appendChild(collapseBtn);

        panel.appendChild(header);

        // Content area (scrollable)
        const content = document.createElement('div');
        content.id = 'car-notes-features-content';
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;
        panel.appendChild(content);

        wrapper.appendChild(panel);
        document.body.appendChild(wrapper);
        this.panelElement = wrapper;
    },

    /**
     * Toggle panel expansion state
     */
    togglePanel(btn) {
        this.isExpanded = !this.isExpanded;
        const wrapper = document.getElementById('car-notes-features-panel-wrapper');
        if (!wrapper) return;

        if (this.isExpanded) {
            wrapper.style.transform = 'translateX(0)';
            btn.textContent = '→';
            btn.title = 'Collapse panel';
        } else {
            wrapper.style.transform = 'translateX(100%)';
            btn.textContent = '←';
            btn.title = 'Expand panel';
        }
    },

    /**
     * Update panel content with current features
     */
    updatePanelContent() {
        const content = document.getElementById('car-notes-features-content');
        if (!content) return;

        content.innerHTML = ''; // Clear content

        const groupedFeatures = this.getGroupedFeatures(this.currentFeatures);
        const stats = window.FeaturesManager.getStatistics(this.currentFeatures);

        // Stats indicator
        const statsDiv = document.createElement('div');
        statsDiv.style.cssText = `
            background: #f5f5f5;
            border-radius: 8px;
            padding: 12px;
            font-size: 12px;
        `;
        statsDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600;">
                <span>${this.isConfirmed ? '✓ Verified' : '(Draft)'}</span>
                <span>✓ ${stats.present} | ? ${stats.unknown} | ✗ ${stats.missing}/${stats.total}</span>
            </div>
            <div style="height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: ${stats.total > 0 ? Math.round(((stats.present + stats.unknown) / stats.total) * 100) : 0}%; transition: width 0.3s;"></div>
            </div>
        `;
        content.appendChild(statsDiv);

        // Features by category
        Object.entries(groupedFeatures).forEach(([category, features]) => {
            const categorySection = document.createElement('div');

            const categoryTitle = document.createElement('div');
            categoryTitle.style.cssText = `
                font-weight: 600;
                font-size: 11px;
                color: #667eea;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            `;
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);

            const featuresList = document.createElement('div');
            featuresList.style.cssText = `
                display: grid;
                grid-template-columns: 1fr;
                gap: 6px;
            `;

            Object.entries(features).forEach(([featureName, state]) => {
                const featureBtn = document.createElement('button');
                featureBtn.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    border: 1px solid #ddd;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: ${this.getFeatureBackground(featureName, state)};
                    color: ${this.getFeatureTextColor(featureName, state)};
                    text-align: left;
                `;

                featureBtn.onmouseover = () => {
                    featureBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                };

                featureBtn.onmouseout = () => {
                    featureBtn.style.boxShadow = 'none';
                };

                const icon = document.createElement('span');
                icon.style.cssText = `
                    margin-right: 6px;
                    font-weight: bold;
                    font-size: 12px;
                    min-width: 16px;
                `;
                icon.textContent = this.getFeatureIcon(state);
                featureBtn.appendChild(icon);

                const label = document.createElement('span');
                label.textContent = featureName;
                featureBtn.appendChild(label);

                featureBtn.title = 'Click to cycle: Unknown (?) → Present (✓) → Missing (✗) → Unknown (?)';

                featureBtn.onclick = async () => {
                    await window.FeaturesManager.toggleFeature(this.currentCarId, featureName, state);
                    this.currentFeatures[featureName] = this.getNextState(state);
                    this.updatePanelContent();
                };

                featuresList.appendChild(featureBtn);
            });

            categorySection.appendChild(featuresList);
            content.appendChild(categorySection);
        });

        // Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'border-top: 1px solid #eee;';
        content.appendChild(divider);

        // Sort selector
        const sortSection = document.createElement('div');
        sortSection.style.cssText = 'margin-top: 8px;';

        const sortLabel = document.createElement('div');
        sortLabel.style.cssText = `
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        sortLabel.textContent = 'Sort Category';
        sortSection.appendChild(sortLabel);

        const sortContainer = document.createElement('div');
        sortContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;';

        const sorts = [
            { id: 0, label: 'Sort 0', color: '#e74c3c' },
            { id: 1, label: 'Sort 1', color: '#f39c12' },
            { id: 2, label: 'Sort 2', color: '#27ae60' },
            { id: 3, label: 'Sort 3', color: '#3498db' }
        ];

        sorts.forEach((sort, idx) => {
            const sortBtn = document.createElement('button');
            sortBtn.textContent = sort.label;
            sortBtn.style.cssText = `
                padding: 8px;
                border: 2px solid ${sort.color};
                background: ${this.currentSort === sort.id ? sort.color : 'white'};
                color: ${this.currentSort === sort.id ? 'white' : sort.color};
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                font-size: 11px;
                transition: all 0.2s;
            `;

            sortBtn.onclick = () => {
                this.currentSort = sort.id;
                // Update all sort buttons
                Array.from(sortContainer.children).forEach((child, childIdx) => {
                    child.style.background = this.currentSort === sorts[childIdx].id ? sorts[childIdx].color : 'white';
                    child.style.color = this.currentSort === sorts[childIdx].id ? 'white' : sorts[childIdx].color;
                });
            };

            sortContainer.appendChild(sortBtn);
        });

        sortSection.appendChild(sortContainer);
        content.appendChild(sortSection);

        // Action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 12px;
        `;

        // Verify button
        const verifyBtn = document.createElement('button');
        verifyBtn.textContent = this.isConfirmed ? '✓ Verified' : 'Verify';
        verifyBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 11px;
            transition: opacity 0.2s;
        `;

        verifyBtn.onmouseover = () => verifyBtn.style.opacity = '0.8';
        verifyBtn.onmouseout = () => verifyBtn.style.opacity = '1';

        verifyBtn.onclick = async () => {
            this.isConfirmed = true;
            await window.FeaturesManager.confirmAllFeatures(
                this.currentCarId,
                this.currentFeatures,
                this.currentSort
            );
            this.updatePanelContent();
        };

        actionsDiv.appendChild(verifyBtn);

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style.cssText = `
            padding: 8px 12px;
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 11px;
            transition: all 0.2s;
        `;

        resetBtn.onmouseover = () => resetBtn.style.background = '#e8e8e8';
        resetBtn.onmouseout = () => resetBtn.style.background = '#f0f0f0';

        resetBtn.onclick = async () => {
            if (confirm('Reset to parse features from content?')) {
                const data = window.extractCarData?.();
                const newFeatures = {};
                const parsed = window.FeaturesParser.parseFeatures(data);
                Object.entries(parsed).forEach(([featureName, isPresent]) => {
                    // Convert feature names to database column names for consistency
                    const columnName = window.FeatureColumnMapper ?
                        window.FeatureColumnMapper.featureToColumnName(featureName) :
                        'feature_' + featureName.toLowerCase().replace(/\s+/g, '_');
                    newFeatures[columnName] = isPresent ? true : null;
                });
                this.currentFeatures = newFeatures;
                this.isConfirmed = false;
                await window.FeaturesManager.saveFeatures(
                    this.currentCarId,
                    newFeatures,
                    false,
                    this.currentSort
                );
                this.updatePanelContent();
            }
        };

        actionsDiv.appendChild(resetBtn);
        content.appendChild(actionsDiv);
    },

    /**
     * Get background color based on feature state and importance
     */
    getFeatureBackground(featureName, state) {
        if (state === true) return '#E8F5E9';
        if (state === null) return '#FAFAFA';
        const importance = window.FeaturesManager.getImportance(featureName);
        return importance === 'critical' ? '#FFEBEE' : '#FFF8E1';
    },

    /**
     * Get text color based on feature state
     */
    getFeatureTextColor(featureName, state) {
        if (state === true) return '#2E7D32';
        if (state === null) return '#999';
        const importance = window.FeaturesManager.getImportance(featureName);
        return importance === 'critical' ? '#C62828' : '#E65100';
    },

    /**
     * Get icon based on state
     */
    getFeatureIcon(state) {
        if (state === true) return '✓';
        if (state === null) return '?';
        return '✗';
    },

    /**
     * Get next state in cycle
     */
    getNextState(currentState) {
        if (currentState === true) return null;
        if (currentState === null) return false;
        return true;
    },

    /**
     * Group features by category
     */
    getGroupedFeatures(features) {
        const grouped = {};
        Object.entries(window.FeaturesParser.FEATURE_CATEGORIES).forEach(([category, categoryFeatures]) => {
            grouped[category] = {};
            categoryFeatures.forEach(featureName => {
                // Convert feature display name to column name
                const columnName = window.FeatureColumnMapper ?
                    window.FeatureColumnMapper.featureToColumnName(featureName) :
                    'feature_' + featureName.toLowerCase().replace(/\s+/g, '_');
                grouped[category][featureName] = features[columnName] !== undefined ? features[columnName] : null;
            });
        });
        return grouped;
    }
};
