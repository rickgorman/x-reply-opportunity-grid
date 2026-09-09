import rows from './tweets.json';
import type { Tweet } from '../src/types';

// JSON imports widen string literals; validate the source discriminant here.
export const demoTweets: readonly Tweet[] = rows.map(row => {
  if (row.source !== 'feed' && row.source !== 'candidate') throw new Error('Invalid fixture source');
  return { ...row, source: row.source };
});

/** Fixed demo clock keeps the fictional fixture tiers useful on every visit. */
export const DEMO_NOW = Date.parse('2026-09-08T18:00:00Z');
