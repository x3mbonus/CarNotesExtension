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

// Render features grid with 3-state toggle (true, null, false)
    createFeaturesGrid(featuresList, currentFeatures, onFeatureToggle) {
        const container = document.createElement('div');
        container.className = 'ui-features-grid';

        featuresList.forEach(feature => {
            const btn = document.createElement('button');
            btn.className = 'ui-feature-btn';
            btn.setAttribute('data-feature', feature.key);

            const state = currentFeatures[feature.key];

            if (state === true) {
                btn.classList.add('active');
                btn.textContent = `✓ ${feature.label}`;
                btn.title = 'Click to cycle: Present → Unknown → Missing → Present';
            } else if (state === false) {
                // Missing state - color depends on priority
                btn.textContent = `✗ ${feature.label}`;
                if (feature.priority === 2) {
                    // High priority: RED when missing
                    btn.classList.add('missing');
                } else if (feature.priority === 1) {
                    // Medium priority: YELLOW when missing
                    btn.classList.add('priority-medium-missing');
                } else {
                    // Low priority: WHITE when missing (same as unknown)
                    btn.classList.add('priority-low-missing');
                }
                btn.title = 'Click to cycle: Present → Unknown → Missing → Present';
            } else {
                // state === null (unknown)
                btn.textContent = `? ${feature.label}`;
                if (feature.priority === 2) {
                    // High priority: RED when unknown
                    btn.classList.add('priority-missing');
                } else if (feature.priority === 1) {
                    // Medium priority: WHITE when unknown
                    btn.classList.add('priority-medium-unknown');
                }
                // Low priority: stays white (default)
                btn.title = 'Click to cycle: Present → Unknown → Missing → Present';
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

    // Get standard features list - ordered by user preference
    getFeaturesList() {
        return [
            // HIGH priority features - show RED when not true
            { label: 'ACC', key: 'feature_acc', priority: 2 },
            { label: 'Android Auto / CarPlay', key: 'feature_android_auto_carplay', priority: 2 },
            { label: 'Камера', key: 'feature_camera', priority: 2 },
            { label: 'Парктроніки', key: 'feature_parking_sensors', priority: 2 },
            { label: 'Blind spot', key: 'feature_blind_spot', priority: 2 },

            // MEDIUM priority (normal priority) features
            { label: 'Lane assist', key: 'feature_lane_assist', priority: 1 },
            { label: 'Знаки', key: 'feature_signs', priority: 1 },

            // LOW priority features
            { label: 'Rear traffic alert', key: 'feature_rear_traffic_alert', priority: 0 },
            { label: 'Traffic Jam Assist', key: 'feature_traffic_jam_assist', priority: 0 },

            // MEDIUM priority (normal priority) features
            { label: 'Keyless', key: 'feature_keyless', priority: 1 },
            { label: 'Digital cockpit', key: 'feature_digital_cockpit', priority: 1 },
            { label: 'Підігрів сидінь', key: 'feature_heated_seats', priority: 1 },

            // LOW priority features
            { label: 'Підігрів лобового', key: 'feature_heated_windshield', priority: 0 },
            { label: 'Підігрів керма', key: 'feature_heated_steering_wheel', priority: 0 },

            // MEDIUM priority (normal priority) features
            { label: 'Масаж', key: 'feature_massage_seats', priority: 1 },

            // LOW priority features
            { label: 'Пам\'ять сидінь', key: 'feature_memory_seats', priority: 0 },
            { label: 'DCC', key: 'feature_dcc', priority: 0 },
            { label: 'Webasto', key: 'feature_webasto', priority: 0 },

            // MEDIUM priority (normal priority) features
            { label: 'Matrix', key: 'feature_matrix_headlights', priority: 1 },

            // LOW priority features
            { label: 'Автопаркування', key: 'feature_auto_parking', priority: 0 },
            { label: '360 камера', key: 'feature_360_camera', priority: 0 },

            // HIGH priority features - show RED when not true
            { label: 'Фаркоп', key: 'feature_tow_hitch', priority: 2 },

            // MEDIUM priority (normal priority) features
            { label: 'Електробагажник', key: 'feature_electric_tailgate', priority: 1 },

            // LOW priority features
            { label: 'Автобагажник', key: 'feature_auto_tailgate', priority: 0 },
            { label: 'Панорама', key: 'feature_panoramic_roof', priority: 0 },
            { label: 'HUD', key: 'feature_hud', priority: 0 }
        ];
    },

    // Render metadata section (above features) - compact version with Ukrainian labels only
    createMetadataSection(carData, onMetadataChange) {
        const section = document.createElement('div');
        section.className = 'ui-metadata-section';

        const metadataFields = [
            { label: 'Тип сидінь', key: 'seat_type', placeholder: 'Сидіння' },
            { label: 'Клімат', key: 'climate', placeholder: 'Клімат' },
            { label: 'Власників', key: 'owners', placeholder: 'Кількість' },
            { label: 'Фаркоп тип', key: 'tow_hitch_type', placeholder: 'Тип' }
        ];

        metadataFields.forEach(field => {
            const container = document.createElement('div');
            container.className = 'ui-metadata-field';

            const label = document.createElement('label');
            label.className = 'ui-metadata-label';
            label.textContent = field.label;
            container.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'ui-metadata-input';
            input.value = carData[field.key] || '';
            input.placeholder = field.placeholder;

            if (onMetadataChange) {
                input.addEventListener('input', (e) => {
                    onMetadataChange({ [field.key]: e.target.value });
                });
            }

            container.appendChild(input);
            section.appendChild(container);
        });

        return section;
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
