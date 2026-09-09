# X Reply Dashboard v2 restyle

use $dev-manager protocol. Model gpt-6-astra/xhigh. You ARE the builder (break-glass). No playwright.

Reference: /Users/me/work/x-reply-dashboard/refs/x-feed-reference.png

Restyle index.html styles.css app.js data/tweets.json README.md to look like X.
Keep masonry ~7 cols, visited, More, open-in-new-tab.

Visual: near-black bg, white text, muted gray, blue Show more. X font stack. Avatar circle left; name+verified+@handle+time. Metrics row: replies, reposts, likes, views. Account glance: following · followers · joined Mon YYYY. Initials avatar if no avatarUrl.

Extend every tweet fixture with: following, followers, joinedAt, metrics{replies,reposts,likes,views}, optional avatarUrl, verified. Keep 24 feed + 12 candidate. Format counts like 1.2K / 322K.

No live X API. Do not kill tmux xreply-serve. Reload http://127.0.0.1:8765 when done. Print files changed.
