'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Icon } from './Icons';
import {
  columnCountForWidth,
  DEFAULT_MIN_CARD_WIDTH,
  DEFAULT_GRID_GAP,
  DEFAULT_MAIN_INLINE_PAD,
  DEFAULT_MAX_COLUMNS,
  DEFAULT_PREVIEW_LINES,
  DEFAULT_STORAGE_KEY,
  uniqueTweets,
  validateBreakpoints,
} from './layout';
import { scoreReplyOpportunity } from './scoring';
import type { ReplyOpportunityGridProps, ScoreResult, Tweet } from './types';
import { useTextPreview } from './useTextPreview';
import { useVisited } from './useVisited';

const countFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const joinedFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const metricTypes = ['replies', 'reposts', 'likes', 'views'] as const;

function relativeTime(timestamp: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function Avatar({ tweet, index }: { tweet: Tweet; index: number }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return <span className={`avatar avatar-${index % 5}`} aria-hidden="true">
    {tweet.name.trim().split(/\s+/u).slice(0, 2).map(part => [...part][0]).join('')}
    {tweet.avatarUrl && failedUrl !== tweet.avatarUrl && <img src={tweet.avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(tweet.avatarUrl)} />}
  </span>;
}

function TweetCard({ tweet, index, score, now, previewLines, visitedAt, onVisit }: {
  tweet: Tweet; index: number; score: ScoreResult; now: number;
  previewLines: number; visitedAt: string | undefined; onVisit: (id: string) => void;
}) {
  const bodyId = useId();
  const [expanded, setExpanded] = useState(false);
  const preview = useTextPreview(tweet.body, previewLines);
  const joinedAt = Date.parse(tweet.joinedAt);
  const href = `https://x.com/${encodeURIComponent(tweet.handle)}/status/${encodeURIComponent(tweet.id)}`;
  const visit = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 || event.button === 1) onVisit(tweet.id);
  };
  useEffect(() => { setExpanded(false); }, [tweet.body]);

  return <article className={`tweet-card opportunity-${score.label.toLowerCase()}${visitedAt ? ' is-visited' : ''}`} data-id={tweet.id}>
    <a className="card-link" href={href} target="_blank" rel="noopener noreferrer" onClick={visit} onAuxClick={visit}>
      <div className="author">
        <Avatar tweet={tweet} index={index} />
        <div className="author-details">
          <span className="author-identity">
            <span className="author-name" title={tweet.name}>{tweet.name}</span>
            {tweet.verified && <span className="verified-badge" role="img" aria-label="Verified account" title="Verified account"><Icon type="verified" /></span>}
          </span>
          <span className="author-meta">
            <span className="author-handle" title={`@${tweet.handle}`}>@{tweet.handle}</span>
            <span aria-hidden="true">·</span>
            <time className="tweet-time" dateTime={tweet.createdAt} title={new Date(tweet.createdAt).toUTCString()}>{relativeTime(tweet.createdAt, now)}</time>
          </span>
          <div className="account-glance">
            <span title={`${tweet.following.toLocaleString('en-US')} following`}><strong>{countFormatter.format(tweet.following)}</strong> following</span>
            <span aria-hidden="true">·</span>
            <span title={`${tweet.followers.toLocaleString('en-US')} followers`}><strong>{countFormatter.format(tweet.followers)}</strong> followers</span>
            <span aria-hidden="true">·</span>
            <span>Joined {Number.isFinite(joinedAt) ? joinedFormatter.format(joinedAt) : 'unknown'}</span>
          </div>
        </div>
        <span className="opportunity-score" role="img" title={score.explanation} aria-label={score.explanation}>{score.label} · {score.score}</span>
      </div>
      <div className="tweet-body-wrap">
        <p id={bodyId} className="tweet-body">{expanded ? tweet.body : preview.text}</p>
        <p ref={preview.measureRef} className="tweet-body tweet-measure" aria-hidden="true" />
      </div>
      <span className="sr-only">Opens on X in a new tab.</span>
    </a>
    {preview.hiddenWords > 0 && <button type="button" className="expand-button" aria-expanded={expanded} aria-controls={bodyId} onClick={() => setExpanded(value => !value)}>
      {expanded ? 'Show less' : `Show more [${preview.hiddenWords} more words]`}
    </button>}
    <div className="tweet-metrics" role="group" aria-label="Post metrics">
      {metricTypes.map(type => {
        const label = `${tweet.metrics[type].toLocaleString('en-US')} ${type}`;
        return <span key={type} className="metric" role="img" aria-label={label} title={label}><Icon type={type} />{countFormatter.format(tweet.metrics[type])}</span>;
      })}
    </div>
    <div className="card-footer">
      <span className={`source-badge source-${tweet.source}`}>{tweet.source === 'candidate' ? 'Candidate' : 'Feed'}</span>
      <span className="visit-status" title={visitedAt ? `Opened ${new Date(visitedAt).toUTCString()}` : 'Open this post in a new tab'}>{visitedAt ? 'Visited ✓' : 'Open on X ↗'}</span>
    </div>
  </article>;
}

export function ReplyOpportunityGrid({
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
  ariaLabel = 'Tweets worth replying to',
  emptyState = 'No posts to explore yet.',
  onVisitedChange,
}: ReplyOpportunityGridProps) {
  if (breakpoints) validateBreakpoints(breakpoints);
  if (!Number.isSafeInteger(previewLines) || previewLines < 1) throw new RangeError('previewLines must be a positive integer');
  if (!(minCardWidth > 0) || !(gridGap >= 0) || !(mainInlinePad >= 0) || !Number.isSafeInteger(maxColumns) || maxColumns < 1) {
    throw new RangeError('minCardWidth/gridGap/mainInlinePad/maxColumns must be valid positive layout options');
  }
  const [viewportWidth, setViewportWidth] = useState(0);
  const [mountedAt, setMountedAt] = useState<number | null>(null);
  // A fixed first timestamp keeps default server markup identical during hydration.
  const now = scoreOptions?.now ?? mountedAt ?? 0;
  useEffect(() => {
    setMountedAt(Date.now());
    const resize = () => setViewportWidth(window.innerWidth);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const records = useMemo(() => uniqueTweets(tweets), [tweets]);
  const scores = useMemo(() => records.map(tweet => scoreReplyOpportunity(tweet, { ...scoreOptions, now })), [records, scoreOptions, now]);
  const { visits, storageUnavailable, markVisited } = useVisited(storageKey);
  const count = columnCountForWidth(viewportWidth, breakpoints ? { breakpoints } : { minCardWidth, gridGap, mainInlinePad, maxColumns });
  const columns = Array.from({ length: count }, () => [] as { tweet: Tweet; index: number }[]);
  records.forEach((tweet, index) => { columns[index % count]!.push({ tweet, index }); });
  const callbackRef = useRef(onVisitedChange);
  useEffect(() => { callbackRef.current = onVisitedChange; }, [onVisitedChange]);
  const visitedIds = JSON.stringify(records.filter(tweet => Object.hasOwn(visits, tweet.id)).map(tweet => tweet.id));
  useEffect(() => { callbackRef.current?.(JSON.parse(visitedIds) as string[]); }, [visitedIds]);

  return <section id={id} className={`x-reply-opportunity-grid${className ? ` ${className}` : ''}`} style={style} aria-label={ariaLabel}>
    {storageUnavailable && <p className="storage-notice" role="status">Browser storage is unavailable or unreadable. Visited posts will only stay marked for this page session.</p>}
    {records.length === 0 ? <div className="empty-state" role="status">{emptyState}</div> : <div className="tweet-grid">
      {columns.map((column, col) => <div className="tweet-col" key={col} data-col={col}>
        {column.map(({ tweet, index }) => <TweetCard key={tweet.id} tweet={tweet} index={index} score={scores[index]!} now={now} previewLines={previewLines} visitedAt={Object.hasOwn(visits, tweet.id) ? visits[tweet.id] : undefined} onVisit={markVisited} />)}
      </div>)}
    </div>}
  </section>;
}
