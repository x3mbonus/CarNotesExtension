// Supabase client for content scripts
// Uses REST API directly - no background worker routing

const TABLE = 'car_data_local';  // Development (change to 'car_data' for production)

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
                const response = await fetch(`${testUrl}/rest/v1/${TABLE}?limit=1`, {
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
    TABLE: TABLE,

    // Get single car data
    async getCarData(carId) {
        if (!await window.SupabaseClient.isReady()) {
            console.log('[SupabaseApi] Not configured');
            return null;
        }

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE}?car_id=eq.${encodeURIComponent(carId)}`;
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
                const features = window.FeatureColumnMapper ?
                    window.FeatureColumnMapper.databaseRowToFeatures(row) : {};

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
                    price: row.price || null
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
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE}?car_id=in.(${idList})`;
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
                data.forEach(row => {
                    const features = window.FeatureColumnMapper ?
                        window.FeatureColumnMapper.databaseRowToFeatures(row) : {};

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
                        price: row.price || null
                    };
                });
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
                    color: noteData.color || '#FFEB3B'
                }),
                ...(featuresData && window.FeatureColumnMapper &&
                    window.FeatureColumnMapper.featuresToDatabaseRow(featuresData.features)),
                ...(featuresData && {
                    sort: featuresData.sort || 0,                    confirmed: featuresData.confirmed || false,                    features_source: featuresData.featuresSource || null
                }),
                ...(metadata.make && { make: metadata.make }),
                ...(metadata.model && { model: metadata.model }),
                ...(metadata.price && { price: metadata.price }),
                updated_at: now
            };

            // Try UPDATE first
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE}?car_id=eq.${encodeURIComponent(carId)}`;
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
                color: noteData?.color || '#FFEB3B',
                ...(featuresData && window.FeatureColumnMapper &&
                    window.FeatureColumnMapper.featuresToDatabaseRow(featuresData.features)),
                sort: featuresData?.sort || 0,
                confirmed: featuresData?.confirmed || false,
                features_source: featuresData?.featuresSource || null,
                make: metadata.make || null,
                model: metadata.model || null,
                price: metadata.price || null,
                created_at: now,
                updated_at: now
            };

            const insertUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE}`;
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

    // Get car features
    async getCarFeatures(carId) {
        console.log('[SupabaseApi.getCarFeatures] Called for:', carId);
        const data = await this.getCarData(carId);

        if (data && data.features) {
            const result = {
                features: data.features,
                sort: data.sort,
                confirmed: data.confirmed || false,
                updated_at: data.updatedAt
            };
            console.log('[SupabaseApi] Features:', Object.keys(data.features).length, 'features, confirmed:', data.confirmed);
            return result;
        }

        return null;
    },

    // Save car features
    async saveCarFeatures(carId, featuresData) {
        return this.saveCarData(carId, null, featuresData);
    },

    // Delete car data
    async deleteCarData(carId) {
        if (!await window.SupabaseClient.isReady()) {
            console.log('[SupabaseApi] Not configured');
            return { success: false, reason: 'not_configured' };
        }

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE}?car_id=eq.${encodeURIComponent(carId)}`;
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
    }
};
