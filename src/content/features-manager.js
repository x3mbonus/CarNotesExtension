// Features Manager - Manages feature state, persistence, and manual corrections
// NEW: Works with features_config table and car_features junction table

window.FeaturesManager = {
    featureConfigCache: null,

    /**
     * Load features config (feature dictionary) from database
     */
    async getFeatureConfig() {
        if (this.featureConfigCache) {
            return this.featureConfigCache;
        }

        try {
            this.featureConfigCache = await window.SupabaseApi.getFeatureConfig();
            console.log('[FeaturesManager] Loaded feature config:', this.featureConfigCache.length, 'features');
            return this.featureConfigCache;
        } catch (error) {
            console.error('[FeaturesManager] Error loading feature config:', error);
            return [];
        }
    },

    /**
     * Initialize features for a car listing
     * Load from DB or parse from content
     */
    async initializeFeatures(carId, data) {
        // If data not provided, extract it from the page
        if (!data) {
            data = window.extractCarData?.();
            console.log('[FeaturesManager] Data not provided, extracted from page:', !!data);
        }

        // Try to load from database first
        let dbFeatures = null;
        try {
            dbFeatures = await window.SupabaseApi.getCarFeatures(carId);
            console.log('[FeaturesManager] Loaded from DB:', Object.keys(dbFeatures || {}).length, 'features');
        } catch (error) {
            console.warn('[FeaturesManager] Error fetching from DB:', error);
        }

        // If we got data from DB, return it (it's already in the right format: { key: state })
        if (dbFeatures && Object.keys(dbFeatures).length > 0) {
            console.log('[FeaturesManager] Using DB features');
            // Get full car data to check confirmed/sort status
            const carData = await window.SupabaseApi.getCarData(carId);
            return {
                features: dbFeatures,
                confirmed: carData?.confirmed || false,
                sort: carData?.sort || null,
                isFromDb: true,
                featuresSource: carData?.featuresSource || 'manual'
            };
        }

        // Parse from content if not in DB
        console.log('[FeaturesManager] Parsing features from page content');
        if (!data) {
            console.warn('[FeaturesManager] No data available to parse features from');
            return {
                features: {},
                confirmed: false,
                sort: null,
                isFromDb: false,
                featuresSource: null
            };
        }

        // Get feature config to map feature names to keys
        const featureConfig = await this.getFeatureConfig();
        const nameToKey = {};
        featureConfig.forEach(fc => {
            nameToKey[fc.name_uk] = fc.key;
        });

        // Parse features
        const parsed = window.FeaturesParser.parseFeatures(data);
        const features = {};

        // Convert feature names to keys
        Object.entries(parsed).forEach(([featureName, isPresent]) => {
            // Try to find key from config, fallback to column name conversion
            let key = nameToKey[featureName];
            if (!key) {
                key = window.FeatureColumnMapper ?
                    window.FeatureColumnMapper.featureToColumnName(featureName) :
                    'feature_' + featureName.toLowerCase().replace(/\s+/g, '_');
            }
            features[key] = isPresent ? true : null; // null = unknown
        });

        return {
            features,
            confirmed: false,
            sort: null,
            isFromDb: false,
            featuresSource: 'parsed'
        };
    },

    /**
     * Save features to database using new car_features table
     */
    async saveFeatures(carId, features, sort = null, confirmed = false) {
        console.log('[FeaturesManager.saveFeatures] Saving', Object.keys(features).length, 'features for car:', carId, 'confirmed:', confirmed);
        return await window.SupabaseApi.saveCarFeaturesNew(carId, features, confirmed);
    },

    /**
     * Update single feature state
     */
    async updateFeature(carId, featureKey, state) {
        console.log(`[FeaturesManager.updateFeature] Updating ${featureKey} to ${state} for car ${carId}`);
        return await window.SupabaseApi.updateCarFeature(carId, featureKey, state);
    },

    /**
     * Toggle feature state: null → true → false → null (3-state cycle)
     * Cycling order: Unknown (?) → Present (✓) → Missing (✗) → Unknown (?)
     */
    toggleFeatureState(currentState) {
        if (currentState === null) {
            return true;  // ? → ✓
        } else if (currentState === true) {
            return false; // ✓ → ✗
        } else {
            return null;  // ✗ → ?
        }
    },

    async toggleFeature(carId, featureKey, currentState) {
        const nextState = this.toggleFeatureState(currentState);
        return await this.updateFeature(carId, featureKey, nextState);
    },

    /**
     * Mark all features as confirmed
     */
    async confirmAllFeatures(carId, features, sort = null, confirmed = true) {
        return await this.saveFeatures(carId, features, sort, confirmed);
    },

    /**
     * Get statistics about features
     */
    getStatistics(features) {
        let total = 0;
        let present = 0;
        let unknown = 0;
        let missing = 0;

        Object.values(features).forEach(state => {
            total++;
            if (state === true) {
                present++;
            } else if (state === null) {
                unknown++;
            } else if (state === false) {
                missing++;
            }
        });

        return {
            total,
            present,
            unknown,
            missing,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0
        };
    },

    /**
     * Get color for feature state based on priority
     * Returns: { present, unknown, missing } colors
     */
    getFeatureStateColors(priority) {
        const colors = {
            true: '#E8F5E9',   // Present = light green
            null: '#FAFAFA',   // Unknown = light gray
            false: {
                // Missing display color depends on priority
                0: '#FFFFFF',   // Low priority = white
                1: '#FFF8E1',   // Normal priority = light yellow
                2: '#FFEBEE'    // High priority = light red
            }
        };
        return colors;
    }
};

