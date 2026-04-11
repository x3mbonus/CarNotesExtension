// Supabase client for content scripts
// Uses REST API directly - no background worker routing

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================
// Change ENV_SUFFIX to switch between environments:
//   '_local'  = Development (use _local suffix on tables)
//   '_prod'   = Production (use _prod suffix on tables)
// ========================================
const ENV_SUFFIX = '_local';
// const ENV_SUFFIX = '_prod';

const TABLE_CAR_DATA = `car_data${ENV_SUFFIX}`;
const TABLE_FEATURES_CONFIG = `features_config${ENV_SUFFIX}`;
const TABLE_CAR_FEATURES = `car_features${ENV_SUFFIX}`;

window.SupabaseClient = {
    url: null,
    key: null,
    isConfigured: false,
    lastError: null,

    // Initialize with credentials from storage
    async init() {
        return new Promise((resolve) => {
            console.log('[SupabaseClient.init] Loading credentials from storage...');
            chrome.storage.sync.get(['supabaseUrl', 'supabaseKey'], (result) => {
                if (!result.supabaseUrl || !result.supabaseKey) {
                    console.warn('[SupabaseClient.init] Credentials not found');
                    this.isConfigured = false;
                    resolve(false);
                    return;
                }

                try {
                    this.url = result.supabaseUrl.replace(/\/$/, '');
                    this.key = result.supabaseKey;
                    this.isConfigured = true;
                    console.log('[SupabaseClient.init] ✅ Ready:', this.url);
                } catch (error) {
                    console.error('[SupabaseClient.init] ❌ Error:', error);
                    this.isConfigured = false;
                }

                resolve(this.isConfigured);
            });
        });
    },

    // Check if ready
    async isReady() {
        if (this.isConfigured && this.url && this.key) return true;
        return await this.init();
    },

    // Get credentials
    async getCredentials() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['supabaseUrl', 'supabaseKey'], (result) => {
                resolve({
                    url: result.supabaseUrl || '',
                    key: result.supabaseKey || ''
                });
            });
        });
    },

    // Save and test credentials
    async setCredentials(url, key) {
        return new Promise(async (resolve) => {
            try {
                const testUrl = url.replace(/\/$/, '');
                const response = await fetch(`${testUrl}/rest/v1/${TABLE_CAR_DATA}?limit=1`, {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                chrome.storage.sync.set({
                    supabaseUrl: url,
                    supabaseKey: key
                }, () => {
                    this.url = testUrl;
                    this.key = key;
                    this.isConfigured = true;
                    this.lastError = null;
                    resolve(true);
                });
            } catch (error) {
                console.error('[SupabaseClient] Connection test failed:', error);
                this.isConfigured = false;
                resolve(false);
            }
        });
    },

    // Clear credentials
    async clearCredentials() {
        return new Promise((resolve) => {
            chrome.storage.sync.remove(['supabaseUrl', 'supabaseKey'], () => {
                this.url = null;
                this.key = null;
                this.isConfigured = false;
                resolve();
            });
        });
    }
};

// Supabase REST API methods
window.SupabaseApi = {
    // Environment configuration
    ENV_SUFFIX,
    TABLE_CAR_DATA,
    TABLE_FEATURES_CONFIG,
    TABLE_CAR_FEATURES,

    // Get single car data
    async getCarData(carId) {
        if (!await window.SupabaseClient.isReady()) {
            console.log('[SupabaseApi] Not configured');
            return null;
        }

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseApi] GET', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseApi] Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[SupabaseApi] Response:', data);

            if (Array.isArray(data) && data.length > 0) {
                const row = data[0];

                // Get features from car_features table (1:M relationship)
                const features = await this.getCarFeatures(carId) || {};

                return {
                    text: row.text,
                    color: row.color,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    features: features,
                    sort: row.sort,
                    confirmed: row.confirmed || false,
                    featuresSource: row.features_source || null,
                    make: row.make || null,
                    model: row.model || null,
                    price: row.price || null,
                    year: row.year || null,
                    mileage: row.mileage || null,
                    address: row.address || null,
                    interior: row.interior || null,
                    seat_type: row.seat_type || null,
                    climate: row.climate || null,
                    owners: row.owners || null
                };
            }

            return null;
        } catch (error) {
            console.error('[SupabaseApi.getCarData] Error:', error);
            return null;
        }
    },

    // Get multiple cars by IDs
    async getDataByIds(carIds) {
        if (!await window.SupabaseClient.isReady()) return {};

        try {
            if (!Array.isArray(carIds) || carIds.length === 0) return {};

            const idList = carIds.map(id => encodeURIComponent(id)).join(',');
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=in.(${idList})`;
            console.log('[SupabaseApi] GET', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const result = {};

            if (Array.isArray(data)) {
                for (const row of data) {
                    // Load features from car_features table (not from columns)
                    const features = await this.getCarFeatures(row.car_id) || {};

                    result[row.car_id] = {
                        text: row.text,
                        color: row.color,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                        features: features,
                        sort: row.sort,
                        confirmed: row.confirmed || false,
                        featuresSource: row.features_source || null,
                        make: row.make || null,
                        model: row.model || null,
                        price: row.price || null,
                        year: row.year || null,
                        mileage: row.mileage || null,
                        address: row.address || null,
                        interior: row.interior || null,
                        seat_type: row.seat_type || null,
                        climate: row.climate || null,
                        owners: row.owners || null
                    };
                }
            }

            return result;
        } catch (error) {
            console.error('[SupabaseApi.getDataByIds] Error:', error);
            return {};
        }
    },

    // Save car data (update or insert)
    async saveCarData(carId, noteData, featuresData, metadata = {}) {
        console.log('[SupabaseApi.saveCarData] Called:', { carId, noteData, featuresData, metadata });

        if (!await window.SupabaseClient.isReady()) {
            console.error('[SupabaseApi] Not configured');
            return { success: false, reason: 'not_configured' };
        }

        try {
            const now = new Date().toISOString();

            // Build update payload
            const updatePayload = {
                ...(noteData && {
                    text: noteData.text,
                    color: noteData.color || '#607D8B'  // Default to first color
                }),
                ...(featuresData && {
                    sort: featuresData.sort || 0,
                    confirmed: featuresData.confirmed || false,
                    features_source: featuresData.featuresSource || null
                }),
                ...(metadata.make && { make: metadata.make }),
                ...(metadata.model && { model: metadata.model }),
                ...(metadata.price && { price: metadata.price }),
                ...(metadata.seat_type && { seat_type: metadata.seat_type }),
                ...(metadata.climate && { climate: metadata.climate }),
                ...(metadata.owners && { owners: metadata.owners }),
                ...(metadata.tow_hitch_type && { tow_hitch_type: metadata.tow_hitch_type }),
                updated_at: now
            };

            // Try UPDATE first
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseApi] PATCH', updateUrl, updatePayload);

            const updateResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updatePayload)
            });

            if (!updateResponse.ok) {
                throw new Error(`PATCH failed: ${updateResponse.status}`);
            }

            const responseData = await updateResponse.json();
            console.log('[SupabaseApi] PATCH response:', responseData);

            // If rows updated, success
            if (Array.isArray(responseData) && responseData.length > 0) {
                console.log('✅ Updated');
                return { success: true };
            }

            // No rows updated, try INSERT
            console.log('[SupabaseApi] No rows updated, trying INSERT...');

            const insertPayload = {
                car_id: carId,
                text: noteData?.text || '',
                color: noteData?.color || '#607D8B',  // Default to first color
                sort: featuresData?.sort || 0,
                confirmed: featuresData?.confirmed || false,
                features_source: featuresData?.featuresSource || null,
                make: metadata.make || null,
                model: metadata.model || null,
                price: metadata.price || null,
                seat_type: metadata.seat_type || null,
                climate: metadata.climate || null,
                owners: metadata.owners || null,
                tow_hitch_type: metadata.tow_hitch_type || null,
                created_at: now,
                updated_at: now
            };

            const insertUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}`;
            console.log('[SupabaseApi] POST', insertUrl, insertPayload);

            const insertResponse = await fetch(insertUrl, {
                method: 'POST',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([insertPayload])
            });

            if (!insertResponse.ok) {
                throw new Error(`INSERT failed: ${insertResponse.status}`);
            }

            console.log('✅ Inserted');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.saveCarData] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete car data
    async deleteCarData(carId) {
        if (!await window.SupabaseClient.isReady()) {
            console.log('[SupabaseApi] Not configured');
            return { success: false, reason: 'not_configured' };
        }

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseApi] DELETE', url);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseApi] Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('✅ Deleted');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.deleteCarData] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // ==================== NEW: Features Table Methods ====================

    // Get features config (feature dictionary)
    async getFeatureConfig() {
        if (!await window.SupabaseClient.isReady()) return [];

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_FEATURES_CONFIG}?select=*&order=sort`;
            console.log('[SupabaseApi.getFeatureConfig] GET', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('[SupabaseApi.getFeatureConfig] Failed:', response.status);
                return [];
            }

            const data = await response.json();
            console.log('[SupabaseApi.getFeatureConfig] Got', data.length, 'features');
            return data || [];
        } catch (error) {
            console.error('[SupabaseApi.getFeatureConfig] Error:', error);
            return [];
        }
    },

    // Get all features for a specific car
    async getCarFeatures(carId) {
        if (!await window.SupabaseClient.isReady()) return {};

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}?car_id=eq.${encodeURIComponent(carId)}&select=${TABLE_FEATURES_CONFIG}(key,name_uk,priority,multiplier),state`;
            console.log('[SupabaseApi.getCarFeatures] GET', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('[SupabaseApi.getCarFeatures] Failed:', response.status);
                return {};
            }

            const data = await response.json();
            console.log('[SupabaseApi.getCarFeatures] Got', data.length, 'features for', carId);

            // Convert to object: { key: state }
            const features = {};
            const configColumnName = TABLE_FEATURES_CONFIG;
            data.forEach(row => {
                if (row[configColumnName]) {
                    features[row[configColumnName].key] = row.state;
                }
            });

            return features;
        } catch (error) {
            console.error('[SupabaseApi.getCarFeatures] Error:', error);
            return {};
        }
    },

    // Save car features (bulk upsert)
    async saveCarFeaturesNew(carId, features) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            console.log('[SupabaseApi.saveCarFeaturesNew] Saving features for:', carId);

            // Ensure car exists in car_data_local (required for foreign key)
            try {
                const checkUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}&select=car_id`;
                const checkResponse = await fetch(checkUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': window.SupabaseClient.key,
                        'Content-Type': 'application/json'
                    }
                });

                const existing = await checkResponse.json();

                if (!existing || existing.length === 0) {
                    console.log('[SupabaseApi.saveCarFeaturesNew] Car not found, creating entry...');
                    // Create minimal car entry to satisfy foreign key constraint
                    const createUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}`;
                    const createResponse = await fetch(createUrl, {
                        method: 'POST',
                        headers: {
                            'apikey': window.SupabaseClient.key,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            car_id: carId,
                            text: '',
                            color: '#607D8B'  // Default first color
                        })
                    });

                    if (!createResponse.ok) {
                        const errorText = await createResponse.text();
                        console.warn('[SupabaseApi.saveCarFeaturesNew] Warning: Could not create car entry:', errorText);
                        // Continue anyway - actual car data might be created separately
                    } else {
                        console.log('[SupabaseApi.saveCarFeaturesNew] ✓ Created car entry');
                    }
                }
            } catch (checkError) {
                console.warn('[SupabaseApi.saveCarFeaturesNew] Warning checking for car:', checkError);
                // Continue anyway
            }

            // First, get feature config to map keys to IDs
            const featureConfig = await this.getFeatureConfig();
            const keyToId = {};
            featureConfig.forEach(fc => {
                keyToId[fc.key] = fc.id;
            });

            // Prepare upsert payload
            const payload = [];
            Object.entries(features).forEach(([key, state]) => {
                const featureId = keyToId[key];
                if (featureId) {
                    payload.push({
                        car_id: carId,
                        feature_id: featureId,
                        state: state === true ? true : (state === false ? false : null)
                    });
                }
            });

            if (payload.length === 0) {
                console.log('[SupabaseApi.saveCarFeaturesNew] No features to save');
                return { success: true };
            }

            // Upsert using the new car_features table
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}?on_conflict=car_id,feature_id`;
            console.log('[SupabaseApi.saveCarFeaturesNew] PATCH', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseApi.saveCarFeaturesNew] Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}`);
            }

            console.log('[SupabaseApi.saveCarFeaturesNew] ✅ Saved');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.saveCarFeaturesNew] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update single feature state
    async updateCarFeature(carId, featureKey, state) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            // Get feature ID from key
            const featureConfig = await this.getFeatureConfig();
            const feature = featureConfig.find(f => f.key === featureKey);

            if (!feature) {
                console.error('[SupabaseApi.updateCarFeature] Feature not found:', featureKey);
                return { success: false, error: 'Feature not found' };
            }

            // Check if record exists
            const checkUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}?car_id=eq.${encodeURIComponent(carId)}&feature_id=eq.${feature.id}`;
            const checkResponse = await fetch(checkUrl, {
                method: 'GET',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            const existing = await checkResponse.json();

            if (existing.length > 0) {
                // Update
                const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}?car_id=eq.${encodeURIComponent(carId)}&feature_id=eq.${feature.id}`;
                const updateResponse = await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: {
                        'apikey': window.SupabaseClient.key,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        state: state === true ? true : (state === false ? false : null),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error(`PUT failed: ${updateResponse.status}`);
                }
            } else {
                // Insert
                const insertUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}`;
                const insertResponse = await fetch(insertUrl, {
                    method: 'POST',
                    headers: {
                        'apikey': window.SupabaseClient.key,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{
                        car_id: carId,
                        feature_id: feature.id,
                        state: state === true ? true : (state === false ? false : null)
                    }])
                });

                if (!insertResponse.ok) {
                    throw new Error(`POST failed: ${insertResponse.status}`);
                }
            }

            console.log('[SupabaseApi.updateCarFeature] ✅ Updated');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.updateCarFeature] Error:', error);
            return { success: false, error: error.message };
        }
    }
};

