// Supabase integration for Car Notes extension
// Uses REST API instead of JavaScript client to avoid CSP issues

const SupabaseClient = {
    url: null,
    key: null,
    isConfigured: false,
    lastError: null,

    // Initialize with credentials from storage
    async init() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['supabaseUrl', 'supabaseKey'], (result) => {
                if (!result.supabaseUrl || !result.supabaseKey) {
                    this.isConfigured = false;
                    resolve(false);
                    return;
                }

                try {
                    this.url = result.supabaseUrl.replace(/\/$/, ''); // Remove trailing slash
                    this.key = result.supabaseKey;
                    this.isConfigured = true;
                    console.log('✅ Supabase credentials loaded');
                } catch (error) {
                    this.lastError = error.message;
                    console.error('❌ Supabase init error:', error);
                    this.isConfigured = false;
                }

                resolve(this.isConfigured);
            });
        });
    },

    // Check if Supabase is configured
    async isReady() {
        if (this.isConfigured && this.url && this.key) {
            return true;
        }
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
                const response = await fetch(`${testUrl}/rest/v1/car_notes?limit=1`, {
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
    // FETCH: Get notes by list of car IDs (efficient for listings)
    async getNotesByIds(carIds) {
        if (!await SupabaseClient.isReady()) {
            return {};
        }

        try {
            if (!Array.isArray(carIds) || carIds.length === 0) {
                return {};
            }

            // Use 'in' operator for efficient filtering: car_id=in.(ID1,ID2,ID3)
            const idList = carIds.map(id => encodeURIComponent(id)).join(',');
            const url = `${SupabaseClient.url}/rest/v1/car_notes?car_id=in.(${idList})`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const notes = {};

            if (Array.isArray(data)) {
                data.forEach(row => {
                    notes[row.car_id] = {
                        text: row.text,
                        color: row.color,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at
                    };
                });
            }

            return notes;
        } catch (error) {
            console.error('❌ Supabase fetch notes error:', error);
            return {};
        }
    },

    // FETCH: Get single note from DB
    async getNoteById(carId) {
        if (!await SupabaseClient.isReady()) {
            return null;
        }

        try {
            const url = `${SupabaseClient.url}/rest/v1/car_notes?car_id=eq.${encodeURIComponent(carId)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                const row = data[0];
                return {
                    text: row.text,
                    color: row.color,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
            }

            return null;
        } catch (error) {
            console.error('❌ Supabase fetch single note error:', error);
            return null;
        }
    },

    // SAVE: Update note with optimistic concurrency (checks updated_at)
    async saveNoteWithConcurrency(carId, noteData, expectedUpdatedAt = null) {
        if (!await SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured', conflict: false };
        }

        try {
            const now = new Date().toISOString();
            const updatePayload = {
                text: noteData.text,
                color: noteData.color,
                updated_at: now
            };

            // Try UPDATE first
            let updateUrl = `${SupabaseClient.url}/rest/v1/car_notes?car_id=eq.${encodeURIComponent(carId)}`;

            // If we have an expected updated_at, add conflict detection
            if (expectedUpdatedAt) {
                updateUrl += `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`;
            }

            const updateResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updatePayload)
            });

            if (!updateResponse.ok) {
                throw new Error(`HTTP ${updateResponse.status}`);
            }

            const updatedRows = await updateResponse.json();

            // If update successful (rows affected)
            if (Array.isArray(updatedRows) && updatedRows.length > 0) {
                return {
                    success: true,
                    conflict: false,
                    updatedAt: now
                };
            }

            // No rows updated = conflict (expectedUpdatedAt doesn't match)
            // Try INSERT for new notes
            const insertPayload = {
                car_id: carId,
                text: noteData.text,
                color: noteData.color,
                created_at: noteData.createdAt || now,
                updated_at: now
            };

            const insertUrl = `${SupabaseClient.url}/rest/v1/car_notes`;
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
                const error = await insertResponse.text();
                // If it's a duplicate key error and we had an expectedUpdatedAt, it's a conflict
                if (error.includes('duplicate') && expectedUpdatedAt) {
                    return {
                        success: false,
                        conflict: true,
                        error: 'Note was modified elsewhere. Reload to see latest version.'
                    };
                }
                throw new Error(`HTTP ${insertResponse.status}: ${error}`);
            }

            return {
                success: true,
                conflict: false,
                updatedAt: now
            };
        } catch (error) {
            console.error('❌ Supabase save error:', error);
            return {
                success: false,
                conflict: false,
                error: error.message
            };
        }
    },

    // SAVE: Quick save without conflict detection (for new notes)
    async syncNoteToSupabase(carId, noteData) {
        return SupabaseSync.saveNoteWithConcurrency(carId, noteData, null);
    },

    // DELETE: Remove note from DB
    async deleteNoteFromSupabase(carId) {
        if (!await SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const url = `${SupabaseClient.url}/rest/v1/car_notes?car_id=eq.${encodeURIComponent(carId)}`;
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
    }
};
