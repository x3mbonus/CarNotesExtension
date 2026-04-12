// Features Manager - Manages feature state, persistence, and manual corrections
// NEW: Works with features_config table and car_features junction table

window.FeaturesManager = {
    featureConfigCache: null,
    fullFeaturesListCache: null,  // Cache for the full features list with config and metadata
    carFeaturesCache: {},  // Cache for features by carId: { carId: { features, sort, confirmed } }
    carDataCache: {},  // Cache for car metadata by carId: { carId: { text, color, sort, confirmed, ... } }

    /**
     * Get full features list with config and metadata
     * This is used globally by UI components to avoid recreating lists
     */
    async getFullFeaturesConfig() {
        // Return cache if available
        if (this.fullFeaturesListCache) {
            return this.fullFeaturesListCache;
        }

        // Build the full features list with priority metadata
        this.fullFeaturesListCache = [
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

        console.log('[FeaturesManager] Cached full features list:', this.fullFeaturesListCache.length, 'features');
        return this.fullFeaturesListCache;
    },

    /**
     * Get feature config - load once and cache globally (with localStorage backup)
     */
    async getFeatureConfig() {
        // Check in-memory cache first
        if (this.featureConfigCache) {
            console.log('[FeaturesManager.getFeatureConfig] ✅ In-memory cache HIT');
            return this.featureConfigCache;
        }

        // Check localStorage with expiration
        const cached = this.getFeatureConfigFromStorage();
        if (cached) {
            console.log('[FeaturesManager.getFeatureConfig] ✅ localStorage cache HIT');
            this.featureConfigCache = cached;
            return cached;
        }

        // Fetch from API if not cached
        try {
            console.log('[FeaturesManager.getFeatureConfig] 📡 Fetching from API...');
            this.featureConfigCache = await window.SupabaseApi.getFeatureConfig();
            // Save to localStorage with timestamp
            this.saveFeatureConfigToStorage(this.featureConfigCache);
            console.log('[FeaturesManager.getFeatureConfig] ✅ Loaded from API & cached:', this.featureConfigCache.length, 'features');
            return this.featureConfigCache;
        } catch (error) {
            console.error('[FeaturesManager] Error loading feature config:', error);
            return [];
        }
    },

    /**
     * Get feature config from localStorage if still valid (1 hour expiration)
     */
    getFeatureConfigFromStorage() {
        try {
            const stored = localStorage.getItem('featureConfigCache');
            if (!stored) return null;

            const data = JSON.parse(stored);
            const now = Date.now();
            const expirationTime = 60 * 60 * 1000; // 1 hour in milliseconds

            if (now - data.timestamp > expirationTime) {
                console.log('[FeaturesManager] Feature config cache expired');
                localStorage.removeItem('featureConfigCache');
                return null;
            }

            return data.config;
        } catch (error) {
            console.warn('[FeaturesManager] Error reading feature config from storage:', error);
            return null;
        }
    },

    /**
     * Save feature config to localStorage with timestamp
     */
    saveFeatureConfigToStorage(config) {
        try {
            const data = {
                config: config,
                timestamp: Date.now()
            };
            localStorage.setItem('featureConfigCache', JSON.stringify(data));
        } catch (error) {
            console.warn('[FeaturesManager] Error saving feature config to storage:', error);
        }
    },

    /**
     * Initialize features for a car listing
     * Load from DB or parse from content
     */
    async initializeFeatures(carId, data) {
        // CHECK CACHE FIRST - Return cached features for this carId
        if (this.carFeaturesCache[carId]) {
            console.log('[FeaturesManager] ✅ CACHE HIT: Returning cached features for car:', carId);
            return this.carFeaturesCache[carId];
        }

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
            // Get car metadata WITHOUT re-fetching features (uses cache to prevent duplicates)
            const carData = await this.getCarDataMetdata(carId);
            const result = {
                features: dbFeatures,
                confirmed: carData?.confirmed || false,
                sort: carData?.sort || null,
                isFromDb: true,
                featuresSource: carData?.featuresSource || 'manual'
            };
            // CACHE THE RESULT
            this.carFeaturesCache[carId] = result;
            console.log('[FeaturesManager] 💾 CACHED features for car:', carId);
            return result;
        }

        // Parse from content if not in DB
        console.log('[FeaturesManager] Parsing features from page content');
        if (!data) {
            console.warn('[FeaturesManager] No data available to parse features from');
            const result = {
                features: {},
                confirmed: false,
                sort: null,
                isFromDb: false,
                featuresSource: null
            };
            this.carFeaturesCache[carId] = result;
            return result;
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

        const result = {
            features,
            confirmed: false,
            sort: null,
            isFromDb: false,
            featuresSource: 'parsed'
        };
        // CACHE THE RESULT
        this.carFeaturesCache[carId] = result;
        console.log('[FeaturesManager] 💾 CACHED parsed features for car:', carId);
        return result;
    },

    /**
     * Save features to database using new car_features table
     */
    async saveFeatures(carId, features, sort = null, confirmed = false) {
        console.log('[FeaturesManager.saveFeatures] Saving', Object.keys(features).length, 'features for car:', carId, 'sort:', sort, 'confirmed:', confirmed);
        return await window.SupabaseApi.saveCarFeaturesNew(carId, features, sort, confirmed);
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
     * Get car data metadata with caching to prevent duplicate requests
     */
    async getCarDataMetdata(carId) {
        // Check cache first
        if (this.carDataCache[carId]) {
            console.log('[FeaturesManager.getCarDataMetadata] ✅ CACHE HIT for car:', carId);
            return this.carDataCache[carId];
        }

        // Fetch from API
        const data = await window.SupabaseApi?.getCarDataMetadataOnly?.(carId);
        if (data) {
            // Cache the result
            this.carDataCache[carId] = data;
            console.log('[FeaturesManager.getCarDataMetadata] 💾 CACHED car data for car:', carId);
        }
        return data;
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

