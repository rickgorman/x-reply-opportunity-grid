const VISITED_KEY = 'x-reply-visited';
const PREVIEW_LINES = 12;
const countFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const joinedFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const ICONS = {
  replies: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
  reposts: '<path d="m2 7 4-4 4 4M6 3v13a3 3 0 0 0 3 3h3m10-2-4 4-4-4m4 4V8a3 3 0 0 0-3-3h-3"/>',
  likes: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  views: '<path d="M4 20v-8m5 8V4m6 16V8m5 12V2"/>',
  verified: '<path fill="currentColor" stroke="none" d="m12 1 3 2.2 3.7.4 1.1 3.6 2.2 3-1.1 3.6.4 3.7-3.3 1.7-2.2 3-3.6-1-3.6 1-2.2-3L3.1 17l.4-3.7-1.1-3.6 2.2-3 1.1-3.6 3.7-.4Z"/><path stroke="#fff" d="m7.5 11.5 3 3 6-6"/>'
};
const grid = document.querySelector('#tweet-grid');
const loadStatus = document.querySelector('#load-status');
const storageStatus = document.querySelector('#storage-status');
let tweets = [];
let interestLexicon = {};
let visited = readVisited();

const MIN_CARD_WIDTH = 400;
const GRID_GAP = 12;
const MAIN_INLINE_PAD = 56; // main padding 28px * 2
const MAX_COLUMNS = 8;
let renderedBatches = [];
let columnCount = 0;
let resizeTimer = 0;

function columnCountForWidth(width) {
  const available = Math.max(0, width - MAIN_INLINE_PAD);
  // Fit as many columns as possible without going under MIN_CARD_WIDTH.
  const cols = Math.floor((available + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP));
  return Math.max(1, Math.min(MAX_COLUMNS, cols || 1));
}

function layoutWidth() {
  // Prefer the grid's content box so zoom/scrollbar match what cards actually get.
  const gridWidth = grid?.clientWidth;
  if (Number.isFinite(gridWidth) && gridWidth > 0) return gridWidth + MAIN_INLINE_PAD;
  return window.innerWidth;
}

/** Round-robin into columns in given order (no score sort).
 *  Infinite scroll should call appendBatch(nextPage) — append under prior
 *  batches without reshuffling earlier cards. */
function ensureColumns(count) {
  const columns = [...grid.querySelectorAll(':scope > .tweet-col')];
  if (columns.length === count && columnCount === count) return columns;
  columnCount = count;
  const next = Array.from({ length: count }, (_, index) => {
    const col = columns[index] || document.createElement('div');
    col.className = 'tweet-col';
    col.dataset.col = String(index);
    return col;
  });
  grid.replaceChildren(...next);
  return next;
}

function paintBatches(batches, now = Date.now()) {
  const columns = ensureColumns(columnCountForWidth(layoutWidth()));
  for (const col of columns) col.replaceChildren();
  batches.forEach((batch, batchIndex) => {
    batch.forEach((tweet, index) => {
      const col = columns[index % columns.length];
      col.append(createCard(tweet, batchIndex * 1000 + index, now));
    });
  });
}

function replaceFeed(batch, now = Date.now()) {
  renderedBatches = [batch.slice()];
  paintBatches(renderedBatches, now);
}

function appendBatch(batch, now = Date.now()) {
  if (!batch.length) return;
  renderedBatches.push(batch.slice());
  // Append-only path for future infinite scroll: stripe this batch onto
  // existing columns without reshuffling earlier batches.
  const columns = ensureColumns(columnCount || columnCountForWidth(layoutWidth()));
  const batchIndex = renderedBatches.length - 1;
  batch.forEach((tweet, index) => {
    columns[index % columns.length].append(createCard(tweet, batchIndex * 1000 + index, now));
  });
}

function scheduleMasonryRelayout() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (!renderedBatches.length) return;
    const next = columnCountForWidth(layoutWidth());
    if (next !== columnCount) {
      paintBatches(renderedBatches);
      return;
    }
    // Same column count (common on zoom): force preview remeasure via a tiny
    // style nudge so ResizeObservers see line-box changes.
    grid.querySelectorAll('.tweet-body').forEach(body => {
      body.style.maxWidth = '99.999%';
      requestAnimationFrame(() => { body.style.maxWidth = ''; });
    });
  }, 120);
}

function storageWarning() {
  storageStatus.textContent = 'Browser storage is unavailable. Visited posts will only stay marked for this page session.';
  storageStatus.hidden = false;
}

function readVisited() {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITED_KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([, value]) =>
      typeof value === 'string' && Number.isFinite(Date.parse(value))
    ));
  } catch {
    storageWarning();
    return {};
  }
}

function updateRemaining() {
  document.querySelector('#remaining-count').textContent = tweets.filter(tweet => !visited[tweet.id]).length;
}

function updateCard(card, id) {
  const timestamp = visited[id];
  card.classList.toggle('is-visited', Boolean(timestamp));
  const status = card.querySelector('.visit-status');
  status.textContent = timestamp ? 'Visited ✓' : 'Open on X ↗';
  status.title = timestamp ? `Opened ${new Date(timestamp).toLocaleString()}` : 'Open this post in a new tab';
}

function markVisited(id, card) {
  visited = { ...readVisited(), ...visited, [id]: new Date().toISOString() };
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  } catch {
    storageWarning();
  }
  updateCard(card, id);
  updateRemaining();
}

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatCount(value) {
  return countFormatter.format(value);
}

function bioInterest(bio = '') {
  const words = new Set(bio.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const matches = Object.entries(interestLexicon).filter(([term]) => words.has(term));
  const weight = matches.reduce((sum, [, points]) => sum + points, 0);
  return { fit: Math.min(1, weight / 6), matches: matches.map(([term]) => term) };
}

function replyOpportunity(tweet, now = Date.now()) {
  const ageHours = Math.max(0, (now - Date.parse(tweet.createdAt)) / 3600000);
  const peerFit = Math.min(1, tweet.followers / 100, 2000 / Math.max(tweet.followers, 1));
  const followingSignal = Math.min(1, tweet.following / Math.max(tweet.followers, 240));
  const interest = bioInterest(tweet.bio);
  const parts = [
    ['Peer fit', 32 * peerFit, 32],
    ['Following signal', 8 * followingSignal, 8],
    ['Reply room', 24 / (1 + tweet.metrics.replies / 5), 24],
    ['Like room', 9.6 / (1 + tweet.metrics.likes / 50), 9.6],
    ['View room', 6.4 / (1 + tweet.metrics.views / 1000), 6.4],
    ['Bio interest', 20 * interest.fit, 20]
  ];
  const freshness = 1 / (1 + ageHours / 24);
  const score = Math.round(parts.reduce((sum, [, points]) => sum + points, 0) * freshness);
  const label = score >= 70 ? 'Best' : score >= 50 ? 'Good' : 'Average';
  const breakdown = parts.map(([name, points, maximum]) => `${name}: ${points.toFixed(1)}/${maximum}`).join('; ');
  return {
    score,
    label,
    explanation: `Reply opportunity: ${label} ${score}/100. ${breakdown}. Matched bio terms: ${interest.matches.join(', ') || 'none'}. Bio: ${tweet.bio || 'not provided'}. Freshness: ×${freshness.toFixed(2)} (${ageHours.toFixed(1)}h old; half at 24h). Heuristic, not a follow-back probability. Counts are a snapshot; age is evaluated at page load.`
  };
}

function setupPreview(body, more, fullText) {
  const words = [...fullText.matchAll(/\S+/gu)];
  let preview = fullText;
  let collapsedLabel = '';
  let lastWidth;

  const updatePreview = () => {
    const expanded = more.getAttribute('aria-expanded') === 'true';
    const maxHeight = parseFloat(getComputedStyle(body).lineHeight) * PREVIEW_LINES;
    body.textContent = fullText;
    if (body.scrollHeight <= maxHeight + 1) {
      preview = fullText;
      more.hidden = true;
      more.setAttribute('aria-expanded', 'false');
      return;
    }

    const prefix = count => count ? `${fullText.slice(0, words[count - 1].index + words[count - 1][0].length)}…` : '…';
    let low = 0;
    let high = words.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      body.textContent = prefix(middle);
      if (body.scrollHeight <= maxHeight + 1) low = middle;
      else high = middle - 1;
    }
    preview = prefix(low);
    collapsedLabel = `Show more [${words.length - low} more words]`;
    body.textContent = expanded ? fullText : preview;
    more.textContent = expanded ? 'Show less' : collapsedLabel;
    more.hidden = false;
  };
  let lastLineHeight = 0;
  const observer = new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    const lineHeight = parseFloat(getComputedStyle(body).lineHeight) || 0;
    if (width === lastWidth && lineHeight === lastLineHeight) return;
    lastWidth = width;
    lastLineHeight = lineHeight;
    requestAnimationFrame(updatePreview);
  });
  observer.observe(body);

  more.addEventListener('click', () => {
    const expanded = more.getAttribute('aria-expanded') === 'true';
    body.textContent = expanded ? preview : fullText;
    more.textContent = expanded ? collapsedLabel : 'Show less';
    more.setAttribute('aria-expanded', String(!expanded));
  });
}

function createIcon(type) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '1.75');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = ICONS[type];
  return icon;
}

function createCard(tweet, index, now) {
  const opportunity = replyOpportunity(tweet, now);
  const card = document.createElement('article');
  card.className = `tweet-card opportunity-${opportunity.label.toLowerCase()}`;
  card.dataset.id = tweet.id;

  const link = document.createElement('a');
  link.className = 'card-link';
  link.href = `https://x.com/${encodeURIComponent(tweet.handle)}/status/${encodeURIComponent(tweet.id)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const badge = document.createElement('span');
  badge.className = `source-badge source-${tweet.source}`;
  badge.textContent = tweet.source === 'candidate' ? 'Candidate' : 'Feed';
  const time = document.createElement('time');
  time.className = 'tweet-time';
  time.dateTime = tweet.createdAt;
  time.textContent = relativeTime(tweet.createdAt);
  time.title = new Date(tweet.createdAt).toLocaleString();
  const author = document.createElement('div');
  author.className = 'author';
  const avatar = document.createElement('span');
  avatar.className = `avatar avatar-${index % 5}`;
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = tweet.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('');
  if (tweet.avatarUrl) {
    const photo = document.createElement('img');
    photo.alt = '';
    photo.loading = 'lazy';
    photo.referrerPolicy = 'no-referrer';
    photo.addEventListener('error', () => photo.remove());
    photo.src = tweet.avatarUrl;
    avatar.append(photo);
  }
  const details = document.createElement('div');
  details.className = 'author-details';
  const identity = document.createElement('span');
  identity.className = 'author-identity';
  const name = document.createElement('span');
  name.className = 'author-name';
  name.textContent = tweet.name;
  name.title = tweet.name;
  identity.append(name);
  if (tweet.verified) {
    const verified = document.createElement('span');
    verified.className = 'verified-badge';
    verified.setAttribute('role', 'img');
    verified.setAttribute('aria-label', 'Verified account');
    verified.title = 'Verified account';
    verified.append(createIcon('verified'));
    identity.append(verified);
  }
  const meta = document.createElement('span');
  meta.className = 'author-meta';
  const handle = document.createElement('span');
  handle.className = 'author-handle';
  handle.textContent = `@${tweet.handle}`;
  handle.title = handle.textContent;
  const separator = document.createElement('span');
  separator.textContent = '·';
  separator.setAttribute('aria-hidden', 'true');
  meta.append(handle, separator, time);
  details.append(identity, meta);
  author.append(avatar, details);

  const glance = document.createElement('div');
  glance.className = 'account-glance';
  for (const field of ['following', 'followers']) {
    const item = document.createElement('span');
    item.title = `${tweet[field].toLocaleString('en-US')} ${field}`;
    const count = document.createElement('strong');
    count.textContent = formatCount(tweet[field]);
    item.append(count, ` ${field}`);
    const dot = document.createElement('span');
    dot.textContent = '·';
    dot.setAttribute('aria-hidden', 'true');
    glance.append(item, dot);
  }
  const joined = document.createElement('span');
  joined.textContent = `Joined ${joinedFormatter.format(new Date(tweet.joinedAt))}`;
  joined.title = joined.textContent;
  glance.append(joined);

  const score = document.createElement('span');
  score.className = 'opportunity-score';
  score.textContent = `${opportunity.label} · ${opportunity.score}`;
  score.title = opportunity.explanation;
  score.setAttribute('role', 'img');
  score.setAttribute('aria-label', opportunity.explanation);

  const body = document.createElement('p');
  body.className = 'tweet-body';
  body.id = `body-${tweet.id}`;
  body.textContent = tweet.body;
  author.append(score);
  link.append(author, glance, body);
  card.append(link);

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'expand-button';
  more.hidden = true;
  more.setAttribute('aria-expanded', 'false');
  more.setAttribute('aria-controls', body.id);
  card.append(more);
  setupPreview(body, more, tweet.body);

  const metrics = document.createElement('div');
  metrics.className = 'tweet-metrics';
  metrics.setAttribute('role', 'group');
  metrics.setAttribute('aria-label', 'Post metrics');
  for (const type of ['replies', 'reposts', 'likes', 'views']) {
    const metric = document.createElement('span');
    metric.className = 'metric';
    metric.setAttribute('role', 'img');
    const label = `${tweet.metrics[type].toLocaleString('en-US')} ${type}`;
    metric.setAttribute('aria-label', label);
    metric.title = label;
    metric.append(createIcon(type), formatCount(tweet.metrics[type]));
    metrics.append(metric);
  }

  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const status = document.createElement('span');
  status.className = 'visit-status';
  footer.append(badge, status);
  card.append(metrics, footer);
  updateCard(card, tweet.id);

  link.addEventListener('click', event => {
    if (event.button !== 0) return;
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      window.open(link.href, '_blank', 'noopener');
    }
    markVisited(tweet.id, card);
  });
  link.addEventListener('auxclick', event => {
    if (event.button === 1) markVisited(tweet.id, card);
  });
  return card;
}

async function loadTweets() {
  try {
    const [response, lexiconResponse] = await Promise.all([
      fetch('./data/tweets.json'),
      fetch('./data/interest-lexicon.json')
    ]);
    if (!response.ok) throw new Error(`Could not load fixtures (${response.status})`);
    if (!lexiconResponse.ok) throw new Error(`Could not load interest lexicon (${lexiconResponse.status})`);
    interestLexicon = await lexiconResponse.json();
    const fixtures = await response.json();
    const seen = new Set();
    tweets = fixtures.filter(tweet => {
      if (seen.has(tweet.id)) return false;
      seen.add(tweet.id);
      return true;
    });
    const now = Date.now();
    replaceFeed(tweets, now);
    document.querySelector('#total-count').textContent = tweets.length;
    document.querySelector('#feed-count').textContent = tweets.filter(tweet => tweet.source === 'feed').length;
    document.querySelector('#candidate-count').textContent = tweets.filter(tweet => tweet.source === 'candidate').length;
    updateRemaining();
    loadStatus.hidden = tweets.length > 0;
    loadStatus.textContent = 'No posts in the local fixture file yet.';
  } catch (error) {
    loadStatus.hidden = false;
    loadStatus.textContent = 'Could not load local posts. From this folder, run python3 -m http.server 8765, then open http://localhost:8765.';
    console.error(error);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

window.addEventListener('storage', event => {
  if (event.key !== VISITED_KEY && event.key !== null) return;
  visited = readVisited();
  grid.querySelectorAll('.tweet-card').forEach(card => updateCard(card, card.dataset.id));
  updateRemaining();
});

window.addEventListener('resize', scheduleMasonryRelayout);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', scheduleMasonryRelayout);
}

loadTweets();
