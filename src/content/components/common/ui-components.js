// Shared UI Components for Notes, Ratings, Features, Verification
// Used by both CarDetailPanel and NoteModal

window.UIComponents = {
    // Render color picker grid - first color (gray) is default
    createColorGrid(colors, currentColor, onColorSelect) {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;';

        // Default to first color if none specified
        const selectedColor = currentColor || colors[0];

        colors.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = selectedColor === color ? 'ui-color-btn selected' : 'ui-color-btn';
            btn.setAttribute('data-color', color);
            btn.setAttribute('data-color-index', index);  // Pass index for rating mapping
            btn.style.backgroundColor = color;
            btn.style.pointerEvents = 'auto';  // Ensure button is clickable
            btn.style.position = 'relative';
            btn.style.zIndex = '10002';  // Ensure button is above modal/panel

            btn.onmouseover = () => {
                // No logging
            };

            btn.onmousedown = (e) => {
                // DON'T prevent default on mousedown - it blocks click event!
            };

            btn.onmouseup = (e) => {
                // DON'T prevent default on mouseup - it blocks click event!
            };

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                onColorSelect(color, index);  // Pass both color and index
            };
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

        // Set placeholder color dynamically - must match text color for consistency
        // Create a unique style for this textarea's placeholder
        const uniqueId = 'ta-' + Math.random().toString(36).substr(2, 9);
        textarea.setAttribute('data-ta-id', uniqueId);

        // Remove any old styles with this pattern (prevents accumulation)
        document.querySelectorAll(`style[data-ta-style]`).forEach(style => {
            if (!document.querySelector(`[data-ta-id="${style.dataset.taPlaceholder}"]`)) {
                style.remove();
            }
        });

        // Create and inject placeholder style
        const placeholderStyle = document.createElement('style');
        placeholderStyle.setAttribute('data-ta-style', 'true');
        placeholderStyle.setAttribute('data-ta-placeholder', uniqueId);
        placeholderStyle.textContent = `[data-ta-id="${uniqueId}"]::placeholder { color: ${textColor}; opacity: 0.8; }`;
        document.head.appendChild(placeholderStyle);

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
            { value: '0', label: '⭐⭐⭐⭐⭐ Best', color: '#2E7D32' },
            { value: '1', label: '⭐⭐⭐⭐ Good', color: '#CDDC39' },
            { value: '2', label: '⭐⭐⭐ Fair', color: '#FDD835' },
            { value: '3', label: '⭐⭐ Poor', color: '#FF7043' },
            { value: '-1', label: '🚫 Excluded', color: '#F44336' }
        ];

        let selectedColor = '#e0e0e0'; // Default to "No rating" color

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
                selectedColor = opt.color;
            }
            select.appendChild(optionEl);
        });

        // Apply the selected color to the dropdown
        select.style.backgroundColor = selectedColor;
        select.style.color = window.getTextColorForBackground(selectedColor);
        select.style.fontWeight = '500';
        select.style.padding = '6px 8px';
        select.style.border = '1px solid #ccc';
        select.style.borderRadius = '4px';
        select.style.cursor = 'pointer';

        if (onRatingChange) {
            select.addEventListener('change', (e) => {
                const val = e.target.value;
                const sortId = val === 'null' ? null : parseInt(val);

                // Update the dropdown color to match the selected option
                const selectedOption = options.find(opt => opt.value === val);
                if (selectedOption) {
                    select.style.backgroundColor = selectedOption.color;
                    select.style.color = window.getTextColorForBackground(selectedOption.color);
                }

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
                btn.title = 'Click to cycle: Unknown (?) → Present (✓) → Missing (✗) → Unknown (?)';
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
                btn.title = 'Click to cycle: Unknown (?) → Present (✓) → Missing (✗) → Unknown (?)';
            } else {
                // state === null (unknown) - initial state
                btn.textContent = `? ${feature.label}`;
                btn.title = 'Click to cycle: Unknown (?) → Present (✓) → Missing (✗) → Unknown (?)';
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
        // Use cached full features config from FeaturesManager instead of recreating array
        return window.FeaturesManager?.fullFeaturesListCache ||
               this.getFeaturesListFallback();
    },

    /**
     * Fallback features list if FeaturesManager cache not available yet
     * (same list as FeaturesManager.getFullFeaturesConfig)
     */
    getFeaturesListFallback() {
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
            // Read-only fields (auto-extracted from page)
            {
                label: 'Марка',
                key: 'make',
                type: 'text',
                placeholder: 'Auto-extracted',
                readonly: true
            },
            {
                label: 'Модель',
                key: 'model',
                type: 'text',
                placeholder: 'Auto-extracted',
                readonly: true
            },
            // Numeric/text fields
            {
                label: 'Ціна (PLN)',
                key: 'price',
                type: 'text',
                placeholder: ''
            },
            {
                label: 'Ціна (EUR)',
                key: 'price_eur',
                type: 'text',
                placeholder: 'Автоматично з PLN',
                readonly: true
            },
            {
                label: 'Пробіг (км)',
                key: 'mileage',
                type: 'text',
                placeholder: 'e.g., 150000'
            },
            {
                label: 'Рік',
                key: 'year',
                type: 'text',
                placeholder: 'e.g., 2019'
            },
            // Select fields
            {
                label: 'Тип сидінь',
                key: 'seat_type',
                type: 'select',
                options: ['Не вказано', 'Alcantara', 'Leather', 'Part Leather', 'Cloth', 'Fabric', 'Suede']
            },
            {
                label: 'Клімат',
                key: 'climate',
                type: 'select',
                options: ['Не вказано', '-', '2', '3', 'Auto']
            },
            {
                label: 'Власників',
                key: 'owners',
                type: 'select',
                options: ['Не вказано', '1', '2', '3', '4+']
            },
            {
                label: 'Фаркоп тип',
                key: 'tow_hitch_type',
                type: 'select',
                options: ['Не вказано', 'No', 'Swiveling', 'Detachable', 'Fixed']
            }
        ];

        // Detect if we're on mobile.de - if so, adjust price fields
        const isMobileDe = window.location.hostname.includes('mobile.de');
        if (isMobileDe && carData.price_eur) {
            // Find and modify the PLN field
            const plnField = metadataFields.find(f => f.key === 'price');
            if (plnField) {
                plnField.readonly = true;
                plnField.placeholder = 'From EUR (reference)';
                // Auto-calculate PLN from EUR: EUR * 4.26 (inverse of 23.50/100)
                const eurPrice = parseFloat(carData.price_eur.toString().replace(/\s+/g, '').replace(/,/g, ''));
                if (!isNaN(eurPrice) && eurPrice > 0) {
                    carData.price = Math.round(eurPrice * 100 / 23.50).toString();
                }
            }
        }

        /**
         * Determine background color based on metadata value
         */
        const getMetadataColor = (field, value) => {
            if (!value) return { bg: 'white', text: '#333' };

// YEAR: Material Design green scale matching features
            // 2024: wow, 2023: super, 2022: good, 2021: better, 2020: ok, older: gray/yellow/orange
            if (field === 'year') {
                const yearMatch = value.toString().match(/\d{4}/);
                if (yearMatch) {
                    const year = parseInt(yearMatch[0]);

                    if (year >= 2024) {
                        return { bg: '#1B5E20', text: '#FFFFFF' };  // Dark green #1B5E20 - wow
                    } else if (year >= 2023) {
                        return { bg: '#388E3C', text: '#FFFFFF' };  // Material Green - super
                    } else if (year >= 2022) {
                        return { bg: '#4CAF50', text: '#FFFFFF' };  // Material Green - good
                    } else if (year >= 2021) {
                        return { bg: '#7CB342', text: '#FFFFFF' };  // Material Light-Dark Green - better
                    } else if (year >= 2020) {
                        return { bg: '#E8F5E9', text: '#1b5e20' };  // Material Light Green - ok (matches features.active)
                    } else if (year >= 2015) {
                        return { bg: '#f5f5f5', text: '#666' };     // Gray (matches features neutral)
                    } else if (year >= 2010) {
                        return { bg: '#FFF9C4', text: '#F57F17' };  // Yellow (matches features.priority-medium-missing)
                    } else {
                        return { bg: '#FFCDD2', text: '#C62828' };  // Light red (matches features.priority-missing)
                    }
                }
                return { bg: 'white', text: '#333' };
            }

            // MILEAGE: Material Design scale matching features
            if (field === 'mileage') {
                const mileageMatch = value.toString().match(/(\d+)/);
                if (mileageMatch) {
                    const km = parseInt(mileageMatch[1]);

                    if (km <= 50000) {
                        return { bg: '#1B5E20', text: '#FFFFFF' };  // Dark green - surprisingly excellent
                    } else if (km <= 80000) {
                        return { bg: '#388E3C', text: '#FFFFFF' };  // Material Green - excellent
                    } else if (km <= 100000) {
                        return { bg: '#4CAF50', text: '#FFFFFF' };  // Green - very good
                    } else if (km <= 120000) {
                        return { bg: '#7CB342', text: '#FFFFFF' };  // Light-dark green - good
                    } else if (km <= 140000) {
                        return { bg: '#E8F5E9', text: '#1b5e20' };  // Light green - ok (matches features.active)
                    } else if (km <= 160000) {
                        return { bg: '#FFF9C4', text: '#F57F17' };  // Yellow - much (matches features.priority-medium-missing)
                    } else if (km <= 180000) {
                        return { bg: '#FFD54F', text: '#E65100' };  // Amber - too much
                    } else if (km <= 200000) {
                        return { bg: '#FFB74D', text: '#E65100' };  // Orange - too much
                    } else {
                        return { bg: '#FFCDD2', text: '#C62828' };  // Light red - definitely too much (matches features.priority-missing)
                    }
                }
                return { bg: 'white', text: '#333' };
            }

            // PRICE: Material Design scale matching features
            if (field === 'price' || field === 'price_eur') {
                const cleanValue = value.toString().replace(/\s+/g, '').replace(/,/g, '');
                const priceMatch = cleanValue.match(/\d+/);
                if (priceMatch) {
                    const price = parseInt(priceMatch[0]);

                    // Use different thresholds for PLN vs EUR
                    if (field === 'price_eur') {
                        // EUR thresholds: 17k: very good, 18k: good, 19k: ok, 20k: can live, 21k: much, 22k: too much, 23k+: definitely too much
                        if (price <= 17000) {
                            return { bg: '#1B5E20', text: '#FFFFFF' };  // Dark green - very good
                        } else if (price <= 18000) {
                            return { bg: '#388E3C', text: '#FFFFFF' };  // Material Green - good
                        } else if (price <= 19000) {
                            return { bg: '#4CAF50', text: '#FFFFFF' };  // Green - ok
                        } else if (price <= 20000) {
                            return { bg: '#E8F5E9', text: '#1b5e20' };  // Light green - can live with (matches features.active)
                        } else if (price <= 21000) {
                            return { bg: '#FFF9C4', text: '#F57F17' };  // Yellow - much (matches features.priority-medium-missing)
                        } else if (price <= 22000) {
                            return { bg: '#FFB74D', text: '#E65100' };  // Orange - too much
                        } else {
                            return { bg: '#FFCDD2', text: '#C62828' };  // Light red - definitely too much (matches features.priority-missing)
                        }
                    } else {
                        // PLN thresholds (converted from EUR thresholds: EUR × 100 / 23.50)
                        if (price <= 72000) {
                            return { bg: '#1B5E20', text: '#FFFFFF' };  // Dark green - very good
                        } else if (price <= 77000) {
                            return { bg: '#388E3C', text: '#FFFFFF' };  // Material Green - good
                        } else if (price <= 81000) {
                            return { bg: '#4CAF50', text: '#FFFFFF' };  // Green - ok
                        } else if (price <= 85000) {
                            return { bg: '#E8F5E9', text: '#1b5e20' };  // Light green - can live with (matches features.active)
                        } else if (price <= 89000) {
                            return { bg: '#FFF9C4', text: '#F57F17' };  // Yellow - much (matches features.priority-medium-missing)
                        } else if (price <= 94000) {
                            return { bg: '#FFB74D', text: '#E65100' };  // Orange - too much
                        } else {
                            return { bg: '#FFCDD2', text: '#C62828' };  // Light red - definitely too much (matches features.priority-missing)
                        }
                    }
                }
                return { bg: 'white', text: '#333' };
            }

            // Seat type: Alcantara/Leather=good, Cloth=bad, others=neutral
            if (field === 'seat_type') {
                if (value === 'Alcantara' || value === 'Leather') {
                    return { bg: '#E8F5E9', text: '#1b5e20' };  // Green - good
                } else if (value === 'Cloth' || value === 'Fabric') {
                    return { bg: '#FFEBEE', text: '#c62828' };  // Red - bad
                } else {
                    return { bg: '#FFF9C4', text: '#F57F17' };  // Yellow - neutral
                }
            }

            // Owners: 1=good, others=bad
            if (field === 'owners') {
                if (value === '1') {
                    return { bg: '#E8F5E9', text: '#1b5e20' };  // Green - good
                } else {
                    return { bg: '#FFEBEE', text: '#c62828' };  // Red - bad
                }
            }

            // Tow hitch: Swiveling=best, No=bad, others=ok
            if (field === 'tow_hitch_type') {
                if (value === 'Swiveling') {
                    return { bg: '#C8E6C9', text: '#1b5e20' };  // Dark green - best
                } else if (value === 'No') {
                    return { bg: '#FFEBEE', text: '#c62828' };  // Red - bad
                } else {
                    return { bg: '#FFF9C4', text: '#F57F17' };  // Yellow - ok
                }
            }

            // Climate: no coloring
            return { bg: 'white', text: '#333' };
        };

        metadataFields.forEach(field => {
            const container = document.createElement('div');
            container.className = 'ui-metadata-field';

            const label = document.createElement('label');
            label.className = 'ui-metadata-label';
            label.textContent = field.label;
            container.appendChild(label);

            if (field.type === 'text') {
                // Text input field
                const input = document.createElement('input');
                input.className = 'ui-metadata-input';
                input.type = 'text';
                input.placeholder = field.placeholder || '';
                input.value = carData[field.key] || '';
                if (field.readonly) {
                    input.readOnly = true;
                }

                input.style.cssText = `
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 13px;
                    background-color: white;
                `;
                if (field.readonly) {
                    input.style.cursor = 'default';
                    // Don't set background color for readonly - let color formatting handle it
                }

                if (onMetadataChange && !field.readonly) {
                    input.addEventListener('change', (e) => {
                        // Update color based on value
                        const newColor = getMetadataColor(field.key, e.target.value);
                        input.style.backgroundColor = newColor.bg;
                        input.style.color = newColor.text;

                        // Auto-convert PLN to EUR for price_eur field
                        if (field.key === 'price' && e.target.value) {
                            const prnPrice = parseFloat(e.target.value);
                            if (!isNaN(prnPrice)) {
                                // Conversion: 100 PLN = 23.50 EUR → 1 PLN = 0.235 EUR
                                const eurPrice = (prnPrice * 23.50 / 100).toFixed(2);
                                // Find and update the EUR input
                                const eurInput = container.parentElement.querySelector('input[data-field="price_eur"]');
                                if (eurInput) {
                                    eurInput.value = eurPrice;
                                    // Update EUR input color too
                                    const eurColor = getMetadataColor('price_eur', eurPrice);
                                    eurInput.style.backgroundColor = eurColor.bg;
                                    eurInput.style.color = eurColor.text;
                                    if (onMetadataChange) {
                                        onMetadataChange({ price_eur: eurPrice });
                                    }
                                }
                            }
                        }
                        onMetadataChange({ [field.key]: e.target.value });
                    });

                    // Also update color on input (live preview as user types)
                    input.addEventListener('input', (e) => {
                        const newColor = getMetadataColor(field.key, e.target.value);
                        input.style.backgroundColor = newColor.bg;
                        input.style.color = newColor.text;
                    });
                }

                if (field.key === 'price_eur') {
                    input.setAttribute('data-field', 'price_eur');
                }

                container.appendChild(input);

                // Apply initial color based on current value (for both editable AND readonly fields)
                if (input.value) {
                    const initialColor = getMetadataColor(field.key, input.value);
                    input.style.backgroundColor = initialColor.bg;
                    input.style.color = initialColor.text;
                }
            } else {
                // Select dropdown field
                const select = document.createElement('select');
                select.className = 'ui-metadata-select';

                // Add options FIRST, then set value
                field.options.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText === 'Не вказано' ? '' : optionText;
                    option.textContent = optionText;
                    select.appendChild(option);
                });

                // NOW set the value (after options exist)
                const savedValue = carData[field.key] || '';
                select.value = savedValue;

                // Apply initial color based on the set value
                const initialColor = getMetadataColor(field.key, select.value);
                select.style.backgroundColor = initialColor.bg;
                select.style.color = initialColor.text;

                if (onMetadataChange) {
                    select.addEventListener('change', (e) => {
                        // Update color based on selection
                        const newColor = getMetadataColor(field.key, e.target.value);
                        select.style.backgroundColor = newColor.bg;
                        select.style.color = newColor.text;

                        onMetadataChange({ [field.key]: e.target.value });
                    });
                }

                container.appendChild(select);
            }

            section.appendChild(container);
        });

        return section;
    },

    // Get standard colors
    getColors() {
        // Rating-based colors (strongly typed - vibrant)
        // + Optional colors (muted/desaturated)
        return [
            '#e0e0e0',  // No rating (gray) - strongly typed
            '#2E7D32',  // Best (dark green) - strongly typed
            '#D4E157',  // Good (yellow-green) - strongly typed
            '#FDD835',  // Fair (orange-yellow) - strongly typed
            '#FF7043',  // Poor (orange) - strongly typed
            '#F44336',  // Excluded (red) - strongly typed
            '#64B5F6',  // Light blue (muted) - optional
            '#B39DDB',  // Light purple (muted) - optional
            '#80DEEA',  // Light cyan (muted) - optional
            '#FFAB91',  // Light coral (muted) - optional
            '#A1887F',  // Taupe (muted) - optional
            '#C2E59C'   // Light green (muted) - optional
        ];
    },

    // Create section label
    createSectionLabel(text) {
        const label = document.createElement('label');
        label.className = 'ui-section-label';
        label.textContent = text;
        return label;
    }
};
