# BRIEF — React package: @rickgorman/x-reply-opportunity-grid

You ARE the builder. Use gpt-6-astra / xhigh. No Playwright. Do not kill tmux `xreply-serve`. Do not force-push `main`. No secrets. Work on branch `feat/react-package` (create from current `main` if needed).

## Goal

Restructure this vanilla X reply-opportunity dashboard into a reusable TypeScript React component library + Vite demo + excellent README, then leave the branch ready for a GitHub PR (finish code green; parent may `gh pr create`).

**Package name:** `@rickgorman/x-reply-opportunity-grid`
**Repo remote:** private `https://github.com/rickgorman/x-reply-opportunity-grid.git`
**Working dir:** `/Users/me/work/x-reply-dashboard`

## Public API (must export)

1. **`ReplyOpportunityGrid`** — React component taking `tweets` + options
2. **`scoreReplyOpportunity(tweet, opts?)`** — pure scorer + exported types
3. **CSS stylesheet** import path (e.g. `@rickgorman/x-reply-opportunity-grid/styles.css`)

Also export types: `Tweet`, `TweetMetrics`, `ScoreResult`, `ReplyOpportunityLabel`, `ReplyOpportunityGridProps`, `ScoreOptions`, `ColumnBreakpoint`, etc.

## Preserve from current vanilla (`app.js` / `styles.css`) — INSPECT THEM FIRST

Visual / UX (X-dark cards):
- Avatar (initials + optional `avatarUrl`), name, verified badge, handle, relative time
- Account glance: following · followers · Joined Mon YYYY (UTC month)
- Show more ~12 lines + `[N more words]` / Show less (ResizeObserver binary search on words)
- Metrics row: replies, reposts, likes, views (icons + compact counts)
- Feed / Candidate source badge
- Visited state via localStorage → gray card (`is-visited`)
- Score chip top-right parallel with name: `Best/Good/Average · score` with explanation tooltip/aria-label
- **Tiers ONLY three:** Best ≥70 emerald + light neon green glow; Good ≥50 sky blue; Average gray. **NO Elevated tier**
- 3px border all sides; high-contrast hover
- Column stacks round-robin (breakpoints 600→2 … 2200→7); **DO NOT sort by score**; keep input order
- Display-only: open `https://x.com/{handle}/status/{id}` in new tab (`noopener`); **no** follow/like/reply/DM/write actions

Scoring (copy formulas from `app.js` `replyOpportunity` + `bioInterest`):
- Peer fit, following signal, reply/like/view room, bio interest lexicon, freshness half-life **24h**
- Default lexicon = contents of `data/interest-lexicon.json`
- Make **overridable** via options: weights, thresholds (best/good), lexicon, breakpoints, `storageKey`, `previewLines`, freshness half-life, etc.

## Layout / tooling

Create src/ library, demo/ Vite app, fixtures/, legacy/vanilla-snapshot/ for old files.
Use tsup or vite library build to dist with d.ts+css+exports.
Use vitest for scorer. Strict TypeScript.
package.json name must be @rickgorman/x-reply-opportunity-grid with peerDeps react/react-dom, exports for . and ./styles.css, scripts build/test/dev/typecheck.

## README

Beautiful README documenting EVERY option (name/type/default/effect), Quick Start, private GitHub install, peerDeps, theming, scoring, breakpoints, visited, a11y, read-only gate, demo, For agents file map.

## Acceptance

Install, test, and build must pass. Demo runnable with the documented dev script.
Move vanilla files into legacy/vanilla-snapshot/.
Commit on feat/react-package and push the branch when possible.
Do not change main history. No secrets. No Playwright. Leave xreply-serve alone. No Elevated tier. No score sort.

Start now. Inspect app.js and styles.css carefully before rewriting.
