import { describe, expect, it } from 'vitest';
import {
  columnCountForWidth,
  DEFAULT_MIN_CARD_WIDTH,
  uniqueTweets,
} from './layout';
import type { Tweet } from './types';

const tweet = (id: string): Tweet => ({
  id,
  name: 'N',
  handle: 'h',
  source: 'feed',
  createdAt: '2026-09-08T00:00:00Z',
  joinedAt: '2020-01-01',
  body: 'b',
  following: 1,
  followers: 1,
  metrics: { replies: 0, reposts: 0, likes: 0, views: 0 },
});

describe('columnCountForWidth', () => {
  it('fits eight ultrawide columns and drops columns before crushing', () => {
    expect(DEFAULT_MIN_CARD_WIDTH).toBe(400);
    expect(columnCountForWidth(2200)).toBe(5);
    expect(columnCountForWidth(2560)).toBe(6);
    expect(columnCountForWidth(3440)).toBe(8);
    expect(columnCountForWidth(3339)).toBe(7);
    expect(columnCountForWidth(3340)).toBe(8);
    expect(columnCountForWidth(5000)).toBe(8);
    expect(columnCountForWidth(356)).toBe(1);
    expect(columnCountForWidth(1200)).toBe(2);
    expect(columnCountForWidth(100)).toBe(1);
  });

  it('honors minCardWidth overrides', () => {
    expect(columnCountForWidth(2000, { minCardWidth: 400, maxColumns: 7 })).toBeLessThan(
      columnCountForWidth(2000, { minCardWidth: 250, maxColumns: 7 }),
    );
  });

  it('supports legacy breakpoints when provided', () => {
    expect(columnCountForWidth(2200, {
      breakpoints: [
        { minWidth: 2200, columns: 7 },
        { minWidth: 0, columns: 1 },
      ],
    })).toBe(7);
  });
});

describe('uniqueTweets', () => {
  it('keeps input order and first duplicate', () => {
    const rows = [tweet('a'), tweet('b'), tweet('a')];
    expect(uniqueTweets(rows).map(row => row.id)).toEqual(['a', 'b']);
  });
});
