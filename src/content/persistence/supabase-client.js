// Supabase client for content scripts
// Uses REST API directly - no background worker routing

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================
// Change ENV_SUFFIX to switch between environments:
//   '_local'  = Development (use _local suffix on tables)
//   ''   = Production (use _prod suffix on tables)
// ========================================
// const ENV_SUFFIX = '_local';
const ENV_SUFFIX = '';

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
                    price_eur: row.price_eur || null,
                    year: row.year || null,
                    mileage: row.mileage || null,
                    address: row.address || null,
                    interior: row.interior || null,
                    seat_type: row.seat_type || null,
                    climate: row.climate || null,
                    owners: row.owners || null,
                    tow_hitch_type: row.tow_hitch_type || null
                };
            }

            return null;
        } catch (error) {
            console.error('[SupabaseApi.getCarData] Error:', error);
            return null;
        }
    },

    // Get only car metadata WITHOUT fetching features (avoids duplicate requests)
    async getCarDataMetadataOnly(carId) {
        if (!await window.SupabaseClient.isReady()) {
            console.log('[SupabaseApi] Not configured');
            return null;
        }

        try {
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseApi.getCarDataMetadataOnly] GET', url);

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
            console.log('[SupabaseApi.getCarDataMetadataOnly] Response:', data);

            if (Array.isArray(data) && data.length > 0) {
                const row = data[0];

                // Don't fetch features - caller should already have them
                return {
                    text: row.text,
                    color: row.color,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    sort: row.sort,
                    confirmed: row.confirmed || false,
                    featuresSource: row.features_source || null,
                    make: row.make || null,
                    model: row.model || null,
                    price: row.price || null,
                    price_eur: row.price_eur || null,
                    year: row.year || null,
                    mileage: row.mileage || null,
                    address: row.address || null,
                    interior: row.interior || null,
                    seat_type: row.seat_type || null,
                    climate: row.climate || null,
                    owners: row.owners || null,
                    tow_hitch_type: row.tow_hitch_type || null
                };
            }

            return null;
        } catch (error) {
            console.error('[SupabaseApi.getCarDataMetadataOnly] Error:', error);
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
                        price_eur: row.price_eur || null,
                        year: row.year || null,
                        mileage: row.mileage || null,
                        address: row.address || null,
                        interior: row.interior || null,
                        seat_type: row.seat_type || null,
                        climate: row.climate || null,
                        owners: row.owners || null,
                        tow_hitch_type: row.tow_hitch_type || null
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
                    color: noteData.color || '#e0e0e0'  // Default to gray (no rating)
                }),
                ...(featuresData && {
                    sort: featuresData.sort || 0,
                    confirmed: featuresData.confirmed || false,
                    features_source: featuresData.featuresSource || null
                }),
                ...(metadata.make && { make: metadata.make }),
                ...(metadata.model && { model: metadata.model }),
                ...(metadata.price && { price: metadata.price }),
                ...(metadata.price_eur && { price_eur: metadata.price_eur }),
                ...(metadata.mileage && { mileage: metadata.mileage }),
                ...(metadata.year && { year: metadata.year }),
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
                color: noteData?.color || '#e0e0e0',  // Default to gray (no rating)
                sort: featuresData?.sort || 0,
                confirmed: featuresData?.confirmed || false,
                features_source: featuresData?.featuresSource || null,
                make: metadata.make || null,
                model: metadata.model || null,
                price: metadata.price || null,
                price_eur: metadata.price_eur || null,
                mileage: metadata.mileage || null,
                year: metadata.year || null,
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

    // Update only note text and color (independent operation)
    async updateNoteText(carId, text, color) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            const payload = {
                text: text,
                color: color || '#e0e0e0',
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.updateNoteText] PATCH', updateUrl, payload);

            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[SupabaseApi.updateNoteText] Failed:', response.status, errorText);
                return { success: false, error: errorText };
            }

            console.log('[SupabaseApi.updateNoteText] ✅ Updated');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.updateNoteText] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Upsert note text and color - INSERT if not exists, UPDATE if exists
    async upsertNoteText(carId, text, color) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            // First, try to PATCH (update)
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            const payload = {
                text: text,
                color: color || '#e0e0e0',
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.upsertNoteText] PATCH', updateUrl, payload);

            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[SupabaseApi.upsertNoteText] PATCH failed:', response.status, errorText);
                // Fall through to INSERT
            } else {
                const updated = await response.json();
                if (Array.isArray(updated) && updated.length > 0) {
                    console.log('[SupabaseApi.upsertNoteText] ✅ Updated existing record');
                    return { success: true };
                }
                // No rows updated, need to INSERT
            }

            // Record doesn't exist, INSERT it
            console.log('[SupabaseApi.upsertNoteText] No existing record, creating new one...');
            const insertUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}`;
            const insertPayload = {
                car_id: carId,
                text: text,
                color: color || '#e0e0e0',
                sort: null,  // Explicitly set to null (no rating)
                confirmed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.upsertNoteText] POST', insertUrl, insertPayload);

            const insertResponse = await fetch(insertUrl, {
                method: 'POST',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(insertPayload)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.warn('[SupabaseApi.upsertNoteText] INSERT failed:', insertResponse.status, errorText);
                return { success: false, error: errorText };
            }

            console.log('[SupabaseApi.upsertNoteText] ✅ Created new record');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.upsertNoteText] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Upsert note with both color AND sort in single request
    async upsertNoteTextWithSort(carId, text, color, sort) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            // First, try to PATCH (update)
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            const payload = {
                text: text,
                color: color || '#e0e0e0',
                sort: sort === undefined ? null : sort,  // Ensure sort is saved
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.upsertNoteTextWithSort] PATCH', updateUrl, payload);

            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[SupabaseApi.upsertNoteTextWithSort] PATCH failed:', response.status, errorText);
                // Fall through to INSERT
            } else {
                const updated = await response.json();
                if (Array.isArray(updated) && updated.length > 0) {
                    console.log('[SupabaseApi.upsertNoteTextWithSort] ✅ Updated existing record');
                    return { success: true };
                }
                // No rows updated, need to INSERT
            }

            // Record doesn't exist, INSERT it
            console.log('[SupabaseApi.upsertNoteTextWithSort] No existing record, creating new one...');
            const insertUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}`;
            const insertPayload = {
                car_id: carId,
                text: text,
                color: color || '#e0e0e0',
                sort: sort === undefined ? null : sort,  // Explicitly set sort
                confirmed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.upsertNoteTextWithSort] POST', insertUrl, insertPayload);

            const insertResponse = await fetch(insertUrl, {
                method: 'POST',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(insertPayload)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.warn('[SupabaseApi.upsertNoteTextWithSort] INSERT failed:', insertResponse.status, errorText);
                return { success: false, error: errorText };
            }

            console.log('[SupabaseApi.upsertNoteTextWithSort] ✅ Created new record with color and sort');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.upsertNoteTextWithSort] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update only sort/rating (independent operation)
    async updateSort(carId, sort) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            const payload = {
                sort: sort,
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.updateSort] PATCH', updateUrl, payload);

            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[SupabaseApi.updateSort] Failed:', response.status, errorText);
                return { success: false, error: errorText };
            }

            console.log('[SupabaseApi.updateSort] ✅ Updated');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.updateSort] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update only verified/confirmed status (independent operation)
    async updateConfirmed(carId, confirmed) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            const payload = {
                confirmed: confirmed,
                updated_at: new Date().toISOString()
            };

            console.log('[SupabaseApi.updateConfirmed] PATCH', updateUrl, payload);

            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[SupabaseApi.updateConfirmed] Failed:', response.status, errorText);
                return { success: false, error: errorText };
            }

            console.log('[SupabaseApi.updateConfirmed] ✅ Updated');
            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.updateConfirmed] Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update only metadata field (independent operation)
    async updateMetadataField(carId, fieldName, fieldValue) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            const payload = {
                [fieldName]: fieldValue,
                updated_at: new Date().toISOString()
            };

            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseApi.updateMetadataField] Failed:', response.status, errorText);
                return { success: false, error: errorText };
            }

            return { success: true };
        } catch (error) {
            console.error('[SupabaseApi.updateMetadataField] Error:', error);
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
            // Step 1: Delete related features first (foreign key constraint)
            const featureUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseApi.deleteCarData] DELETE features:', featureUrl);

            const featureResponse = await fetch(featureUrl, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!featureResponse.ok) {
                const errorText = await featureResponse.text();
                console.warn('[SupabaseApi.deleteCarData] Warning deleting features:', featureResponse.status, errorText);
                // Don't throw - continue to delete car data anyway
            } else {
                console.log('[SupabaseApi.deleteCarData] ✅ Deleted related features');
            }

            // Step 2: Delete the car data itself
            const carUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseApi.deleteCarData] DELETE car:', carUrl);

            const response = await fetch(carUrl, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseApi.deleteCarData] Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('[SupabaseApi.deleteCarData] ✅ Deleted car data');
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

            // DEBUG: Show all feature keys
            console.log('[SupabaseApi.getFeatureConfig] Feature keys:', data.map(f => f.key).join(', '));

            // DEBUG: Specifically look for camera
            const hasCamera = data.find(f => f.key === 'feature_camera');
            console.log('[SupabaseApi.getFeatureConfig] Has feature_camera?', hasCamera ? 'YES ✅' : 'NO ❌');
            if (hasCamera) {
                console.log('[SupabaseApi.getFeatureConfig] Camera details:', hasCamera);
            }

            return data || [];
        } catch (error) {
            console.error('[SupabaseApi.getFeatureConfig] Error:', error);
            return [];
        }
    },

    // Get all features for a specific car (lightweight - only state + feature_id, no config joins)
    async getCarFeatures(carId) {
        if (!await window.SupabaseClient.isReady()) return {};

        try {
            // Only fetch feature_id and state - NO JOIN with config table
            const url = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_FEATURES}?car_id=eq.${encodeURIComponent(carId)}&select=feature_id,state`;
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

            // Get cached feature config to map feature_id to key (use FeaturesManager cache)
            const featureConfig = await window.FeaturesManager?.getFeatureConfig?.() || await this.getFeatureConfig();
            const idToKey = {};
            featureConfig.forEach(fc => {
                idToKey[fc.id] = fc.key;
            });

            // Convert to object: { key: state }
            const features = {};
            data.forEach(row => {
                const key = idToKey[row.feature_id];
                if (key) {
                    features[key] = row.state;
                }
            });

            return features;
        } catch (error) {
            console.error('[SupabaseApi.getCarFeatures] Error:', error);
            return {};
        }
    },

    // Save car features (bulk upsert)
    async saveCarFeaturesNew(carId, features, sort = null, confirmed = false) {
        if (!await window.SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            console.log('[SupabaseApi.saveCarFeaturesNew] Saving features for:', carId, 'confirmed:', confirmed);

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
                            color: '#e0e0e0',  // Default gray (no rating)
                            sort: null,         // Explicitly set to null (no rating) - NOT 5 stars
                            confirmed: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
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

            // First, get feature config to map keys to IDs (use FeaturesManager cache)
            const featureConfig = await window.FeaturesManager?.getFeatureConfig?.() || await this.getFeatureConfig();
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

            console.log('[SupabaseApi.saveCarFeaturesNew] ✅ Saved features');

            // Update sort and confirmed status on car_data_local
            if ((sort !== null && sort !== undefined) || (confirmed !== undefined && confirmed !== null)) {
                try {
                    const updatePayload = {};
                    if (sort !== null && sort !== undefined) {
                        console.log('[SupabaseApi.saveCarFeaturesNew] Updating sort to:', sort);
                        updatePayload.sort = sort;
                    }
                    if (confirmed !== undefined && confirmed !== null) {
                        console.log('[SupabaseApi.saveCarFeaturesNew] Updating confirmed status to:', confirmed);
                        updatePayload.confirmed = confirmed;
                    }

                    const updateUrl = `${window.SupabaseClient.url}/rest/v1/${TABLE_CAR_DATA}?car_id=eq.${encodeURIComponent(carId)}`;
                    const updateResponse = await fetch(updateUrl, {
                        method: 'PATCH',
                        headers: {
                            'apikey': window.SupabaseClient.key,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatePayload)
                    });

                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        console.warn('[SupabaseApi.saveCarFeaturesNew] Warning updating car_data:', errorText);
                    } else {
                        console.log('[SupabaseApi.saveCarFeaturesNew] ✅ Updated car_data with sort and/or confirmed');
                    }
                } catch (updateError) {
                    console.warn('[SupabaseApi.saveCarFeaturesNew] Warning updating car_data:', updateError);
                }
            }

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
            // Get feature ID from key - FORCE REFRESH to ensure latest features from database
            const featureConfig = await window.FeaturesManager?.getFeatureConfig?.(true) || await this.getFeatureConfig();

            // Trim all keys in case of whitespace issues in database
            const trimmedConfig = featureConfig.map(f => ({ ...f, key: f.key.trim() }));
            const feature = trimmedConfig.find(f => f.key === featureKey.trim());

            if (!feature) {
                console.error('[SupabaseApi.updateCarFeature] Feature not found:', featureKey);
                return { success: false, error: 'Feature not found' };
            }

            // Get feature ID
            // Note: featureConfig was fetched with force refresh above
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

// Log that SupabaseApi has been initialized
console.log('[SupabaseApi] ✅ Initialized. updateCarFeature exists:', typeof window.SupabaseApi.updateCarFeature === 'function');
