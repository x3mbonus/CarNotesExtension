// Background service worker for Car Notes extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getNote') {
        handleGetNote(request.carId, sendResponse);
        return true; // Keep the message channel open for async response
    }
});

async function handleGetNote(carId, sendResponse) {
    try {
        const notes = await new Promise((resolve) => {
            chrome.storage.local.get(['carNotes'], (result) => {
                resolve(result.carNotes || {});
            });
        });

        const note = notes[carId] || null;
        sendResponse(note);
    } catch (error) {
        console.error('Error getting note:', error);
        sendResponse(null);
    }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open welcome/setup page on first install
        chrome.tabs.create({
            url: 'popup.html'
        });
    }
});
