// Background script for data extraction
// Handles communication between content script and extraction logic

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractVehicleData') {
    // Execute extraction in the tab's context
    chrome.tabs.executeScript(sender.tab.id, {
      file: 'data-parser.js'
    }, () => {
      // After parser is loaded, extract the data
      chrome.tabs.executeScript(sender.tab.id, {
        code: `
          (function() {
            if (typeof VehicleDataParser === 'undefined') return;

            const data = VehicleDataParser.extractVehicleData();
            const format = '${request.format}';
            const operation = '${request.operation}';

            if (operation === 'copy') {
              const text = format === 'json'
                ? VehicleDataParser.formatAsJSON(data)
                : VehicleDataParser.formatAsText(data);

              VehicleDataParser.copyToClipboard(text).then(result => {
                chrome.runtime.sendMessage({
                  success: result.success,
                  message: result.message
                });
              });
            } else if (operation === 'download') {
              const filename = 'vehicle-data-' + new Date().toISOString().split('T')[0];
              const ext = format === 'json' ? '.json' : '.txt';
              VehicleDataParser.downloadAsFile(data, filename + ext, format);

              chrome.runtime.sendMessage({
                success: true,
                message: 'Downloaded: ' + filename + ext
              });
            }
          })();
        `
      });
    });
  }
});

// Alternative: Use executeScript for Manifest V3
// Note: If using Manifest V3, adjust script injection method
