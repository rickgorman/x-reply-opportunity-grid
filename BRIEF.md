# X Reply Dashboard — v1 prototype

**use $dev-manager protocol** for judgment/quality (surgical scope, acceptance checks, no speculative abstraction).

**IMPORTANT override for THIS job (operator authorized):** you are `gpt-6-astra` / xhigh and you ARE the builder for this greenfield v1. Do **not** stall waiting to dispatch Composer/Grok/Opus. Implement the product code yourself now (break-glass). Do not ask the user questions — assumptions below are locked.

## Outcome
A quick local webpage prototype at `/Users/me/work/x-reply-dashboard` Rick can open on a 34" ultrawide to browse tweets worth replying to.

## Assumptions (locked)
- Static site: `index.html`, `styles.css`, `app.js`, `data/tweets.json`, `scripts/populate.mjs`, `README.md`
- Fixtures only for live data (no live X API calls in v1)
- localStorage key `x-reply-visited` maps tweet id → ISO timestamp
- Dark dense UI; CSS multi-column or masonry targeting ~7 columns on wide screens
- Open tweet via `window.open(url,'_blank','noopener')` on primary click; middle-click/ctrl-click also work via normal link behavior — use real `<a target="_blank">` wrappers where possible so background-tab gestures work
- Source badges: `feed` | `candidate`

## Product (locked)
- Full-width masonry/columns, scrollable
- Tweet-like cards: avatar placeholder, name, @handle, relative time, body truncated ~240 chars + More expand
- Click opens https://x.com/{handle}/status/{id} in new tab; mark visited + gray card
- Mixed grid with source badges; ≥20 feed + ≥10 candidate fixtures; dedupe by id
- populate.mjs stub documents future read-only refresh
- README: how to open (`python3 -m http.server` from repo root), hard gate read-only

## Acceptance
1. `python3 -m http.server 8765` from repo root serves the page
2. Many cards across ~7 columns when window is ultrawide
3. More expands; click opens X URL; visited grays and persists on reload
4. Fixture counts met; README present

## Done when
Files written, acceptance checked locally as far as possible without a GUI, print open URL + file tree in the final message.

## HARD CONSTRAINTS (operator)
- FORBIDDEN: playwright, puppeteer, jsdom, browser automation, npx installs for verify
- Acceptance = files on disk + python3 -c JSON count checks only
- First tool actions must CREATE the six files. Do not scout the machine.
