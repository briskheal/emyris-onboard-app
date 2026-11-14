// Emyris LinkedIn Sync - Popup Script

const syncBtn = document.getElementById('sync-btn');
const syncText = document.getElementById('sync-text');
const portalBtn = document.getElementById('portal-btn');
const lastSyncTimeEl = document.getElementById('last-sync-time');
const totalSyncedEl = document.getElementById('total-synced');
const statusMsg = document.getElementById('status-msg');

function updateStatus() {
  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (res) => {
    if (res && res.success) {
      lastSyncTimeEl.textContent = res.lastSyncedTime || 'Never';
      totalSyncedEl.textContent = res.totalSynced || '0';
    }
  });
}

updateStatus();

syncBtn.addEventListener('click', () => {
  syncBtn.disabled = true;
  syncText.textContent = '⏳ Extracting Live Posts...';
  statusMsg.textContent = 'Scanning active LinkedIn tab for exact permalinks...';
  statusMsg.className = '';

  chrome.runtime.sendMessage({ action: 'POPUP_SYNC' }, (response) => {
    syncBtn.disabled = false;
    syncText.textContent = '⚡ Sync Live Feeds Now';

    if (response && response.success) {
      statusMsg.textContent = `✓ Synced ${response.count} fresh posts with permalinks!`;
      statusMsg.className = '';
      updateStatus();
    } else {
      statusMsg.textContent = response ? response.message : 'Sync failed. Keep LinkedIn open in Chrome.';
      statusMsg.className = 'error';
    }
  });
});

portalBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://emyrishr.in/admin?tab=linkedin' });
});
