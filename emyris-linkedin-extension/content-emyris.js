// Emyris LinkedIn Live Sync - Content Script (Emyris Portal Bridge)
console.log('[Emyris Sync] Emyris Portal extension bridge initialized.');

// Announce extension presence to the page
function notifyPortalReady() {
  window.postMessage({
    type: 'EMYRIS_EXTENSION_READY',
    version: '1.0.0',
    installed: true,
    timestamp: Date.now()
  }, '*');
  // Also tag document element for synchronous detection
  document.documentElement.setAttribute('data-emyris-extension-installed', 'true');
}

// Initial announcement
notifyPortalReady();
// Periodic ping during first 5 seconds to ensure React mounts see it
let pings = 0;
const pingInterval = setInterval(() => {
  notifyPortalReady();
  pings++;
  if (pings > 5) clearInterval(pingInterval);
}, 800);

// Listen for sync commands from Emyris Desk UI
window.addEventListener('message', (event) => {
  // Only accept from same window
  if (event.source !== window) return;

  if (event.data && event.data.type === 'EMYRIS_TRIGGER_SYNC') {
    console.log('[Emyris Sync] Received sync trigger from portal UI.');

    // Communicate with extension background script
    chrome.runtime.sendMessage({ action: 'SYNC_FROM_PAGE' }, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error('[Emyris Sync] Runtime messaging error:', err.message);
        window.postMessage({
          type: 'EMYRIS_SYNC_COMPLETED',
          success: false,
          error: err.message,
          message: 'Extension connection interrupted. Please ensure LinkedIn tab is open.'
        }, '*');
        return;
      }

      console.log('[Emyris Sync] Background responded:', response);
      window.postMessage({
        type: 'EMYRIS_SYNC_COMPLETED',
        success: response && response.success,
        posts: response && response.posts,
        count: response && response.count,
        error: response && response.error,
        message: response && response.message
      }, '*');
    });
  }
});
