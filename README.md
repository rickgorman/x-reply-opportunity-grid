# @rickgorman/x-reply-opportunity-grid

![Reply opportunity grid preview](docs/dashboard-preview.png)

A **read-only**, X-dark React component library for scanning posts worth replying to. Transparent opportunity scoring, round-robin column stacks that **preserve card width** (minCardWidth default 560), local visited state, and zero write actions against X.

**Package:** `@rickgorman/x-reply-opportunity-grid`
**Peers:** `react` + `react-dom` (18 or 19)
**Hard gate:** display-only. Opens x.com in a new tab. Never follow, like, reply, or DM.

---

## Quick Start

```tsx
import { ReplyOpportunityGrid, scoreReplyOpportunity } from "@rickgorman/x-reply-opportunity-grid";
import "@rickgorman/x-reply-opportunity-grid/styles.css";

export function Feed({ tweets }) {
  return <ReplyOpportunityGrid tweets={tweets} />;
}
```

## Private GitHub install

This repository is private. After you have access:

```sh
npm install github:rickgorman/x-reply-opportunity-grid#main
npm install github:rickgorman/x-reply-opportunity-grid#feat/react-package
npm install git+https://github.com/rickgorman/x-reply-opportunity-grid.git
```

## Peer dependencies

| Package | Range |
|---|---|
| `react` | `^18.2.0 || ^19.0.0` |
| `react-dom` | `^18.2.0 || ^19.0.0` |

## Public API

| Export | Kind | Purpose |
|---|---|---|
| `ReplyOpportunityGrid` | React component | Column grid of opportunity cards |
| `scoreReplyOpportunity(tweet, opts?)` | Pure function | Score + label + explanation |
| stylesheet import `.../styles.css` | CSS | Scoped under `.x-reply-opportunity-grid` |
| Types + layout helpers | — | `Tweet`, `columnCountForWidth`, `DEFAULT_MIN_CARD_WIDTH`, … |

## ReplyOpportunityGrid options

| Name | Type | Default | Effect |
|---|---|---|---|
| `tweets` | `readonly Tweet[]` | required | Cards to render. Input order preserved (no score sort). First duplicate id wins. |
| `scoreOptions` | `ScoreOptions` | `{}` | Forwarded to the scorer. |
| `minCardWidth` | `number` | `560` | Preferred card floor in CSS px. **Column count drops before cards crush under this width.** Ignored when `breakpoints` is set. |
| `gridGap` | `number` | `12` | Gap used by min-width fitting. |
| `mainInlinePad` | `number` | `56` | Assumed horizontal chrome outside the grid when fitting. |
| `maxColumns` | `number` | `7` | Cap when using min-card-width fitting. |
| `breakpoints` | `readonly ColumnBreakpoint[]` | unset | Legacy `{ minWidth, columns }` table; replaces min-card-width fitting when set. |
| `storageKey` | `string | null` | `x-reply-visited` | localStorage key; `null` disables persistence. |
| `previewLines` | `number` | `12` | Collapsed body line budget before Show more. |
| `className` | `string` | — | Extra root class. |
| `style` | `CSSProperties` | — | Root inline style. |
| `id` | `string` | — | Root DOM id. |
| `ariaLabel` | `string` | Tweets worth replying to | Region name. |
| `emptyState` | `ReactNode` | No posts to explore yet. | Empty content. |
| `onVisitedChange` | `(ids) => void` | — | Visited IDs from current tweets (input order). |

## Layout and minCardWidth

Default behavior fits as many columns as possible without cards going under `minCardWidth` (560px):

```text
available = viewportWidth - mainInlinePad
columns   = clamp(1..maxColumns, floor((available + gridGap) / (minCardWidth + gridGap)))
```

Cards keep ~560px minimum; the grid drops columns as the viewport shrinks. Round-robin placement keeps source order (index i goes to column i % columns).

Legacy breakpoints (only when you pass `breakpoints`): 2200→7 · 1800→6 · 1500→5 · 1200→4 · 900→3 · 600→2 · 0→1.

## Scoring

Pure function `scoreReplyOpportunity(tweet, opts?)`. No DOM or storage.

```text
P = min(1, f/peerMin, peerMax/max(f,1))
F = min(1, g/max(f, followingFloor))
R = 1/(1+r/replyHalf); L = 1/(1+l/likeHalf); V = 1/(1+v/viewHalf)
I = min(1, matchedBioWeight/bioWeightForFull)
A = 1/(1+h/freshnessHalfLifeHours)
score = round((wP*P + wF*F + wR*R + wL*L + wV*V + wI*I) * A)
```

Defaults: weights {32, 8, 24, 9.6, 6.4, 20}, peer [100,2000], followingFloor 240, room half-lives {5,50,1000}, bio full weight 6, freshness half-life **24h**.

**Tiers only three — no Elevated:** Best ≥70 emerald + neon glow; Good ≥50 sky; Average gray.

### ScoreOptions

| Name | Type | Default | Effect |
|---|---|---|---|
| `now` | `number` | `Date.now()` | Epoch ms for age/freshness |
| `weights` | `Partial<ScoreWeights>` | defaults | Partial overrides; normalized to 100 |
| `thresholds` | `Partial<{best,good}>` | `{best:70,good:50}` | Label cutoffs |
| `lexicon` | `Record<string, number>` | bundled | Bio token weights |
| `freshnessHalfLifeHours` | `number` | `24` | Age where freshness is 0.5 |
| `peerFollowerRange` | `[min,max]` | `[100,2000]` | Peer-fit band |
| `followingFloor` | `number` | `240` | Following signal denominator floor |
| `roomHalfLives` | `Partial<{replies,likes,views}>` | `{5,50,1000}` | Room half-lives |
| `bioWeightForFullScore` | `number` | `6` | Bio weight that saturates interest |

## Theming

Import the stylesheet once. Rules are scoped under `.x-reply-opportunity-grid`. Override `--xrog-text`, `--xrog-muted`, `--xrog-accent`, `--xrog-card-background`, `--xrog-hover-background`, `--xrog-best-edge`, `--xrog-good-edge`, `--xrog-average-edge`, `--xrog-gap`, `--xrog-radius`.

## Visited state

Stored in localStorage under `storageKey` (default `x-reply-visited`) as `{ [tweetId]: ISO timestamp }`. Opening a card marks it visited and grays it. `storageKey={null}` keeps marks in memory only. Cross-tab sync via storage events.

## Accessibility

Named region, score chip with full explanation as aria-label, metric text alternatives, real expand button with aria-expanded, focus rings, prefers-reduced-motion.

## Read-only gate

This package never posts, replies, likes, reposts, follows, or DMs. It only renders tweets you pass in, scores them locally, and opens `https://x.com/{handle}/status/{id}` with `rel=noopener noreferrer`.

## Demo

From the repo root, install dependencies then use package scripts: `dev` (Vite on http://127.0.0.1:5173), `test` (vitest), `build` (library to dist/ with d.ts + CSS), `build:demo` (demo-dist/), `typecheck`.

The demo uses `fixtures/tweets.json` with a fixed clock (`2026-09-08T18:00:00Z`) so fictional tiers stay stable.

## For agents — file map

```text
src/           library (index, types, scoring, layout, grid, hooks, styles, lexicon, tests)
demo/          Vite app (index.html, main.tsx, styles.css, vite.config.ts)
fixtures/      tweets.json, interest-lexicon.json, index.ts
docs/          dashboard-preview.png (README hero)
legacy/vanilla-snapshot/  original vanilla app.js / styles.css / data
package.json   name @rickgorman/x-reply-opportunity-grid
tsup.config.ts / vitest.config.ts / tsconfig.json
BRIEF-react-package.md
```

Vanilla history lives under `legacy/vanilla-snapshot/`. Prefer `src/` for product changes.
