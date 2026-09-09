"use client";

// src/ReplyOpportunityGrid.tsx
import { useEffect as useEffect3, useId, useMemo, useRef as useRef3, useState as useState3 } from "react";

// src/Icons.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var paths = {
  replies: /* @__PURE__ */ jsx("path", { d: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" }),
  reposts: /* @__PURE__ */ jsx("path", { d: "m2 7 4-4 4 4M6 3v13a3 3 0 0 0 3 3h3m10-2-4 4-4-4m4 4V8a3 3 0 0 0-3-3h-3" }),
  likes: /* @__PURE__ */ jsx("path", { d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" }),
  views: /* @__PURE__ */ jsx("path", { d: "M4 20v-8m5 8V4m6 16V8m5 12V2" }),
  verified: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { fill: "currentColor", stroke: "none", d: "m12 1 3 2.2 3.7.4 1.1 3.6 2.2 3-1.1 3.6.4 3.7-3.3 1.7-2.2 3-3.6-1-3.6 1-2.2-3L3.1 17l.4-3.7-1.1-3.6 2.2-3 1.1-3.6 3.7-.4Z" }),
    /* @__PURE__ */ jsx("path", { stroke: "#fff", d: "m7.5 11.5 3 3 6-6" })
  ] })
};
function Icon({ type }) {
  return /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: paths[type] });
}

// src/layout.ts
var DEFAULT_MIN_CARD_WIDTH = 400;
var DEFAULT_GRID_GAP = 12;
var DEFAULT_MAIN_INLINE_PAD = 56;
var DEFAULT_MAX_COLUMNS = 8;
var DEFAULT_COLUMN_BREAKPOINTS = Object.freeze([
  { minWidth: 0, columns: 1 },
  { minWidth: 600, columns: 2 },
  { minWidth: 900, columns: 3 },
  { minWidth: 1200, columns: 4 },
  { minWidth: 1500, columns: 5 },
  { minWidth: 1800, columns: 6 },
  { minWidth: 2200, columns: 7 }
].map((breakpoint) => Object.freeze(breakpoint)));
var DEFAULT_STORAGE_KEY = "x-reply-visited";
var DEFAULT_PREVIEW_LINES = 12;
function validateBreakpoints(breakpoints) {
  for (const { minWidth, columns } of breakpoints) {
    if (!Number.isFinite(minWidth) || minWidth < 0 || !Number.isSafeInteger(columns) || columns < 1) {
      throw new RangeError("breakpoints require a finite nonnegative minWidth and positive integer columns");
    }
  }
}
function columnCountForWidth(width, options = {}) {
  if (Array.isArray(options)) {
    let count = 1;
    let matchedWidth = -1;
    for (const { minWidth, columns } of options) {
      if (width >= minWidth && minWidth >= matchedWidth) {
        count = columns;
        matchedWidth = minWidth;
      }
    }
    return count;
  }
  const opts = options;
  if (opts.breakpoints) {
    return columnCountForWidth(width, opts.breakpoints);
  }
  const minCardWidth = opts.minCardWidth ?? DEFAULT_MIN_CARD_WIDTH;
  const gridGap = opts.gridGap ?? DEFAULT_GRID_GAP;
  const mainInlinePad = opts.mainInlinePad ?? DEFAULT_MAIN_INLINE_PAD;
  const maxColumns = opts.maxColumns ?? DEFAULT_MAX_COLUMNS;
  const available = Math.max(0, width - mainInlinePad);
  const cols = Math.floor((available + gridGap) / (minCardWidth + gridGap));
  return Math.max(1, Math.min(maxColumns, cols || 1));
}
function uniqueTweets(tweets) {
  const seen = /* @__PURE__ */ new Set();
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id)) return false;
    seen.add(tweet.id);
    return true;
  });
}

// src/interest-lexicon.json
var interest_lexicon_default = {
  crio: 3,
  clinical: 3,
  informatics: 3,
  clinician: 3,
  trials: 3,
  wearable: 2,
  wearables: 2,
  sensors: 2,
  biosignals: 2,
  health: 2,
  healthcare: 2,
  biometrics: 2,
  builder: 1,
  builders: 1,
  building: 1,
  developer: 1,
  engineer: 1,
  founder: 1,
  indie: 1,
  ai: 1,
  agents: 1,
  automation: 1,
  research: 1,
  prototyping: 1
};

// src/scoring.ts
var DEFAULT_INTEREST_LEXICON = Object.freeze(interest_lexicon_default);
var DEFAULT_SCORE_WEIGHTS = Object.freeze({
  peerFit: 32,
  followingSignal: 8,
  replyRoom: 24,
  likeRoom: 9.6,
  viewRoom: 6.4,
  bioInterest: 20
});
var DEFAULT_SCORE_THRESHOLDS = Object.freeze({ best: 70, good: 50 });
var DEFAULT_ROOM_HALF_LIVES = Object.freeze({ replies: 5, likes: 50, views: 1e3 });
var DEFAULT_FRESHNESS_HALF_LIFE_HOURS = 24;
function nonnegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
  return value;
}
function positive(value, name) {
  if (nonnegative(value, name) === 0) throw new RangeError(`${name} must be positive`);
  return value;
}
function scoreReplyOpportunity(tweet, opts = {}) {
  const now = opts.now ?? Date.now();
  const createdAt = Date.parse(tweet.createdAt);
  if (!Number.isFinite(now) || !Number.isFinite(createdAt)) throw new RangeError("now and createdAt must be valid timestamps");
  const followers = nonnegative(tweet.followers, "followers");
  const following = nonnegative(tweet.following, "following");
  const replies = nonnegative(tweet.metrics.replies, "replies");
  const likes = nonnegative(tweet.metrics.likes, "likes");
  const views = nonnegative(tweet.metrics.views, "views");
  const halfLife = positive(opts.freshnessHalfLifeHours ?? DEFAULT_FRESHNESS_HALF_LIFE_HOURS, "freshnessHalfLifeHours");
  const [peerMin, peerMax] = opts.peerFollowerRange ?? [100, 2e3];
  positive(peerMin, "peerFollowerRange minimum");
  if (positive(peerMax, "peerFollowerRange maximum") < peerMin) throw new RangeError("peerFollowerRange must be ascending");
  const followingFloor = positive(opts.followingFloor ?? 240, "followingFloor");
  const bioWeightForFullScore = positive(opts.bioWeightForFullScore ?? 6, "bioWeightForFullScore");
  const room = { ...DEFAULT_ROOM_HALF_LIVES, ...opts.roomHalfLives };
  for (const [key, value] of Object.entries(room)) positive(value, `roomHalfLives.${key}`);
  const weights = { ...DEFAULT_SCORE_WEIGHTS, ...opts.weights };
  for (const [key, value] of Object.entries(weights)) nonnegative(value, `weights.${key}`);
  const weightTotal = positive(Object.values(weights).reduce((sum, weight) => sum + weight, 0), "weight total");
  const thresholds = { ...DEFAULT_SCORE_THRESHOLDS, ...opts.thresholds };
  if (nonnegative(thresholds.good, "thresholds.good") > nonnegative(thresholds.best, "thresholds.best") || thresholds.best > 100) {
    throw new RangeError("thresholds must satisfy 0 <= good <= best <= 100");
  }
  const words = new Set((tweet.bio ?? "").normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const vocabulary = opts.lexicon ?? DEFAULT_INTEREST_LEXICON;
  for (const [term, weight] of Object.entries(vocabulary)) {
    if (!/^[\p{L}\p{N}]+$/u.test(term) || term !== term.normalize("NFKC").toLowerCase()) {
      throw new RangeError("lexicon keys must be lowercase NFKC single letter/digit tokens");
    }
    nonnegative(weight, `lexicon.${term}`);
  }
  const matches = Object.entries(vocabulary).filter(([term, weight]) => weight > 0 && words.has(term));
  const interestWeight = matches.reduce((sum, [, weight]) => sum + weight, 0);
  const signals = [
    ["peerFit", "Peer fit", Math.min(1, followers / peerMin, peerMax / Math.max(followers, 1))],
    ["followingSignal", "Following signal", Math.min(1, following / Math.max(followers, followingFloor))],
    ["replyRoom", "Reply room", 1 / (1 + replies / room.replies)],
    ["likeRoom", "Like room", 1 / (1 + likes / room.likes)],
    ["viewRoom", "View room", 1 / (1 + views / room.views)],
    ["bioInterest", "Bio interest", Math.min(1, interestWeight / bioWeightForFullScore)]
  ];
  const parts = signals.map(([key, name, fit]) => {
    const maximum = weights[key] / weightTotal * 100;
    return { key, name, fit, points: maximum * fit, maximum };
  });
  const ageHours = Math.max(0, (now - createdAt) / 36e5);
  const freshness = 1 / (1 + ageHours / halfLife);
  const score = Math.min(100, Math.max(0, Math.round(parts.reduce((sum, part) => sum + part.points, 0) * freshness)));
  const label = score >= thresholds.best ? "Best" : score >= thresholds.good ? "Good" : "Average";
  const matchedBioTerms = matches.map(([term]) => term);
  const breakdown = parts.map(({ name, points, maximum }) => `${name}: ${points.toFixed(1)}/${Number(maximum.toFixed(2))}`).join("; ");
  return {
    score,
    label,
    parts,
    matchedBioTerms,
    freshness,
    ageHours,
    explanation: `Reply opportunity: ${label} ${score}/100. ${breakdown}. Matched bio terms: ${matchedBioTerms.join(", ") || "none"}. Bio: ${tweet.bio || "not provided"}. Freshness: \xD7${freshness.toFixed(2)} (${ageHours.toFixed(1)}h old; half at ${halfLife}h). Heuristic, not a follow-back probability. Counts are a snapshot; age is evaluated at the supplied time.`
  };
}

// src/useTextPreview.ts
import { useEffect, useRef, useState } from "react";
function useTextPreview(text, lines) {
  const measureRef = useRef(null);
  const [preview, setPreview] = useState({ text, hiddenWords: 0 });
  useEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    let frame = 0;
    let disposed = false;
    let lastWidth = -1;
    const words = [...text.matchAll(/\S+/gu)];
    const update = () => {
      if (disposed) return;
      const width = measure.getBoundingClientRect().width;
      const maxHeight = Number.parseFloat(getComputedStyle(measure).lineHeight) * lines;
      measure.textContent = text;
      if (!width || !Number.isFinite(maxHeight) || measure.scrollHeight <= maxHeight + 1 || !words.length) {
        setPreview({ text, hiddenWords: 0 });
        return;
      }
      const prefix = (count) => {
        const word = words[count - 1];
        return word ? `${text.slice(0, word.index + word[0].length)}\u2026` : "\u2026";
      };
      let low = 0;
      let high = words.length - 1;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        measure.textContent = prefix(middle);
        if (measure.scrollHeight <= maxHeight + 1) low = middle;
        else high = middle - 1;
      }
      setPreview({ text: prefix(low), hiddenWords: words.length - low });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width === lastWidth) return;
      lastWidth = entry.contentRect.width;
      schedule();
    });
    observer?.observe(measure);
    window.addEventListener("resize", schedule);
    void document.fonts?.ready.then(() => {
      if (!disposed) schedule();
    });
    document.fonts?.addEventListener("loadingdone", schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      document.fonts?.removeEventListener("loadingdone", schedule);
    };
  }, [text, lines]);
  return { measureRef, ...preview };
}

// src/useVisited.ts
import { useCallback, useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
var VISIT_EVENT = "x-reply-opportunity-grid:visited";
function readVisits(key) {
  if (key === null) return { visits: {}, unavailable: false };
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Invalid visited data");
    return {
      visits: Object.fromEntries(Object.entries(saved).filter(
        ([, value]) => typeof value === "string" && Number.isFinite(Date.parse(value))
      )),
      unavailable: false
    };
  } catch {
    return { visits: {}, unavailable: true };
  }
}
function useVisited(key) {
  const [state, setState] = useState2({ key, visits: {}, unavailable: false });
  const current = useRef2(state);
  const commit = useCallback((next) => {
    current.current = next;
    setState(next);
  }, []);
  useEffect2(() => {
    const saved = readVisits(key);
    commit({ key, ...saved });
    const sync = () => {
      const next = readVisits(key);
      commit({ key, ...next, visits: next.unavailable ? current.current.visits : next.visits });
    };
    const onStorage = (event) => {
      if (key !== null && (event.key === key || event.key === null)) sync();
    };
    const onLocalVisit = (event) => {
      const detail = event.detail;
      if (key !== null && detail.key === key) commit({ key, visits: detail.visits, unavailable: detail.unavailable });
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(VISIT_EVENT, onLocalVisit);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VISIT_EVENT, onLocalVisit);
    };
  }, [key, commit]);
  const markVisited = useCallback((id) => {
    const saved = readVisits(key);
    const inMemory = current.current.key === key ? current.current.visits : {};
    const visits = { ...saved.visits, ...inMemory, [id]: (/* @__PURE__ */ new Date()).toISOString() };
    let unavailable = saved.unavailable;
    if (key !== null) {
      try {
        window.localStorage.setItem(key, JSON.stringify(visits));
        unavailable = false;
      } catch {
        unavailable = true;
      }
    }
    commit({ key, visits, unavailable });
    if (key !== null) window.dispatchEvent(new CustomEvent(VISIT_EVENT, { detail: { key, visits, unavailable } }));
  }, [key, commit]);
  return {
    visits: state.key === key ? state.visits : {},
    storageUnavailable: state.key === key && state.unavailable,
    markVisited
  };
}

// src/ReplyOpportunityGrid.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var countFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
var joinedFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
var metricTypes = ["replies", "reposts", "likes", "views"];
function relativeTime(timestamp, now) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 1e3));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
function Avatar({ tweet, index }) {
  const [failedUrl, setFailedUrl] = useState3();
  return /* @__PURE__ */ jsxs2("span", { className: `avatar avatar-${index % 5}`, "aria-hidden": "true", children: [
    tweet.name.trim().split(/\s+/u).slice(0, 2).map((part) => [...part][0]).join(""),
    tweet.avatarUrl && failedUrl !== tweet.avatarUrl && /* @__PURE__ */ jsx2("img", { src: tweet.avatarUrl, alt: "", loading: "lazy", referrerPolicy: "no-referrer", onError: () => setFailedUrl(tweet.avatarUrl) })
  ] });
}
function TweetCard({ tweet, index, score, now, previewLines, visitedAt, onVisit }) {
  const bodyId = useId();
  const [expanded, setExpanded] = useState3(false);
  const preview = useTextPreview(tweet.body, previewLines);
  const joinedAt = Date.parse(tweet.joinedAt);
  const joined = `Joined ${Number.isFinite(joinedAt) ? joinedFormatter.format(joinedAt) : "unknown"}`;
  const href = `https://x.com/${encodeURIComponent(tweet.handle)}/status/${encodeURIComponent(tweet.id)}`;
  const visit = (event) => {
    if (event.button === 0 || event.button === 1) onVisit(tweet.id);
  };
  useEffect3(() => {
    setExpanded(false);
  }, [tweet.body]);
  return /* @__PURE__ */ jsxs2("article", { className: `tweet-card opportunity-${score.label.toLowerCase()}${visitedAt ? " is-visited" : ""}`, "data-id": tweet.id, children: [
    /* @__PURE__ */ jsxs2("a", { className: "card-link", href, target: "_blank", rel: "noopener noreferrer", onClick: visit, onAuxClick: visit, children: [
      /* @__PURE__ */ jsxs2("div", { className: "author", children: [
        /* @__PURE__ */ jsx2(Avatar, { tweet, index }),
        /* @__PURE__ */ jsxs2("div", { className: "author-details", children: [
          /* @__PURE__ */ jsxs2("span", { className: "author-identity", children: [
            /* @__PURE__ */ jsx2("span", { className: "author-name", title: tweet.name, children: tweet.name }),
            tweet.verified && /* @__PURE__ */ jsx2("span", { className: "verified-badge", role: "img", "aria-label": "Verified account", title: "Verified account", children: /* @__PURE__ */ jsx2(Icon, { type: "verified" }) })
          ] }),
          /* @__PURE__ */ jsxs2("span", { className: "author-meta", children: [
            /* @__PURE__ */ jsxs2("span", { className: "author-handle", title: `@${tweet.handle}`, children: [
              "@",
              tweet.handle
            ] }),
            /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\xB7" }),
            /* @__PURE__ */ jsx2("time", { className: "tweet-time", dateTime: tweet.createdAt, title: new Date(tweet.createdAt).toUTCString(), children: relativeTime(tweet.createdAt, now) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("span", { className: "opportunity-score", role: "img", title: score.explanation, "aria-label": score.explanation, children: [
          score.label,
          " \xB7 ",
          score.score
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "account-glance", children: [
        /* @__PURE__ */ jsxs2("span", { title: `${tweet.following.toLocaleString("en-US")} following`, children: [
          /* @__PURE__ */ jsx2("strong", { children: countFormatter.format(tweet.following) }),
          " following"
        ] }),
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\xB7" }),
        /* @__PURE__ */ jsxs2("span", { title: `${tweet.followers.toLocaleString("en-US")} followers`, children: [
          /* @__PURE__ */ jsx2("strong", { children: countFormatter.format(tweet.followers) }),
          " followers"
        ] }),
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\xB7" }),
        /* @__PURE__ */ jsx2("span", { title: joined, children: joined })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "tweet-body-wrap", children: [
        /* @__PURE__ */ jsx2("p", { id: bodyId, className: "tweet-body", children: expanded ? tweet.body : preview.text }),
        /* @__PURE__ */ jsx2("p", { ref: preview.measureRef, className: "tweet-body tweet-measure", "aria-hidden": "true" })
      ] }),
      /* @__PURE__ */ jsx2("span", { className: "sr-only", children: "Opens on X in a new tab." })
    ] }),
    preview.hiddenWords > 0 && /* @__PURE__ */ jsx2("button", { type: "button", className: "expand-button", "aria-expanded": expanded, "aria-controls": bodyId, onClick: () => setExpanded((value) => !value), children: expanded ? "Show less" : `Show more [${preview.hiddenWords} more words]` }),
    /* @__PURE__ */ jsx2("div", { className: "tweet-metrics", role: "group", "aria-label": "Post metrics", children: metricTypes.map((type) => {
      const label = `${tweet.metrics[type].toLocaleString("en-US")} ${type}`;
      return /* @__PURE__ */ jsxs2("span", { className: "metric", role: "img", "aria-label": label, title: label, children: [
        /* @__PURE__ */ jsx2(Icon, { type }),
        countFormatter.format(tweet.metrics[type])
      ] }, type);
    }) }),
    /* @__PURE__ */ jsxs2("div", { className: "card-footer", children: [
      /* @__PURE__ */ jsx2("span", { className: `source-badge source-${tweet.source}`, children: tweet.source === "candidate" ? "Candidate" : "Feed" }),
      /* @__PURE__ */ jsx2("span", { className: "visit-status", title: visitedAt ? `Opened ${new Date(visitedAt).toUTCString()}` : "Open this post in a new tab", children: visitedAt ? "Visited \u2713" : "Open on X \u2197" })
    ] })
  ] });
}
function ReplyOpportunityGrid({
  tweets,
  scoreOptions,
  minCardWidth = DEFAULT_MIN_CARD_WIDTH,
  gridGap = DEFAULT_GRID_GAP,
  mainInlinePad = DEFAULT_MAIN_INLINE_PAD,
  maxColumns = DEFAULT_MAX_COLUMNS,
  breakpoints,
  storageKey = DEFAULT_STORAGE_KEY,
  previewLines = DEFAULT_PREVIEW_LINES,
  className,
  style,
  id,
  ariaLabel = "Tweets worth replying to",
  emptyState = "No posts to explore yet.",
  onVisitedChange
}) {
  if (breakpoints) validateBreakpoints(breakpoints);
  if (!Number.isSafeInteger(previewLines) || previewLines < 1) throw new RangeError("previewLines must be a positive integer");
  if (!(minCardWidth > 0) || !(gridGap >= 0) || !(mainInlinePad >= 0) || !Number.isSafeInteger(maxColumns) || maxColumns < 1) {
    throw new RangeError("minCardWidth/gridGap/mainInlinePad/maxColumns must be valid positive layout options");
  }
  const [viewportWidth, setViewportWidth] = useState3(0);
  const [mountedAt, setMountedAt] = useState3(null);
  const now = scoreOptions?.now ?? mountedAt ?? 0;
  useEffect3(() => {
    setMountedAt(Date.now());
    const resize = () => setViewportWidth(window.innerWidth);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const records = useMemo(() => uniqueTweets(tweets), [tweets]);
  const scores = useMemo(() => records.map((tweet) => scoreReplyOpportunity(tweet, { ...scoreOptions, now })), [records, scoreOptions, now]);
  const { visits, storageUnavailable, markVisited } = useVisited(storageKey);
  const count = columnCountForWidth(viewportWidth, breakpoints ? { breakpoints } : { minCardWidth, gridGap, mainInlinePad, maxColumns });
  const columns = Array.from({ length: count }, () => []);
  records.forEach((tweet, index) => {
    columns[index % count].push({ tweet, index });
  });
  const callbackRef = useRef3(onVisitedChange);
  useEffect3(() => {
    callbackRef.current = onVisitedChange;
  }, [onVisitedChange]);
  const visitedIds = JSON.stringify(records.filter((tweet) => Object.hasOwn(visits, tweet.id)).map((tweet) => tweet.id));
  useEffect3(() => {
    callbackRef.current?.(JSON.parse(visitedIds));
  }, [visitedIds]);
  return /* @__PURE__ */ jsxs2("section", { id, className: `x-reply-opportunity-grid${className ? ` ${className}` : ""}`, style, "aria-label": ariaLabel, children: [
    storageUnavailable && /* @__PURE__ */ jsx2("p", { className: "storage-notice", role: "status", children: "Browser storage is unavailable or unreadable. Visited posts will only stay marked for this page session." }),
    records.length === 0 ? /* @__PURE__ */ jsx2("div", { className: "empty-state", role: "status", children: emptyState }) : /* @__PURE__ */ jsx2("div", { className: "tweet-grid", children: columns.map((column, col) => /* @__PURE__ */ jsx2("div", { className: "tweet-col", "data-col": col, children: column.map(({ tweet, index }) => /* @__PURE__ */ jsx2(TweetCard, { tweet, index, score: scores[index], now, previewLines, visitedAt: Object.hasOwn(visits, tweet.id) ? visits[tweet.id] : void 0, onVisit: markVisited }, tweet.id)) }, col)) })
  ] });
}
export {
  DEFAULT_COLUMN_BREAKPOINTS,
  DEFAULT_FRESHNESS_HALF_LIFE_HOURS,
  DEFAULT_GRID_GAP,
  DEFAULT_INTEREST_LEXICON,
  DEFAULT_MAIN_INLINE_PAD,
  DEFAULT_MAX_COLUMNS,
  DEFAULT_MIN_CARD_WIDTH,
  DEFAULT_PREVIEW_LINES,
  DEFAULT_ROOM_HALF_LIVES,
  DEFAULT_SCORE_THRESHOLDS,
  DEFAULT_SCORE_WEIGHTS,
  DEFAULT_STORAGE_KEY,
  ReplyOpportunityGrid,
  columnCountForWidth,
  scoreReplyOpportunity,
  uniqueTweets,
  validateBreakpoints
};
//# sourceMappingURL=index.js.map