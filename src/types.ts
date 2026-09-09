import type { CSSProperties, ReactNode } from 'react';

export type TweetSource = 'feed' | 'candidate';
export type ReplyOpportunityLabel = 'Best' | 'Good' | 'Average';

export interface TweetMetrics {
  readonly replies: number;
  readonly reposts: number;
  readonly likes: number;
  readonly views: number;
}

export interface Tweet {
  /** Keep X IDs as strings to avoid precision loss. First duplicate ID wins. */
  readonly id: string;
  readonly name: string;
  /** X handle without a leading @. */
  readonly handle: string;
  readonly bio?: string;
  readonly avatarUrl?: string;
  readonly verified?: boolean;
  readonly source: TweetSource;
  /** ISO 8601 timestamp, including a timezone. */
  readonly createdAt: string;
  /** ISO date or timestamp. Rendered as a UTC month and year. */
  readonly joinedAt: string;
  readonly body: string;
  readonly following: number;
  readonly followers: number;
  readonly metrics: TweetMetrics;
}

export interface ScoreWeights {
  readonly peerFit: number;
  readonly followingSignal: number;
  readonly replyRoom: number;
  readonly likeRoom: number;
  readonly viewRoom: number;
  readonly bioInterest: number;
}

export interface ScoreThresholds {
  readonly best: number;
  readonly good: number;
}

export interface RoomHalfLives {
  readonly replies: number;
  readonly likes: number;
  readonly views: number;
}

export type InterestLexicon = Readonly<Record<string, number>>;

export interface ScoreOptions {
  /** Epoch milliseconds. Defaults to Date.now(); supply for reproducible scores. */
  readonly now?: number;
  /** Partial overrides; the resulting weights are normalized to total 100. */
  readonly weights?: Partial<ScoreWeights>;
  readonly thresholds?: Partial<ScoreThresholds>;
  /** Replaces the default lexicon. Keys are normalized, single Unicode tokens. */
  readonly lexicon?: InterestLexicon;
  readonly freshnessHalfLifeHours?: number;
  readonly peerFollowerRange?: readonly [minimum: number, maximum: number];
  readonly followingFloor?: number;
  readonly roomHalfLives?: Partial<RoomHalfLives>;
  readonly bioWeightForFullScore?: number;
}

export interface ScorePart {
  readonly key: keyof ScoreWeights;
  readonly name: string;
  /** Signal in [0, 1], before weighting and freshness. */
  readonly fit: number;
  readonly points: number;
  readonly maximum: number;
}

export interface ScoreResult {
  readonly score: number;
  readonly label: ReplyOpportunityLabel;
  readonly explanation: string;
  readonly parts: readonly ScorePart[];
  readonly matchedBioTerms: readonly string[];
  readonly freshness: number;
  readonly ageHours: number;
}

export interface ColumnBreakpoint {
  /** Inclusive viewport width in CSS pixels, not the grid container width. */
  readonly minWidth: number;
  readonly columns: number;
}

export interface ReplyOpportunityGridProps {
  readonly tweets: readonly Tweet[];
  readonly scoreOptions?: ScoreOptions;
  /**
   * Preferred minimum card width in CSS pixels. Column count shrinks before cards
   * go under this floor. Default 420. Ignored when `breakpoints` is provided.
   */
  readonly minCardWidth?: number;
  /** Gap between columns/cards in CSS pixels. Default 12. Used with minCardWidth fitting. */
  readonly gridGap?: number;
  /** Horizontal chrome padding assumed outside the grid when fitting columns. Default 56. */
  readonly mainInlinePad?: number;
  /** Cap on columns when using min-card-width fitting. Default 7. */
  readonly maxColumns?: number;
  /**
   * Legacy breakpoint table. When set, replaces min-card-width fitting.
   * Largest matching minWidth wins; otherwise 1 column.
   */
  readonly breakpoints?: readonly ColumnBreakpoint[];
  /** null disables persistence; visits still work for this mounted grid. */
  readonly storageKey?: string | null;
  readonly previewLines?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly id?: string;
  readonly ariaLabel?: string;
  readonly emptyState?: ReactNode;
  /** Unique visited IDs from the current tweets, in input order. */
  readonly onVisitedChange?: (visitedIds: readonly string[]) => void;
}
