// Shared UI Components for Notes, Ratings, Features, Verification
// Used by both CarDetailPanel and NoteModal

window.UIComponents = {
    // Render color picker grid
    createColorGrid(colors, currentColor, onColorSelect) {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;';

        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = currentColor === color ? 'ui-color-btn selected' : 'ui-color-btn';
            btn.setAttribute('data-color', color);
            btn.style.backgroundColor = color;
            btn.onclick = () => onColorSelect(color);
            container.appendChild(btn);
        });

        return container;
    },

    // Render textarea with dynamic text color
    createNoteTextarea(text, backgroundColor, onInput) {
        const textarea = document.createElement('textarea');
        textarea.className = 'ui-note-textarea';
        textarea.value = text;
        textarea.placeholder = 'Add a note...';

        const textColor = window.getTextColorForBackground(backgroundColor);
        textarea.style.backgroundColor = backgroundColor;
        textarea.style.color = textColor;  // Explicitly set color so it's visible
        textarea.style.fontWeight = '500';  // Make text slightly bolder for better visibility

        if (onInput) {
            textarea.addEventListener('input', onInput);
        }

        return textarea;
    },

    // Render rating dropdown with options
    createRatingSelect(currentSort, onRatingChange) {
        const select = document.createElement('select');
        select.className = 'ui-rating-select';

        const options = [
            { value: 'null', label: 'No rating', color: '#e0e0e0' },
            { value: '0', label: '⭐⭐⭐⭐ Best', color: '#2E7D32' },
            { value: '1', label: '⭐⭐⭐ Good', color: '#CDDC39' },
            { value: '2', label: '⭐⭐ Fair', color: '#FDD835' },
            { value: '3', label: '⭐ Poor', color: '#FF7043' },
            { value: '-1', label: '🚫 Excluded', color: '#F44336' }
        ];

        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            // Handle null vs string 'null' correctly
            const isSelected = (currentSort === null && opt.value === 'null') ||
                             (currentSort !== null && currentSort !== -1 && currentSort.toString() === opt.value) ||
                             (currentSort === -1 && opt.value === '-1');
            if (isSelected) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });

        if (onRatingChange) {
            select.addEventListener('change', (e) => {
                const val = e.target.value;
                const sortId = val === 'null' ? null : parseInt(val);
                onRatingChange(sortId);
            });
        }

        return select;
    },

    // Render verification toggle button
    createVerificationButton(isVerified, onToggle) {
        const btn = document.createElement('button');
        btn.className = 'ui-verification-btn';
        if (isVerified) {
            btn.setAttribute('data-verified', 'true');
            btn.textContent = '✓ Verified';
        } else {
            btn.textContent = '○ Not Verified';
        }

        if (onToggle) {
            btn.addEventListener('click', onToggle);
        }

        return btn;
    },

    // Render features grid
    createFeaturesGrid(featuresList, currentFeatures, onFeatureToggle) {
        const container = document.createElement('div');
        container.className = 'ui-features-grid';

        featuresList.forEach(feature => {
            const btn = document.createElement('button');
            btn.className = 'ui-feature-btn';
            btn.setAttribute('data-feature', feature.key);

            if (currentFeatures[feature.key]) {
                btn.classList.add('active');
                btn.textContent = `✓ ${feature.label}`;
            } else {
                btn.textContent = `? ${feature.label}`;
            }

            if (onFeatureToggle) {
                btn.addEventListener('click', () => {
                    onFeatureToggle(feature.key);
                });
            }

            container.appendChild(btn);
        });

        return container;
    },

    // Get standard features list
    getFeaturesList() {
        return [
            { label: 'ACC', key: 'feature_acc' },
            { label: 'Blind spot', key: 'feature_blind_spot' },
            { label: 'Lane assist', key: 'feature_lane_assist' },
            { label: 'Signs', key: 'feature_signs' },
            { label: 'Rear traffic alert', key: 'feature_rear_traffic_alert' },
            { label: 'Traffic Jam Assist', key: 'feature_traffic_jam_assist' },
            { label: 'Keyless', key: 'feature_keyless' },
            { label: 'Digital cockpit', key: 'feature_digital_cockpit' },
            { label: 'Heated seats', key: 'feature_heated_seats' },
            { label: 'Heated windshield', key: 'feature_heated_windshield' },
            { label: 'Heated steering wheel', key: 'feature_heated_steering_wheel' },
            { label: 'Massage seats', key: 'feature_massage_seats' },
            { label: 'Memory seats', key: 'feature_memory_seats' },
            { label: 'Android Auto / CarPlay', key: 'feature_android_auto_carplay' },
            { label: 'HUD', key: 'feature_hud' },
            { label: 'DCC', key: 'feature_dcc' },
            { label: 'Matrix headlights', key: 'feature_matrix_headlights' },
            { label: 'Camera', key: 'feature_camera' },
            { label: 'Parking sensors', key: 'feature_parking_sensors' },
            { label: '360 camera', key: 'feature_360_camera' },
            { label: 'Auto parking', key: 'feature_auto_parking' },
            { label: 'Panoramic roof', key: 'feature_panoramic_roof' },
            { label: 'Electric tailgate', key: 'feature_electric_tailgate' },
            { label: 'Auto tailgate', key: 'feature_auto_tailgate' },
            { label: 'Tow hitch', key: 'feature_tow_hitch' },
            { label: 'Webasto', key: 'feature_webasto' }
        ];
    },

    // Get standard colors
    getColors() {
        return ['#607D8B', '#388E3C', '#7CB342', '#FDD835', '#FF7043', '#F44336', '#2196F3', '#9C27B0', '#FFEB3B', '#00BCD4', '#E91E63', '#8B4513'];
    },

    // Create section label
    createSectionLabel(text) {
        const label = document.createElement('label');
        label.className = 'ui-section-label';
        label.textContent = text;
        return label;
    }
};
