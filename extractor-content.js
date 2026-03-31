// Content script to add extraction buttons to mobile.de pages
// This injects UI and handles data extraction/export

(function() {
  // Check if we're on a mobile.de vehicle detail page
  const isVehicleDetailPage = document.querySelector('[data-testid="vip-price-label"]');
  if (!isVehicleDetailPage) return;

  // Create extraction button panel
  function createExtractorUI() {
    const panel = document.createElement('div');
    panel.id = 'car-notes-extractor-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      min-width: 200px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #333; font-size: 12px;';
    title.textContent = 'Extract Vehicle Data';
    panel.appendChild(title);

    // Copy as Text button
    const copyTextBtn = createButton('📋 Copy (Text)', 'copyText');
    panel.appendChild(copyTextBtn);

    // Copy as JSON button
    const copyJsonBtn = createButton('📋 Copy (JSON)', 'copyJson');
    panel.appendChild(copyJsonBtn);

    // Download as Text button
    const downloadTextBtn = createButton('⬇️ Download (TXT)', 'downloadText');
    panel.appendChild(downloadTextBtn);

    // Download as JSON button
    const downloadJsonBtn = createButton('⬇️ Download (JSON)', 'downloadJson');
    panel.appendChild(downloadJsonBtn);

    // Collapse button
    const collapseBtn = document.createElement('button');
    collapseBtn.style.cssText = `
      width: 100%;
      padding: 6px;
      margin-top: 8px;
      border: 1px solid #ddd;
      background: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      color: #666;
    `;
    collapseBtn.textContent = '✕ Minimize';
    collapseBtn.addEventListener('click', () => {
      const buttons = panel.querySelectorAll('button[data-action]');
      const isCollapsed = buttons[0].style.display === 'none';
      buttons.forEach(btn => btn.style.display = isCollapsed ? 'block' : 'none');
      collapseBtn.textContent = isCollapsed ? '✕ Minimize' : '▶ Expand';
    });
    panel.appendChild(collapseBtn);

    return panel;
  }

  function createButton(label, action) {
    const btn = document.createElement('button');
    btn.setAttribute('data-action', action);
    btn.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 6px;
      border: 1px solid #007bff;
      background: white;
      color: #007bff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    btn.textContent = label;

    btn.addEventListener('mouseover', () => {
      btn.style.background = '#007bff';
      btn.style.color = 'white';
    });

    btn.addEventListener('mouseout', () => {
      btn.style.background = 'white';
      btn.style.color = '#007bff';
    });

    btn.addEventListener('click', async () => {
      await handleExtraction(action);
    });

    return btn;
  }

  async function handleExtraction(action) {
    try {
      // Send message to background script or load parser
      const message = {
        action: 'extractVehicleData',
        format: action.includes('Json') ? 'json' : 'text',
        operation: action.includes('Download') ? 'download' : 'copy'
      };

      chrome.runtime.sendMessage(message, (response) => {
        if (response && response.success) {
          showNotification(response.message, 'success');
        } else {
          showNotification(response?.message || 'Operation failed', 'error');
        }
      });
    } catch (error) {
      console.error('Extraction error:', error);
      showNotification('Error: ' + error.message, 'error');
    }
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Inject the UI panel
  const panel = createExtractorUI();
  document.body.appendChild(panel);

  console.log('Car Notes Extractor ready. Click buttons to extract vehicle data.');
})();
