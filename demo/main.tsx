import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReplyOpportunityGrid } from '../src';
import { DEMO_NOW, demoTweets } from '../fixtures';
import '../src/styles.css';
import './styles.css';

function App() {
  const [liveClock, setLiveClock] = useState(false);
  const [clock, setClock] = useState(DEMO_NOW);
  const [previewLines, setPreviewLines] = useState(12);
  return <>
    <header className="topbar">
      <a className="brand" href="./"><span className="brand-mark" aria-hidden="true">▦</span> Reply dashboard <span className="version">REACT</span></a>
      <span className="session-info"><span className="status-dot" /> Local fixture demo</span>
    </header>
    <main>
      <div className="demo-controls">
        <div className="tier-legend" aria-label="Opportunity tiers"><span className="tier best">Best ≥70</span><span className="tier good">Good ≥50</span><span className="tier average">Average &lt;50</span></div>
        <div className="settings">
          <label>Preview <select value={previewLines} onChange={event => setPreviewLines(Number(event.target.value))}><option value={6}>6 lines</option><option value={12}>12 lines</option><option value={18}>18 lines</option></select></label>
          <label className="clock-toggle"><input type="checkbox" checked={liveClock} onChange={event => { setLiveClock(event.target.checked); setClock(event.target.checked ? Date.now() : DEMO_NOW); }} /> Use current time</label>
        </div>
      </div>
      <p className="clock-note">{liveClock ? 'Scored at the time you enabled this option; toggle to refresh.' : 'Demo clock: Sep 8, 2026 · 18:00 UTC. Fixed so fictional examples retain their original scores.'}</p>
      <div className="feed-toolbar">
        <span className="feed-label">For you <span className="count">{demoTweets.length}</span></span>
        <span className="source-legend"><span>Feed <b>24</b></span><span>Candidates <b>12</b></span></span>
      </div>
      <ReplyOpportunityGrid tweets={demoTweets} scoreOptions={{ now: clock }} previewLines={previewLines} />
      <footer className="page-footer"><span>36 fictional posts · Read-only · Visits saved in this browser</span><span>@rickgorman/x-reply-opportunity-grid</span></footer>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
