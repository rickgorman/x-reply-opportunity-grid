import * as react from 'react';
import { CSSProperties, ReactNode } from 'react';

type TweetSource = 'feed' | 'candidate';
type ReplyOpportunityLabel = 'Best' | 'Good' | 'Average';
interface TweetMetrics {
    readonly replies: number;
    readonly reposts: number;
    readonly likes: number;
    readonly views: number;
}
interface Tweet {
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
interface ScoreWeights {
    readonly peerFit: number;
    readonly followingSignal: number;
    readonly replyRoom: number;
    readonly likeRoom: number;
    readonly viewRoom: number;
    readonly bioInterest: number;
}
interface ScoreThresholds {
    readonly best: number;
    readonly good: number;
}
interface RoomHalfLives {
    readonly replies: number;
    readonly likes: number;
    readonly views: number;
}
type InterestLexicon = Readonly<Record<string, number>>;
interface ScoreOptions {
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
interface ScorePart {
    readonly key: keyof ScoreWeights;
    readonly name: string;
    /** Signal in [0, 1], before weighting and freshness. */
    readonly fit: number;
    readonly points: number;
    readonly maximum: number;
}
interface ScoreResult {
    readonly score: number;
    readonly label: ReplyOpportunityLabel;
    readonly explanation: string;
    readonly parts: readonly ScorePart[];
    readonly matchedBioTerms: readonly string[];
    readonly freshness: number;
    readonly ageHours: number;
}
interface ColumnBreakpoint {
    /** Inclusive viewport width in CSS pixels, not the grid container width. */
    readonly minWidth: number;
    readonly columns: number;
}
interface ReplyOpportunityGridProps {
    readonly tweets: readonly Tweet[];
    readonly scoreOptions?: ScoreOptions;
    /**
     * Preferred minimum card width in CSS pixels. Column count shrinks before cards
     * go under this floor. Default 400. Ignored when `breakpoints` is provided.
     */
    readonly minCardWidth?: number;
    /** Gap between columns/cards in CSS pixels. Default 12. Used with minCardWidth fitting. */
    readonly gridGap?: number;
    /** Horizontal chrome padding assumed outside the grid when fitting columns. Default 56. */
    readonly mainInlinePad?: number;
    /** Cap on columns when using min-card-width fitting. Default 8. */
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

declare function ReplyOpportunityGrid({ tweets, scoreOptions, minCardWidth, gridGap, mainInlinePad, maxColumns, breakpoints, storageKey, previewLines, className, style, id, ariaLabel, emptyState, onVisitedChange, }: ReplyOpportunityGridProps): react.JSX.Element;

declare const DEFAULT_INTEREST_LEXICON: InterestLexicon;
declare const DEFAULT_SCORE_WEIGHTS: ScoreWeights;
declare const DEFAULT_SCORE_THRESHOLDS: ScoreThresholds;
declare const DEFAULT_ROOM_HALF_LIVES: RoomHalfLives;
declare const DEFAULT_FRESHNESS_HALF_LIFE_HOURS = 24;
/** No mutation, storage, network, or timers. Pass opts.now for deterministic results. */
declare function scoreReplyOpportunity(tweet: Tweet, opts?: ScoreOptions): ScoreResult;

/** Preferred card floor; column count shrinks before cards go under this. */
declare const DEFAULT_MIN_CARD_WIDTH = 400;
declare const DEFAULT_GRID_GAP = 12;
declare const DEFAULT_MAIN_INLINE_PAD = 56;
declare const DEFAULT_MAX_COLUMNS = 8;
/** @deprecated Prefer min-card-width layout via columnCountForWidth(width, opts). Kept for option compatibility. */
declare const DEFAULT_COLUMN_BREAKPOINTS: readonly ColumnBreakpoint[];
declare const DEFAULT_STORAGE_KEY = "x-reply-visited";
declare const DEFAULT_PREVIEW_LINES = 12;
declare function validateBreakpoints(breakpoints: readonly ColumnBreakpoint[]): void;
type ColumnCountOptions = {
    minCardWidth?: number;
    gridGap?: number;
    mainInlinePad?: number;
    maxColumns?: number;
    /** If provided, uses legacy breakpoint table instead of min-width fitting. */
    breakpoints?: readonly ColumnBreakpoint[];
};
declare function columnCountForWidth(width: number, options?: ColumnCountOptions | readonly ColumnBreakpoint[]): number;
declare function uniqueTweets(tweets: readonly Tweet[]): Tweet[];

export { type ColumnBreakpoint, type ColumnCountOptions, DEFAULT_COLUMN_BREAKPOINTS, DEFAULT_FRESHNESS_HALF_LIFE_HOURS, DEFAULT_GRID_GAP, DEFAULT_INTEREST_LEXICON, DEFAULT_MAIN_INLINE_PAD, DEFAULT_MAX_COLUMNS, DEFAULT_MIN_CARD_WIDTH, DEFAULT_PREVIEW_LINES, DEFAULT_ROOM_HALF_LIVES, DEFAULT_SCORE_THRESHOLDS, DEFAULT_SCORE_WEIGHTS, DEFAULT_STORAGE_KEY, type InterestLexicon, ReplyOpportunityGrid, type ReplyOpportunityGridProps, type ReplyOpportunityLabel, type RoomHalfLives, type ScoreOptions, type ScorePart, type ScoreResult, type ScoreThresholds, type ScoreWeights, type Tweet, type TweetMetrics, type TweetSource, columnCountForWidth, scoreReplyOpportunity, uniqueTweets, validateBreakpoints };
