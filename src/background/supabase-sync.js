// Supabase integration for Car Notes extension
// Uses REST API instead of JavaScript client to avoid CSP issues

// ==================== TABLE CONFIGURATION ====================
// Single consolidated table combining notes + features
// Change between dev/prod environments as needed
const TABLE = 'car_data_local';  // Development (combined notes + features)
// const TABLE = 'car_data';       // Production (combined notes + features)
// ================================================================

const SupabaseClient = {
    url: null,
    key: null,
    isConfigured: false,
    lastError: null,

    // Initialize with credentials from storage
    async init() {
        return new Promise((resolve) => {
            console.log('[SupabaseClient.init] Loading credentials from storage...');
            chrome.storage.sync.get(['supabaseUrl', 'supabaseKey'], (result) => {
                console.log('[SupabaseClient.init] Storage result:', {
                    hasUrl: !!result.supabaseUrl,
                    hasKey: !!result.supabaseKey
                });
                
                if (!result.supabaseUrl || !result.supabaseKey) {
                    console.warn('[SupabaseClient.init] Credentials not found in storage');
                    this.isConfigured = false;
                    resolve(false);
                    return;
                }

                try {
                    this.url = result.supabaseUrl.replace(/\/$/, ''); // Remove trailing slash
                    this.key = result.supabaseKey;
                    this.isConfigured = true;
                    console.log('[SupabaseClient.init] ✅ Supabase credentials loaded:', this.url);
                } catch (error) {
                    this.lastError = error.message;
                    console.error('[SupabaseClient.init] ❌ Error:', error);
                    this.isConfigured = false;
                }

                resolve(this.isConfigured);
            });
        });
    },

    // Check if Supabase is configured
    async isReady() {
        console.log('[SupabaseClient.isReady] Checking: isConfigured=', this.isConfigured, 'hasUrl=', !!this.url, 'hasKey=', !!this.key);
        if (this.isConfigured && this.url && this.key) {
            return true;
        }
        console.log('[SupabaseClient.isReady] Not ready, initializing...');
        return await this.init();
    },

    // Get existing credentials
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

    // Save credentials to secure storage and test connection
    async setCredentials(url, key) {
        return new Promise(async (resolve) => {
            // Test the connection first
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
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // Connection successful, save credentials
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
                this.lastError = error.message;
                console.error('❌ Connection test failed:', error);
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
                this.lastError = null;
                resolve();
            });
        });
    }
};

// Supabase sync functions using REST API
const SupabaseSync = {
    // FETCH: Get data by list of car IDs (efficient for listings)
    async getDataByIds(carIds) {
        if (!await SupabaseClient.isReady()) {
            console.log('[SupabaseSync.getDataByIds] Supabase not ready');
            return {};
        }

        try {
            if (!Array.isArray(carIds) || carIds.length === 0) {
                console.log('[SupabaseSync.getDataByIds] No car IDs provided');
                return {};
            }

            console.log('[SupabaseSync.getDataByIds] Fetching batch data for', carIds.length, 'cars');

            // Use 'in' operator for efficient filtering: car_id=in.(ID1,ID2,ID3)
            const idList = carIds.map(id => encodeURIComponent(id)).join(',');
            const url = `${SupabaseClient.url}/rest/v1/${TABLE}?car_id=in.(${idList})`;

            console.log('[SupabaseSync.getDataByIds] ========== SUPABASE API REQUEST ==========');
            console.log('[SupabaseSync.getDataByIds] Method: GET');
            console.log('[SupabaseSync.getDataByIds] URL:', url);
            console.log('[SupabaseSync.getDataByIds] Requesting', carIds.length, 'cars');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[SupabaseSync.getDataByIds] ========== SUPABASE API RESPONSE ==========');
            console.log('[SupabaseSync.getDataByIds] Status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseSync.getDataByIds] Error body:', errorText);
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[SupabaseSync.getDataByIds] Received', Array.isArray(data) ? data.length : 0, 'records');
            
            const result = {};

            if (Array.isArray(data)) {
                data.forEach(row => {
                    // Convert individual feature columns back to features object
                    const features = window.FeatureColumnMapper ?
                        window.FeatureColumnMapper.databaseRowToFeatures(row) : {};

                    result[row.car_id] = {
                        // Note fields
                        text: row.text,
                        color: row.color,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                        // Features fields
                        features: features,
                        sort: row.sort
                    };
                });
            }

            console.log('[SupabaseSync.getDataByIds] Returning results for', Object.keys(result).length, 'cars');
            return result;
        } catch (error) {
            console.error('❌ Supabase fetch data error:', error);
            return {};
        }
    },

    // FETCH: Get single car's data from DB (notes + features from separate columns)
    async getCarData(carId) {
        if (!await SupabaseClient.isReady()) {
            console.log('[SupabaseSync.getCarData] Supabase not ready');
            return null;
        }

        try {
            const url = `${SupabaseClient.url}/rest/v1/${TABLE}?car_id=eq.${encodeURIComponent(carId)}`;
            
            console.log('[SupabaseSync.getCarData] ========== SUPABASE API REQUEST ==========');
            console.log('[SupabaseSync.getCarData] Method: GET');
            console.log('[SupabaseSync.getCarData] URL:', url);
            console.log('[SupabaseSync.getCarData] Car ID:', carId);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[SupabaseSync.getCarData] ========== SUPABASE API RESPONSE ==========');
            console.log('[SupabaseSync.getCarData] Status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SupabaseSync.getCarData] Error body:', errorText);
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[SupabaseSync.getCarData] Response data:', data);

            if (Array.isArray(data) && data.length > 0) {
                const row = data[0];

                // Convert individual feature columns back to features object
                const features = window.FeatureColumnMapper ?
                    window.FeatureColumnMapper.databaseRowToFeatures(row) : {};

                const result = {
                    // Note fields
                    text: row.text,
                    color: row.color,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    // Features fields
                    features: features,
                    sort: row.sort
                };

                console.log('[SupabaseSync.getCarData] Returning:', result);
                return result;
            }

            console.log('[SupabaseSync.getCarData] No data found for car ID:', carId);
            return null;
        } catch (error) {
            console.error('❌ Supabase fetch data error:', error);
            return null;
        }
    },

    // SAVE: Update or insert car data (notes + separate feature columns)
    async saveCarData(carId, noteData, featuresData) {
        console.log('[SupabaseSync.saveCarData] Called with:', { carId, noteData, featuresData });
        
        const isReady = await SupabaseClient.isReady();
        console.log('[SupabaseSync.saveCarData] Supabase ready?', isReady);
        
        if (!isReady) {
            console.error('[SupabaseSync.saveCarData] Supabase not configured');
            return { success: false, reason: 'not_configured', conflict: false };
        }

        try {
            const now = new Date().toISOString();

            // Build update payload with both notes and features
            const updatePayload = {
                // Note fields
                ...(noteData && {
                    text: noteData.text,
                    color: noteData.color || '#FFEB3B'
                }),
                // Features fields - convert to individual columns
                ...(featuresData && window.FeatureColumnMapper &&
                    window.FeatureColumnMapper.featuresToDatabaseRow(featuresData.features)),
                // Metadata
                ...(featuresData && { sort: featuresData.sort || 0 }),
                updated_at: now
            };

            console.log('[SupabaseSync.saveCarData] Payload:', updatePayload);

            // Try UPDATE first
            const updateUrl = `${SupabaseClient.url}/rest/v1/${TABLE}?car_id=eq.${encodeURIComponent(carId)}`;
            console.log('[SupabaseSync.saveCarData] ========== SUPABASE API REQUEST ==========');
            console.log('[SupabaseSync.saveCarData] Method: PATCH');
            console.log('[SupabaseSync.saveCarData] URL:', updateUrl);
            console.log('[SupabaseSync.saveCarData] Headers: Content-Type: application/json');
            console.log('[SupabaseSync.saveCarData] Body:', JSON.stringify(updatePayload, null, 2));
            console.log('[SupabaseSync.saveCarData] ==========================================');
            
            const updateResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updatePayload)
            });

            const responseText = await updateResponse.text();
            console.log('[SupabaseSync.saveCarData] ========== SUPABASE API RESPONSE ==========');
            console.log('[SupabaseSync.saveCarData] Status:', updateResponse.status, updateResponse.statusText);
            console.log('[SupabaseSync.saveCarData] Headers:');
            updateResponse.headers.forEach((value, key) => {
                console.log(`  ${key}: ${value}`);
            });
            console.log('[SupabaseSync.saveCarData] Body:', responseText);
            console.log('[SupabaseSync.saveCarData] ==========================================');

            if (!updateResponse.ok) {
                console.error('[SupabaseSync.saveCarData] ❌ PATCH FAILED');
                throw new Error(`HTTP ${updateResponse.status}: ${responseText}`);
            }

            let updatedRows = [];
            try {
                updatedRows = JSON.parse(responseText);
            } catch (e) {
                console.warn('[SupabaseSync.saveCarData] Response is not JSON:', responseText);
            }
            
            console.log('[SupabaseSync.saveCarData] Updated rows:', updatedRows);

            // If update was successful (rows affected)
            if (Array.isArray(updatedRows) && updatedRows.length > 0) {
                console.log('✅ Car data updated (PATCH successful)');
                return { success: true, conflict: false };
            }

            // No rows updated, try INSERT
            const insertPayload = {
                car_id: carId,
                // Note fields
                text: noteData?.text || '',
                color: noteData?.color || '#FFEB3B',
                // Features fields - convert to individual columns
                ...(featuresData && window.FeatureColumnMapper &&
                    window.FeatureColumnMapper.featuresToDatabaseRow(featuresData.features)),
                // Metadata
                sort: featuresData?.sort || 0,
                created_at: now,
                updated_at: now
            };

            const insertUrl = `${SupabaseClient.url}/rest/v1/${TABLE}`;
            const insertResponse = await fetch(insertUrl, {
                method: 'POST',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify([insertPayload])
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('❌ Insert failed:', errorText);
                throw new Error(`HTTP ${insertResponse.status}: ${errorText}`);
            }

            console.log('✅ Car data created (INSERT successful)');
            return { success: true, conflict: false };
        } catch (error) {
            console.error('❌ Supabase save error:', error);
            return {
                success: false,
                conflict: false,
                error: error.message
            };
        }
    },

    // Legacy method: Get notes by IDs (maps to consolidated table)
    async getNotesByIds(carIds) {
        const data = await this.getDataByIds(carIds);
        const notes = {};
        Object.entries(data).forEach(([carId, row]) => {
            notes[carId] = {
                text: row.text,
                color: row.color,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            };
        });
        return notes;
    },

    // Legacy method: Get single note (maps to consolidated table)
    async getNoteById(carId) {
        const data = await this.getCarData(carId);
        if (data) {
            return {
                text: data.text,
                color: data.color,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
            };
        }
        return null;
    },

    // Legacy method: Save note (maps to consolidated table)
    async saveNoteWithConcurrency(carId, noteData, expectedUpdatedAt = null) {
        return this.saveCarData(carId, noteData, null);
    },

    // Legacy method: Save features (maps to consolidated table)
    async saveCarFeatures(carId, featuresData) {
        return this.saveCarData(carId, null, featuresData);
    },

    // Legacy method: Get features (maps to consolidated table with separate columns)
    async getCarFeatures(carId) {
        console.log('[SupabaseSync.getCarFeatures] Called for car ID:', carId);
        const data = await this.getCarData(carId);
        
        if (data && data.features) {
            const result = {
                features: data.features,
                sort: data.sort,
                updated_at: data.updatedAt
            };
            console.log('[SupabaseSync.getCarFeatures] Returning features:', Object.keys(data.features).length, 'features found');
            return result;
        }
        
        console.log('[SupabaseSync.getCarFeatures] No features found');
        return null;
    },

    // SAVE: Quick save without conflict detection (for new notes)
    async syncNoteToSupabase(carId, noteData) {
        return SupabaseSync.saveNoteWithConcurrency(carId, noteData, null);
    },

    // DELETE: Remove car data from DB
    async deleteNoteFromSupabase(carId) {
        if (!await SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const url = `${SupabaseClient.url}/rest/v1/${TABLE}?car_id=eq.${encodeURIComponent(carId)}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP ${response.status}: ${error}`);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Supabase delete error:', error);
            return { success: false, error: error.message };
        }
    },

};

// Message listener for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background.onMessage] Received request:', request.action, request);
    
    if (request.action === 'saveCarFeatures') {
        console.log('[Background] Handling saveCarFeatures for carId:', request.carId);
        SupabaseSync.saveCarFeatures(request.carId, request.featuresData)
            .then((response) => {
                console.log('[Background] saveCarFeatures response:', response);
                sendResponse(response);
            })
            .catch((error) => {
                console.error('[Background] saveCarFeatures error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Indicate async response
    } else if (request.action === 'getCarFeatures') {
        console.log('[Background] Handling getCarFeatures for carId:', request.carId);
        SupabaseSync.getCarFeatures(request.carId)
            .then((response) => {
                console.log('[Background] getCarFeatures response:', response);
                sendResponse(response);
            })
            .catch((error) => {
                console.error('[Background] getCarFeatures error:', error);
                sendResponse(null);
            });
        return true; // Indicate async response
    } else {
        console.warn('[Background] Unknown action:', request.action);
    }
});
