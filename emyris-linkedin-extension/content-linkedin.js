// Emyris LinkedIn Live Sync - Content Script (LinkedIn Feed Extractor)
console.log('[Emyris Sync] LinkedIn live sync content script active.');

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/…\s*see more/gi, '')
    .replace(/\.\.\.\s*more/gi, '')
    .trim();
}

function scrapePosts() {
  const posts = [];
  // Select candidate feed update elements
  const postElements = Array.from(document.querySelectorAll(
    'div.feed-shared-update-v2, div[data-urn*="urn:li:activity:"], div[data-urn*="urn:li:ugcPost:"], div.occludable-update'
  ));

  const seenUrns = new Set();

  for (const el of postElements) {
    try {
      // 1. Extract URN or Permalink
      let urn = el.getAttribute('data-urn') || el.getAttribute('data-id') || '';
      if (!urn) {
        const urnChild = el.querySelector('[data-urn*="urn:li:activity:"], [data-urn*="urn:li:ugcPost:"]');
        if (urnChild) urn = urnChild.getAttribute('data-urn');
      }

      let permalink = '';
      if (urn && (urn.includes('activity:') || urn.includes('ugcPost:'))) {
        permalink = `https://www.linkedin.com/feed/update/${urn}/`;
      } else {
        const linkEl = el.querySelector('a[href*="/feed/update/urn:li:"], a[href*="/posts/"], a[href*="/pulse/"]');
        if (linkEl && linkEl.href) {
          permalink = linkEl.href.split('?')[0];
        }
      }

      if (!permalink) {
        permalink = 'https://www.linkedin.com/feed/';
      }

      // Avoid duplicates
      const uniqueKey = urn || permalink;
      if (seenUrns.has(uniqueKey) && uniqueKey !== 'https://www.linkedin.com/feed/') {
        continue;
      }
      seenUrns.add(uniqueKey);

      // 2. Extract Author Name
      const authorEl = el.querySelector(
        '.update-components-actor__name span[aria-hidden="true"], .update-components-actor__name span, .feed-shared-actor__name, .update-components-actor__title span'
      );
      let author = authorEl ? cleanText(authorEl.innerText) : '';
      if (!author) {
        const anyActor = el.querySelector('.update-components-actor__name, .feed-shared-actor__title');
        if (anyActor) author = cleanText(anyActor.innerText.split('\n')[0]);
      }
      if (!author) continue; // Skip non-post cards like promotions or empty blocks

      // 3. Extract Author Headline / Role
      const roleEl = el.querySelector(
        '.update-components-actor__description span[aria-hidden="true"], .update-components-actor__description, .feed-shared-actor__description'
      );
      let role = roleEl ? cleanText(roleEl.innerText) : 'LinkedIn Professional';

      // 4. Extract Post Content Text
      const textEl = el.querySelector(
        '.update-components-text span[dir="ltr"], .feed-shared-update-v2__description span[dir="ltr"], .feed-shared-inline-show-more-text, .update-components-text'
      );
      let text = textEl ? cleanText(textEl.innerText) : '';
      if (!text || text.length < 20) continue; // Skip blank or trivial updates

      // 5. Extract Metrics
      const likesEl = el.querySelector(
        '.social-details-social-counts__reactions-count, button[aria-label*="reactions"] span, span.social-details-social-counts__reactions-count'
      );
      const likes = likesEl ? cleanText(likesEl.innerText) : '450+';

      const commentsEl = el.querySelector(
        '.social-details-social-counts__comments, button[aria-label*="comments"] span'
      );
      const comments = commentsEl ? cleanText(commentsEl.innerText).replace(/comments?/gi, '').trim() : '35';

      // 6. Categorize Post
      const lower = (text + ' ' + role).toLowerCase();
      let category = 'leadership';
      let badge = 'Leadership & Strategy';

      if (lower.includes('pharma') || lower.includes('healthcare') || lower.includes('clinical') || lower.includes('doctor') || lower.includes('drug') || lower.includes('formulation')) {
        category = 'pharma';
        badge = 'Pharma & Healthcare';
      } else if (lower.includes('biotech') || lower.includes('longevity') || lower.includes('ai ') || lower.includes('genomics') || lower.includes('biomedical')) {
        category = 'biotech';
        badge = 'Biotech & AI Innovation';
      } else if (lower.includes('economy') || lower.includes('gdp') || lower.includes('market cap') || lower.includes('stock') || lower.includes('industrial') || lower.includes('manufacturing')) {
        category = 'economy';
        badge = 'Economy & Industry';
      }

      // Build clean summary
      const summary = text.length > 280 ? text.substring(0, 277) + '...' : text;

      posts.push({
        id: 'li-' + Date.now() + '-' + posts.length,
        author: author,
        role: role,
        badge: badge,
        category: category,
        metrics: {
          likes: likes || '500+',
          comments: comments || '40',
          views: '15K+'
        },
        summary: summary,
        rawText: text,
        link: permalink,
        urn: urn
      });

      if (posts.length >= 12) break; // Capture top 10-12 posts
    } catch (err) {
      console.warn('[Emyris Sync] Error parsing feed item:', err);
    }
  }

  return posts;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SCRAPE_LINKEDIN_FEED') {
    let posts = scrapePosts();

    // If fewer than 4 posts visible, scroll slightly and scrape again
    if (posts.length < 4) {
      window.scrollBy({ top: 800, behavior: 'smooth' });
      setTimeout(() => {
        posts = scrapePosts();
        sendResponse({ success: true, count: posts.length, posts: posts });
      }, 600);
      return true; // Keep channel open for async response
    }

    sendResponse({ success: true, count: posts.length, posts: posts });
  }
  return true;
});
