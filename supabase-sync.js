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
    // Sync local note to Supabase
    async syncNoteToSupabase(carId, noteData) {
        if (!await SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const row = {
                text: noteData.text,
                color: noteData.color,
                updated_at: noteData.updatedAt
            };

            // First, try to UPDATE existing note
            const updateUrl = `${SupabaseClient.url}/rest/v1/car_notes?car_id=eq.${encodeURIComponent(carId)}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(row)
            });

            if (!updateResponse.ok) {
                throw new Error(`HTTP ${updateResponse.status}`);
            }

            const updatedRows = await updateResponse.json();
            
            // If update successful and rows affected, we're done
            if (Array.isArray(updatedRows) && updatedRows.length > 0) {
                return { success: true };
            }

            // Otherwise, INSERT as new note
            const insertRow = {
                car_id: carId,
                text: noteData.text,
                color: noteData.color,
                created_at: noteData.createdAt,
                updated_at: noteData.updatedAt
            };

            const insertUrl = `${SupabaseClient.url}/rest/v1/car_notes`;
            const insertResponse = await fetch(insertUrl, {
                method: 'POST',
                headers: {
                    'apikey': SupabaseClient.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify([insertRow])
            });

            if (!insertResponse.ok) {
                const error = await insertResponse.text();
                throw new Error(`HTTP ${insertResponse.status}: ${error}`);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Supabase sync error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete note from Supabase
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
    },

    // Pull all notes from Supabase
    async pullNotesFromSupabase() {
        if (!await SupabaseClient.isReady()) {
            return null;
        }

        try {
            const url = `${SupabaseClient.url}/rest/v1/car_notes`;
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
            console.error('❌ Supabase pull error:', error);
            return null;
        }
    },

    // Sync all local notes to Supabase
    async pushAllNotesToSupabase(notes) {
        if (!await SupabaseClient.isReady()) {
            return { success: false, reason: 'not_configured' };
        }

        try {
            const carIds = Object.keys(notes);
            
            if (carIds.length === 0) {
                return { success: true, count: 0 };
            }

            let syncedCount = 0;

            // Sync each note individually (UPDATE or INSERT)
            for (const carId of carIds) {
                const result = await SupabaseSync.syncNoteToSupabase(carId, notes[carId]);
                if (result.success) {
                    syncedCount++;
                }
            }

            return { success: true, count: syncedCount };
        } catch (error) {
            console.error('❌ Supabase batch push error:', error);
            return { success: false, error: error.message };
        }
    },

    // Merge remote notes with local (local takes priority for conflicts)
    async syncBidirectional() {
        if (!await SupabaseClient.isReady()) {
            return null;
        }

        try {
            // Get local notes
            const localNotes = await new Promise((resolve) => {
                chrome.storage.local.get(['carNotes'], (result) => {
                    resolve(result.carNotes || {});
                });
            });

            // Get remote notes
            const remoteNotes = await SupabaseSync.pullNotesFromSupabase();
            if (!remoteNotes) {
                return localNotes;
            }

            // Merge: local takes priority, add missing remote notes
            const merged = { ...remoteNotes, ...localNotes };

            // Save merged back to local
            await new Promise((resolve) => {
                chrome.storage.local.set({ carNotes: merged }, resolve);
            });

            // Push all to remote
            await SupabaseSync.pushAllNotesToSupabase(merged);

            return merged;
        } catch (error) {
            console.error('❌ Bidirectional sync error:', error);
            return null;
        }
    }
};
