// Emyris LinkedIn Live Sync - Background Service Worker

console.log('[Emyris Sync] Background service worker loaded.');

// Helper to push scraped posts to the Emyris server
async function persistPostsToServer(posts) {
  const endpoints = [
    'https://emyrishr.in/api/admin/linkedin/feeds',
    'http://localhost:3000/api/admin/linkedin/feeds',
    'http://localhost:5000/api/admin/linkedin/feeds'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts })
      });
      if (res.ok) {
        const json = await res.json();
        console.log(`[Emyris Sync] Successfully persisted to ${url}:`, json);
        return json;
      }
    } catch (e) {
      // Continue to next endpoint silently
    }
  }
  return null;
}

// Scrapes posts from a specific tab
function scrapeFromTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: 'SCRAPE_LINKEDIN_FEED' }, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        return reject(new Error(err.message));
      }
      if (!response || !response.posts || response.posts.length === 0) {
        return reject(new Error('No posts extracted. Feed might still be loading.'));
      }
      resolve(response.posts);
    });
  });
}

// Find LinkedIn tab or open one
async function getOrCreateLinkedInTab() {
  const tabs = await chrome.tabs.query({ url: "*://*.linkedin.com/*" });
  if (tabs && tabs.length > 0) {
    // Prefer feed tab if available
    const feedTab = tabs.find(t => t.url && t.url.includes('/feed'));
    return feedTab || tabs[0];
  }
  return null;
}

// Master sync handler
async function handleSync() {
  let tab = await getOrCreateLinkedInTab();
  
  if (!tab) {
    // Open LinkedIn in a new tab if not already open
    tab = await chrome.tabs.create({ url: 'https://www.linkedin.com/feed/', active: false });
    // Wait for it to load
    await new Promise(r => setTimeout(r, 4500));
  }

  // Attempt scrape with retry
  let posts = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      posts = await scrapeFromTab(tab.id);
      if (posts && posts.length > 0) break;
    } catch (e) {
      lastError = e;
      // If content script wasn't injected yet, inject it dynamically
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-linkedin.js']
        });
      } catch (injErr) {
        // ignore
      }
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  if (!posts || posts.length === 0) {
    throw new Error(lastError ? lastError.message : 'Could not retrieve live posts from LinkedIn.');
  }

  // Save to Chrome storage
  chrome.storage.local.set({
    lastSyncedPosts: posts,
    lastSyncedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalSynced: posts.length
  });

  // Persist to Emyris server
  const serverResult = await persistPostsToServer(posts);
  const finalPosts = (serverResult && serverResult.posts) ? serverResult.posts : posts;

  return {
    success: true,
    posts: finalPosts,
    count: finalPosts.length,
    timestamp: new Date().toISOString()
  };
}

// Handle messages from content-emyris or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_FROM_PAGE' || request.action === 'POPUP_SYNC') {
    handleSync()
      .then(res => sendResponse(res))
      .catch(err => {
        console.error('[Emyris Sync] Sync failed:', err);
        sendResponse({
          success: false,
          error: err.message,
          message: 'Unable to scrape LinkedIn tab. Make sure you are logged into LinkedIn.'
        });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'GET_STATUS') {
    chrome.storage.local.get(['lastSyncedPosts', 'lastSyncedTime', 'totalSynced'], (data) => {
      sendResponse({
        success: true,
        lastSyncedTime: data.lastSyncedTime || 'Never',
        totalSynced: data.totalSynced || 0
      });
    });
    return true;
  }
});
