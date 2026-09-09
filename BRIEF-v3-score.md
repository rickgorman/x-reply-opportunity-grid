# X Reply Dashboard v3 — type, layout, reply-worthiness color

use $dev-manager protocol. gpt-6-astra/xhigh. You ARE the builder (break-glass). No playwright. Do not kill tmux xreply-serve.

Rick feedback (v2 looks much better):

1) Increase base font size about +20% across the UI.
2) Move following / followers / joined to JUST BELOW the username line and ABOVE the tweet body (not near metrics).
3) Color-code cards for how good a reply target they are, operating theory:
   - Accounts closer to Rick size (~240 following on @rickjoyrudder; treat ~100-2k followers as near peer, very large accounts as weaker follow-back odds)
   - Fresher tweets are better
   - Lower engagement so far (replies/likes/views not piled on) = more room for a reply to be seen + follow-back chance
   Propose a GOOD scoring design: simple transparent score (document in README) combining following, followers, tweet age, replies, likes, views. Map to a subtle color indicator (left border, badge, or soft tint). Prefer explainable formula. Show Warm / OK / Cold or a score chip.

Keep: masonry ~7 cols, More expand, visited gray, open-in-new-tab, X-like metrics row.
Touch: styles.css, app.js, README.md (index.html only if needed).
Acceptance: reload http://127.0.0.1:8765 shows bigger type, stats under name, color/score; print scoring formula.
Start now.
