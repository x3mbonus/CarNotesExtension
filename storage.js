// Storage management for car notes
const CarNoteStorage = {
    STORAGE_KEY: 'carNotes',

    /**
     * Get all notes
     * @returns {Promise<Object>} Object with car IDs as keys and note objects as values
     */
    async getAll() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.STORAGE_KEY], (result) => {
                resolve(result[this.STORAGE_KEY] || {});
            });
        });
    },

    /**
     * Get a specific note by car ID
     * @param {string} carId - The car ID
     * @returns {Promise<Object|null>} The note object or null if not found
     */
    async getNote(carId) {
        const notes = await this.getAll();
        return notes[carId] || null;
    },

    /**
     * Save a note for a car
     * @param {string} carId - The car ID
     * @param {string} text - The note text
     * @param {string} color - The background color (hex code)
     * @returns {Promise<void>}
     */
    async saveNote(carId, text, color) {
        if (!carId || !text.trim()) {
            throw new Error('Car ID and note text are required');
        }

        const notes = await this.getAll();
        notes[carId] = {
            text: text.trim(),
            color: color || '#ffeb3b',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this.STORAGE_KEY]: notes }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Delete a note by car ID
     * @param {string} carId - The car ID
     * @returns {Promise<void>}
     */
    async deleteNote(carId) {
        const notes = await this.getAll();
        delete notes[carId];

        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this.STORAGE_KEY]: notes }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Update a note (merge with existing)
     * @param {string} carId - The car ID
     * @param {Object} updates - Object with updated fields
     * @returns {Promise<void>}
     */
    async updateNote(carId, updates) {
        const notes = await this.getAll();
        if (!notes[carId]) {
            throw new Error('Note not found');
        }

        notes[carId] = {
            ...notes[carId],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this.STORAGE_KEY]: notes }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Delete all notes
     * @returns {Promise<void>}
     */
    async deleteAll() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(this.STORAGE_KEY, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }
};
