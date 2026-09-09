import { describe, expect, it } from 'vitest';
import {
  scoreReplyOpportunity,
  DEFAULT_SCORE_WEIGHTS,
  DEFAULT_FRESHNESS_HALF_LIFE_HOURS,
} from './scoring';
import type { Tweet } from './types';

const base: Tweet = {
  id: '1',
  name: 'Test User',
  handle: 'test',
  bio: 'Clinical informatics builder',
  source: 'feed',
  createdAt: '2026-09-08T18:00:00Z',
  joinedAt: '2019-01-01',
  body: 'Hello',
  following: 240,
  followers: 500,
  metrics: { replies: 1, reposts: 0, likes: 10, views: 200 },
  verified: false,
};

describe('scoreReplyOpportunity', () => {
  it('matches the documented fresh clinical example (~89 Best)', () => {
    const result = scoreReplyOpportunity(base, { now: Date.parse('2026-09-08T18:00:00Z') });
    expect(result.score).toBe(89);
    expect(result.label).toBe('Best');
    expect(result.matchedBioTerms).toEqual(expect.arrayContaining(['clinical', 'informatics', 'builder']));
  });

  it('applies 24h freshness half-life', () => {
    const fresh = scoreReplyOpportunity(base, { now: Date.parse('2026-09-08T18:00:00Z') });
    const dayOld = scoreReplyOpportunity(
      { ...base, createdAt: '2026-09-07T18:00:00Z' },
      { now: Date.parse('2026-09-08T18:00:00Z') },
    );
    expect(dayOld.freshness).toBeCloseTo(0.5, 5);
    expect(dayOld.score).toBe(Math.round(fresh.score * 0.5));
    expect(DEFAULT_FRESHNESS_HALF_LIFE_HOURS).toBe(24);
  });

  it('uses only Best/Good/Average tiers', () => {
    const best = scoreReplyOpportunity(base, { now: Date.parse('2026-09-08T18:00:00Z') });
    const average = scoreReplyOpportunity(
      { ...base, bio: '', followers: 50000, metrics: { replies: 40, reposts: 0, likes: 400, views: 40000 } },
      { now: Date.parse('2026-09-08T18:00:00Z') },
    );
    expect(['Best', 'Good', 'Average']).toContain(best.label);
    expect(average.label).toBe('Average');
    expect(average.score).toBeLessThan(50);
  });

  it('keeps default weights summing to 100', () => {
    const total = Object.values(DEFAULT_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 5);
  });
});
