import type { ColumnBreakpoint, Tweet } from './types';

/** Preferred card floor; column count shrinks before cards go under this. */
export const DEFAULT_MIN_CARD_WIDTH = 400;
export const DEFAULT_GRID_GAP = 12;
export const DEFAULT_MAIN_INLINE_PAD = 56;
export const DEFAULT_MAX_COLUMNS = 8;

/** @deprecated Prefer min-card-width layout via columnCountForWidth(width, opts). Kept for option compatibility. */
export const DEFAULT_COLUMN_BREAKPOINTS: readonly ColumnBreakpoint[] = Object.freeze([
  { minWidth: 0, columns: 1 }, { minWidth: 600, columns: 2 },
  { minWidth: 900, columns: 3 }, { minWidth: 1200, columns: 4 },
  { minWidth: 1500, columns: 5 }, { minWidth: 1800, columns: 6 },
  { minWidth: 2200, columns: 7 },
].map(breakpoint => Object.freeze(breakpoint)));
export const DEFAULT_STORAGE_KEY = 'x-reply-visited';
export const DEFAULT_PREVIEW_LINES = 12;

export function validateBreakpoints(breakpoints: readonly ColumnBreakpoint[]): void {
  for (const { minWidth, columns } of breakpoints) {
    if (!Number.isFinite(minWidth) || minWidth < 0 || !Number.isSafeInteger(columns) || columns < 1) {
      throw new RangeError('breakpoints require a finite nonnegative minWidth and positive integer columns');
    }
  }
}

export type ColumnCountOptions = {
  minCardWidth?: number;
  gridGap?: number;
  mainInlinePad?: number;
  maxColumns?: number;
  /** If provided, uses legacy breakpoint table instead of min-width fitting. */
  breakpoints?: readonly ColumnBreakpoint[];
};

export function columnCountForWidth(width: number, options: ColumnCountOptions | readonly ColumnBreakpoint[] = {}): number {
  // Back-compat: second arg used to be breakpoints array
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

  const opts = options as ColumnCountOptions;
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

export function uniqueTweets(tweets: readonly Tweet[]): Tweet[] {
  const seen = new Set<string>();
  return tweets.filter(tweet => {
    if (seen.has(tweet.id)) return false;
    seen.add(tweet.id);
    return true;
  });
}
