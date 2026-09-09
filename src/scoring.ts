import lexicon from './interest-lexicon.json';
import type {
  InterestLexicon, ReplyOpportunityLabel, RoomHalfLives, ScoreOptions,
  ScorePart, ScoreResult, ScoreThresholds, ScoreWeights, Tweet,
} from './types';

export const DEFAULT_INTEREST_LEXICON: InterestLexicon = Object.freeze(lexicon);
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = Object.freeze({
  peerFit: 32, followingSignal: 8, replyRoom: 24,
  likeRoom: 9.6, viewRoom: 6.4, bioInterest: 20,
});
export const DEFAULT_SCORE_THRESHOLDS: ScoreThresholds = Object.freeze({ best: 70, good: 50 });
export const DEFAULT_ROOM_HALF_LIVES: RoomHalfLives = Object.freeze({ replies: 5, likes: 50, views: 1000 });
export const DEFAULT_FRESHNESS_HALF_LIFE_HOURS = 24;

function nonnegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
  return value;
}

function positive(value: number, name: string): number {
  if (nonnegative(value, name) === 0) throw new RangeError(`${name} must be positive`);
  return value;
}

/** No mutation, storage, network, or timers. Pass opts.now for deterministic results. */
export function scoreReplyOpportunity(tweet: Tweet, opts: ScoreOptions = {}): ScoreResult {
  const now = opts.now ?? Date.now();
  const createdAt = Date.parse(tweet.createdAt);
  if (!Number.isFinite(now) || !Number.isFinite(createdAt)) throw new RangeError('now and createdAt must be valid timestamps');
  const followers = nonnegative(tweet.followers, 'followers');
  const following = nonnegative(tweet.following, 'following');
  const replies = nonnegative(tweet.metrics.replies, 'replies');
  const likes = nonnegative(tweet.metrics.likes, 'likes');
  const views = nonnegative(tweet.metrics.views, 'views');
  const halfLife = positive(opts.freshnessHalfLifeHours ?? DEFAULT_FRESHNESS_HALF_LIFE_HOURS, 'freshnessHalfLifeHours');
  const [peerMin, peerMax] = opts.peerFollowerRange ?? [100, 2000];
  positive(peerMin, 'peerFollowerRange minimum');
  if (positive(peerMax, 'peerFollowerRange maximum') < peerMin) throw new RangeError('peerFollowerRange must be ascending');
  const followingFloor = positive(opts.followingFloor ?? 240, 'followingFloor');
  const bioWeightForFullScore = positive(opts.bioWeightForFullScore ?? 6, 'bioWeightForFullScore');
  const room = { ...DEFAULT_ROOM_HALF_LIVES, ...opts.roomHalfLives };
  for (const [key, value] of Object.entries(room)) positive(value, `roomHalfLives.${key}`);

  const weights = { ...DEFAULT_SCORE_WEIGHTS, ...opts.weights };
  for (const [key, value] of Object.entries(weights)) nonnegative(value, `weights.${key}`);
  const weightTotal = positive(Object.values(weights).reduce((sum, weight) => sum + weight, 0), 'weight total');
  const thresholds = { ...DEFAULT_SCORE_THRESHOLDS, ...opts.thresholds };
  if (nonnegative(thresholds.good, 'thresholds.good') > nonnegative(thresholds.best, 'thresholds.best') || thresholds.best > 100) {
    throw new RangeError('thresholds must satisfy 0 <= good <= best <= 100');
  }

  const words = new Set((tweet.bio ?? '').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const vocabulary = opts.lexicon ?? DEFAULT_INTEREST_LEXICON;
  for (const [term, weight] of Object.entries(vocabulary)) {
    if (!/^[\p{L}\p{N}]+$/u.test(term) || term !== term.normalize('NFKC').toLowerCase()) {
      throw new RangeError('lexicon keys must be lowercase NFKC single letter/digit tokens');
    }
    nonnegative(weight, `lexicon.${term}`);
  }
  const matches = Object.entries(vocabulary).filter(([term, weight]) => weight > 0 && words.has(term));
  const interestWeight = matches.reduce((sum, [, weight]) => sum + weight, 0);
  const signals: readonly [keyof ScoreWeights, string, number][] = [
    ['peerFit', 'Peer fit', Math.min(1, followers / peerMin, peerMax / Math.max(followers, 1))],
    ['followingSignal', 'Following signal', Math.min(1, following / Math.max(followers, followingFloor))],
    ['replyRoom', 'Reply room', 1 / (1 + replies / room.replies)],
    ['likeRoom', 'Like room', 1 / (1 + likes / room.likes)],
    ['viewRoom', 'View room', 1 / (1 + views / room.views)],
    ['bioInterest', 'Bio interest', Math.min(1, interestWeight / bioWeightForFullScore)],
  ];
  const parts: ScorePart[] = signals.map(([key, name, fit]) => {
    const maximum = weights[key] / weightTotal * 100;
    return { key, name, fit, points: maximum * fit, maximum };
  });
  const ageHours = Math.max(0, (now - createdAt) / 3600000);
  const freshness = 1 / (1 + ageHours / halfLife);
  const score = Math.min(100, Math.max(0, Math.round(parts.reduce((sum, part) => sum + part.points, 0) * freshness)));
  const label: ReplyOpportunityLabel = score >= thresholds.best ? 'Best' : score >= thresholds.good ? 'Good' : 'Average';
  const matchedBioTerms = matches.map(([term]) => term);
  const breakdown = parts.map(({ name, points, maximum }) => `${name}: ${points.toFixed(1)}/${Number(maximum.toFixed(2))}`).join('; ');
  return {
    score, label, parts, matchedBioTerms, freshness, ageHours,
    explanation: `Reply opportunity: ${label} ${score}/100. ${breakdown}. Matched bio terms: ${matchedBioTerms.join(', ') || 'none'}. Bio: ${tweet.bio || 'not provided'}. Freshness: ×${freshness.toFixed(2)} (${ageHours.toFixed(1)}h old; half at ${halfLife}h). Heuristic, not a follow-back probability. Counts are a snapshot; age is evaluated at the supplied time.`,
  };
}
