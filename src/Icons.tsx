import type { TweetMetrics } from './types';

const paths = {
  replies: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />,
  reposts: <path d="m2 7 4-4 4 4M6 3v13a3 3 0 0 0 3 3h3m10-2-4 4-4-4m4 4V8a3 3 0 0 0-3-3h-3" />,
  likes: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  views: <path d="M4 20v-8m5 8V4m6 16V8m5 12V2" />,
  verified: <><path fill="currentColor" stroke="none" d="m12 1 3 2.2 3.7.4 1.1 3.6 2.2 3-1.1 3.6.4 3.7-3.3 1.7-2.2 3-3.6-1-3.6 1-2.2-3L3.1 17l.4-3.7-1.1-3.6 2.2-3 1.1-3.6 3.7-.4Z" /><path stroke="#fff" d="m7.5 11.5 3 3 6-6" /></>,
};

export function Icon({ type }: { type: keyof TweetMetrics | 'verified' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[type]}</svg>;
}
