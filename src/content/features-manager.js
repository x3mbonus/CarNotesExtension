// Features Manager - Manages feature state, persistence, and manual corrections

window.FeaturesManager = {
    // Feature importance levels (for color coding when missing)
    IMPORTANCE: {
        // Critical - Red if missing
        critical: ['ACC', 'Blind spot', 'Camera', 'Parking sensors'],
        // Important - Yellow if missing
        important: ['Matrix headlights', 'Keyless', 'Digital cockpit', 'HUD', 'Lane assist'],
        // Optional - Light gray if missing
        optional: ['Massage seats', 'Memory seats', 'Webasto', '360 camera']
    },

    /**
     * Get feature importance
     */
    getImportance(featureName) {
        if (this.IMPORTANCE.critical.includes(featureName)) return 'critical';
        if (this.IMPORTANCE.important.includes(featureName)) return 'important';
        return 'optional';
    },

    /**
     * Initialize features for a car listing
     * Load from DB if exists, otherwise parse from content
     */
    async initializeFeatures(carId, data) {
        // If data not provided, extract it from the page
        if (!data) {
            data = window.extractCarData?.();
            console.log('[FeaturesManager] Data not provided, extracted from page:', !!data);
        }

        // Try to load from database via message passing with timeout
        let savedFeatures = null;
        try {
            const fetchPromise = this.sendMessage('getCarFeatures', { carId });
            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => resolve(null), 2000) // 2 second timeout
            );
            savedFeatures = await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
            console.warn('[FeaturesManager] Error fetching from DB:', error);
            savedFeatures = null;
        }

        if (savedFeatures && savedFeatures.features) {
            // Use saved features from DB
            console.log('[FeaturesManager] Loaded features from DB');
            return {
                features: savedFeatures.features,
                confirmed: savedFeatures.confirmed || false,
                sort: savedFeatures.sort || null,
                isFromDb: true
            };
        }

        // Parse from content if not in DB or DB is unavailable
        console.log('[FeaturesManager] Parsing features from page content');
        if (!data) {
            console.warn('[FeaturesManager] No data available to parse features from');
            return {
                features: {},
                confirmed: false,
                sort: null,
                isFromDb: false
            };
        }

        const parsed = window.FeaturesParser.parseFeatures(data);
        const features = {};

        Object.entries(parsed).forEach(([featureName, isPresent]) => {
            features[featureName] = isPresent ? true : null; // null = unknown
        });

        return {
            features,
            confirmed: false,
            sort: null,
            isFromDb: false
        };
    },

    /**
     * Save features to database via message passing
     */
    async saveFeatures(carId, features, confirmed = false, sort = null) {
        return await this.sendMessage('saveCarFeatures', {
            carId,
            featuresData: {
                features,
                confirmed,
                sort,
                updatedAt: new Date().toISOString()
            }
        });
    },

    /**
     * Update single feature state
     */
    async updateFeature(carId, featureName, state) {
        // state: true, false, or null
        console.log(`[FeaturesManager.updateFeature] Updating ${featureName} to ${state} for car ${carId}`);
        
        // Get current state
        let current = await this.sendMessage('getCarFeatures', { carId });
        console.log(`[FeaturesManager.updateFeature] Fetched current data:`, current);
        
        // If no existing data (new car), create new record with all features from UI
        // Get the current features from the UnifiedPanel to preserve all features
        if (!current) {
            console.log(`[FeaturesManager.updateFeature] No existing data, seeding from UnifiedPanel.currentFeatures`);
            const allFeatures = window.UnifiedPanel?.currentFeatures || {};
            current = {
                features: { ...allFeatures },  // Copy all current features
                confirmed: false,
                sort: null
            };
            console.log(`[FeaturesManager.updateFeature] Seeded with ${Object.keys(current.features).length} features`);
        }

        current.features[featureName] = state;
        console.log(`[FeaturesManager.updateFeature] Updated features:`, current.features);
        return await this.saveFeatures(carId, current.features, current.confirmed, current.sort);
    },

    /**
     * Send message to background script with retry logic
     */
    async sendMessage(action, data) {
        console.log(`[FeaturesManager.sendMessage] Sending to background: action="${action}"`, data);
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(
                    {
                        action: action,
                        ...data
                    },
                    (response) => {
                        console.log(`[FeaturesManager.sendMessage] Response received for action="${action}":`, response);
                        if (chrome.runtime.lastError) {
                            // Ignore if receiving end doesn't exist (background script not ready yet)
                            if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
                                console.warn(`[FeaturesManager.sendMessage] Background not ready, retrying in 500ms...`);
                                // Retry after 500ms
                                setTimeout(() => {
                                    this.sendMessage(action, data).then(resolve);
                                }, 500);
                            } else {
                                console.error(`[FeaturesManager.sendMessage] Message error for action="${action}":`, chrome.runtime.lastError);
                                resolve(null);
                            }
                        } else {
                            console.log(`[FeaturesManager.sendMessage] Success for action="${action}"`);
                            resolve(response);
                        }
                    }
                );
            } catch (error) {
                console.error('[FeaturesManager.sendMessage] Exception:', error);
                resolve(null);
            }
        });
    },

    /**
     * Toggle feature state: true -> null -> false -> true
     */
    async toggleFeature(carId, featureName, currentState) {
        let nextState;
        if (currentState === true) {
            nextState = null;
        } else if (currentState === null) {
            nextState = false;
        } else {
            nextState = true;
        }
        return await this.updateFeature(carId, featureName, nextState);
    },

    /**
     * Mark all features as confirmed
     */
    async confirmAllFeatures(carId, features, sort = null, confirmed = true) {
        return await this.saveFeatures(carId, features, confirmed, sort);
    },

    /**
     * Get statistics
     */
    getStatistics(features) {
        let total = 0;
        let present = 0;
        let unknown = 0;

        Object.values(features).forEach(state => {
            total++;
            if (state === true) present++;
            if (state === null) unknown++;
        });

        return {
            total,
            present,
            unknown,
            missing: total - present - unknown,
            percentage: Math.round((present / total) * 100)
        };
    }
};
