# X Reply Dashboard — v3b

A local, X-style dashboard for scanning posts worth replying to on an ultrawide screen. Plain HTML, CSS, and JavaScript; no dependencies or build step.

## Open

Open **http://127.0.0.1:8765**. The `xreply-serve` tmux session keeps the local server running; leave it running and reload the page after edits.

If no server is running, start one from this folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Use HTTP instead of double-clicking `index.html`, because the page fetches its local JSON fixtures. Use the same hostname and port to retain your visited state.

## Use

- Scan the mixed masonry feed: seven columns at 2,200 CSS pixels and above, one to six on narrower screens. Browser zoom affects the available CSS width.
- The interface follows `refs/x-feed-reference.png`: near-black surfaces, white post text, muted gray metadata, blue verification badges and **Show more**, and the X font stack with system fallbacks. No font download is required. All type is 20% larger than v2 through a 120% root font size and rem-based text sizes: post bodies are now 18px, author names 16.8px, and account details/metrics 13.2px at the browser's default font setting. Cards keep source/fixture order and round-robin into column stacks (up to seven columns on a 34" ultrawide). Future infinite-scroll pages should append under prior batches without reshuffling earlier cards.
- Each card shows a circular avatar, name, verification status, handle, and relative time. Directly below the username line, above the score and post body, account details show **following · followers · Joined Mon YYYY**. The metrics row shows **replies, reposts, likes, views**, in that order; metrics are informational.
- A full three-pixel border on **all four sides** and a **Best / Good / Average · score** chip (top-right of the card header, parallel with the account name) show reply opportunity. Higher tiers use emerald (Best) and sky (Good); Average is gray. Best cards also get a soft green drop-shadow. Hover the chip for the point breakdown, author bio, and matched bio terms; its accessibility label includes the same explanation. Visited cards override these colors with gray while retaining their score text.
- Counts use compact English notation, such as **1.2K**, **322K**, and **1.2M**. Exact numbers are included in metric accessibility labels and count titles. Join months use UTC to avoid shifting date-only values into the previous month.
- Click a card to open `https://x.com/{handle}/status/{id}` in a new tab via `window.open(url, '_blank', 'noopener')`. Real anchors preserve Ctrl/Cmd-click and middle-click behavior.
- Bodies preview up to **12 rendered lines**, including paragraph breaks, ending at a whole-word boundary. **Show more [N more words]** reports the number of hidden whitespace-separated words and expands the full text; **Show less** restores the preview. The preview and count adapt to card width when the browser resizes or zooms. Posts that fit have no button. These buttons neither open X nor mark the card visited.
- Opening a card fades it, adds **Visited ✓**, and updates the remaining count. Primary, modified, and middle clicks record visits; opening through the browser's context menu cannot be reliably detected.
- Visits persist in localStorage under **`x-reply-visited`**, mapping tweet ID strings to ISO timestamps. State belongs to the browser profile and origin. Blocked storage falls back to the current page session with a visible notice. Other tabs on the same origin stay in sync.

## Reply-opportunity score

This is a transparent prioritization heuristic for Rick's stated theory, not a measured probability of a reply or follow-back. It measures account fit, room to be seen, and a small bio-interest signal. What you can contribute still needs human judgment. It does not sort or filter the feed. Candidate status, verification, joined date, reposts, and post-body keywords add no points.

Let `f` = followers, `g` = following, `h` = tweet age in hours, `r` = replies, `l` = likes, and `v` = views. Use the nonnegative counts from the fixture contract; clamp future-dated tweet age to zero. Each component is between zero and one:

```text
P = min(1, f / 100, 2000 / max(f, 1))    peer fit
F = min(1, g / max(f, 240))              following signal
R = 1 / (1 + r / 5)                     reply room
L = 1 / (1 + l / 50)                    like room
V = 1 / (1 + v / 1000)                  view room
A = 1 / (1 + h / 24)                    freshness
I = min(1, matched bio weight / 6)      bio interest

score = round((32P + 8F + 24R + 9.6L + 6.4V + 20I) × A)
```

- **Peer fit — up to 32 points:** 100–2,000 followers receives full credit. Smaller accounts ramp up linearly (50 followers = half credit); larger accounts taper inversely (4,000 = half, 20,000 = one tenth). Zero followers earns no peer-fit points. This is the chosen peer band, not an assertion about Rick's own follower count.
- **Following signal — up to 8 points:** following relative to audience size is a weak, capped proxy for reciprocal activity. The denominator has a floor of 240, Rick's approximate following count, so a tiny account following a handful of people cannot earn full credit. Following zero earns zero; following at least `max(followers, 240)` earns the full 8. Following more cannot add further points. This can be gamed and does not prove willingness to follow back.
- **Room — up to 40 points:** replies get 24 because they directly compete for attention; likes get 9.6 and views 6.4 as weaker, correlated exposure signals. Zero engagement earns full room credit. Each term halves at 5 replies, 50 likes, or 1,000 views, respectively, and keeps declining smoothly. Increasing any engagement count cannot improve the score.
- **Bio interest — up to 20 points:** `data/interest-lexicon.json` is a local bag of words mapping lowercase tokens to positive weights. It follows the CMO criteria: CRIO/clinical/informatics terms carry weight 3, wearables/health terms 2, and builder/AI/automation terms 1. Sum weights of distinct matched terms and divide by 6, capped at 1. Existing v3 components retain their relative weighting and together occupy the other 80 points.
- **Freshness multiplies the whole total:** 0h = ×1, 6h = ×0.8, 24h = ×0.5, 72h = ×0.25. A quiet but old post cannot retain a high score just because it has few replies. Scores and age are evaluated at page load; reload to update them. Engagement remains the supplied snapshot.

Bio matching uses Unicode NFKC normalization, lowercase, and whole letter/digit tokens. Punctuation and hyphens separate words; `AI` matches `ai`, but `chair` does not. Repeating a term adds no points; plural forms must be listed explicitly. Only `bio` is scanned, with no LLM, API, semantic inference, or phrase matching. A missing or empty bio, or no matching terms, earns zero interest points. The tooltip lists matches and the raw bio so false positives are inspectable. To tune the vocabulary, edit the JSON's single-token keys or positive weights and reload. Clinical specificity is a policy preference, not a claim that matching words prove relevance.

Colors use the rounded score: **Best 70–100** (emerald/green), **Good 50–69** (sky/blue), **Average 0–49** (gray). The written label and score convey the same information without relying on color. All terms are bounded, so the score is always 0–100 for valid fixture data.

Examples with **240 following, 500 followers, 1 reply, 10 likes, 200 views**, and bio **"Clinical informatics"** (weight 6, full interest): a new post scores **89 Best**, at 6h **71 Best**, at 24h **45 Average**, and at 72h **22 Average**. With no matching bio terms, the new post scores **69 Good**. Thresholds and weights are initial policy choices, not fitted predictions. The sample timestamps remain unchanged, so a later reload may legitimately show fewer or no Best cards.

## Fixtures

`data/tweets.json` contains exactly **36 fictional posts: 24 feed and 12 candidate**. IDs, names, handles, bios, text, account details, verification, and metrics are sample data. Bios include clinical, wearables, builder, and unmatched examples. Their X URLs may not resolve to real posts. Records are deduplicated by ID before rendering; the first occurrence wins. Relative times use `createdAt` and the current clock at page load.

Each record has this shape:

```json
{
  "id": "2100000000000000001",
  "name": "Mara Chen",
  "handle": "mara_builds",
  "bio": "Product builder and founder. Building useful software, one small release at a time.",
  "source": "feed",
  "createdAt": "2026-09-08T15:42:00Z",
  "body": "A fictional sample post.",
  "following": 482,
  "followers": 12800,
  "joinedAt": "2011-01-01",
  "verified": true,
  "metrics": {
    "replies": 166,
    "reposts": 322,
    "likes": 3200,
    "views": 322000
  }
}
```

`avatarUrl` is an optional image URL (a local path or a data URL keeps the preview self-contained). When omitted, the avatar displays initials; an image that fails to load falls back to those initials too. The bundled fixtures all use initials. Account counts and metrics are nonnegative integers; `joinedAt` is an ISO date, and `verified` is a boolean.

## Hard gate: read-only

**This prototype must never post, reply, like, repost, follow, send messages, or perform any other write to X.** It loads only the local fixture and interest-lexicon files and opens ordinary post URLs when clicked. There are no live X API calls, credentials, analytics, external fonts, or remote avatar requests in the bundled preview. Supplying a remote `avatarUrl` would request that image. Any reply is a separate manual action on X.

`scripts/populate.mjs` remains an inert stub: it documents a future explicitly authorized, read-only refresh and prints a notice. Running it makes no network requests and changes no files. Future refresh work must preserve the hard gate and stop if a read-only source is unavailable.

## Verification

No Playwright or dependency installs are needed. Check JavaScript syntax and fixture completeness:

```sh
node --check app.js
python3 - <<'PY'
import json
from collections import Counter
from datetime import date, datetime
from pathlib import Path
rows = json.loads(Path('data/tweets.json').read_text())
assert len(rows) == len({row['id'] for row in rows}) == 36
assert Counter(row['source'] for row in rows) == {'feed': 24, 'candidate': 12}
for row in rows:
    assert all(isinstance(row[key], str) and row[key] for key in ('id', 'name', 'handle', 'bio', 'body'))
    assert type(row['verified']) is bool
    assert set(row['metrics']) == {'replies', 'reposts', 'likes', 'views'}
    for count in [row['following'], row['followers'], *row['metrics'].values()]:
        assert type(count) is int and count >= 0
    assert date.fromisoformat(row['joinedAt']) <= datetime.fromisoformat(row['createdAt']).date()
    assert 'avatarUrl' not in row or isinstance(row['avatarUrl'], str)
lexicon = json.loads(Path('data/interest-lexicon.json').read_text())
assert lexicon and all(term.isalnum() and term == term.lower() for term in lexicon)
assert all(type(weight) in (int, float) and 0 < weight < float('inf') for weight in lexicon.values())
print('PASS: 36 complete fixtures with bios; 24 feed + 12 candidate; valid interest lexicon')
PY
curl --fail --silent --output /dev/null http://127.0.0.1:8765/
```

For browser acceptance, reload the page at desktop and mobile widths; confirm seven columns at 2,200+ CSS pixels, 20% larger type, account stats directly under the username and above the body, full four-sided 3px tier borders that survive hover, score chip aligned with the account name, readable metrics, and no horizontal overflow. Hover a score chip to inspect its breakdown, bio, and matched terms. Check that long previews fit roughly 12 lines, that the hidden-word count changes with card width, and that short posts have no expansion button. Expand and collapse a long post without changing its visited state, then open a card in a new tab and reload to confirm the visit persists and its opportunity colors turn gray. Check keyboard focus and modified/middle clicks as well. The command checks above do not verify visual layout or browser gestures.

## Files

- `index.html` — dashboard shell and feed summary.
- `styles.css` — X-style theme, card layout, and responsive masonry.
- `app.js` — rendering, reply-opportunity scoring, metadata formatting, expansion, links, and visited state.
- `data/tweets.json` — 36 local sample posts.
- `data/interest-lexicon.json` — weighted bio-interest vocabulary, matched locally without an LLM.
- `scripts/populate.mjs` — unchanged, inert refresh stub.
- `README.md` — usage, fixture contract, and verification.
