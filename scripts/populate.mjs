#!/usr/bin/env node

/**
 * Future read-only refresh stub. No file reads, file writes, or API calls.
 *
 * A future implementation may retrieve feed and candidate posts only through
 * an explicitly authorized read-only source. Normalize to the tweets.json
 * schema: { id: string, name, handle (without @), source: 'feed' | 'candidate',
 * createdAt: ISO timestamp, body: string }. Keep IDs as strings, deduplicate
 * by ID (first occurrence wins), then replace only the local fixture file.
 *
 * HARD GATE: no posting, replying, liking, reposting, following, messaging,
 * or other account mutations. Refresh must never perform a write to X.
 * An unavailable read-only source must stop refresh, not trigger a fallback
 * that uses browser automation or broader account permissions.
 */

console.log('Fixture mode: no refresh performed; data/tweets.json is unchanged.');
console.log('Future refresh is gated to explicitly authorized read-only retrieval.');
