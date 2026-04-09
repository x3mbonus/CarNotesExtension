// Utility functions for Car Notes extension

function getTextColorForBackground(bgColor) {
    // Simple algorithm to determine if text should be light or dark
    // Extract RGB values
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness (WCAG formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return light text for dark backgrounds, dark text for light backgrounds
    return brightness > 128 ? '#000000' : '#ffffff';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function getNote(carId) {
    // Fetch note from database
    if (typeof SupabaseSync !== 'undefined') {
        return await SupabaseSync.getNoteById(carId);
    }
    return null;
}

async function saveNote(carId, noteData) {
    // Save note to database
    if (typeof SupabaseSync !== 'undefined') {
        const result = await SupabaseSync.syncNoteToSupabase(carId, noteData);

        // Update local cache with the saved note
        if (result.success) {
            notesCache[carId] = {
                text: noteData.text,
                color: noteData.color,
                createdAt: noteData.createdAt,
                updatedAt: new Date().toISOString()
            };
        }

        return result;
    }
    return { success: false };
}
