import { useCallback, useEffect, useRef, useState } from 'react';

type Visits = Readonly<Record<string, string>>;
interface VisitState { key: string | null; visits: Visits; unavailable: boolean }
const VISIT_EVENT = 'x-reply-opportunity-grid:visited';

function readVisits(key: string | null): { visits: Visits; unavailable: boolean } {
  if (key === null) return { visits: {}, unavailable: false };
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid visited data');
    return {
      visits: Object.fromEntries(Object.entries(saved).filter(([, value]) =>
        typeof value === 'string' && Number.isFinite(Date.parse(value)),
      )),
      unavailable: false,
    };
  } catch {
    return { visits: {}, unavailable: true };
  }
}

export function useVisited(key: string | null) {
  // The initial render never touches browser APIs, including during SSR/hydration.
  const [state, setState] = useState<VisitState>({ key, visits: {}, unavailable: false });
  const current = useRef(state);
  const commit = useCallback((next: VisitState) => {
    current.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    const saved = readVisits(key);
    commit({ key, ...saved });
    const sync = () => {
      const next = readVisits(key);
      commit({ key, ...next, visits: next.unavailable ? current.current.visits : next.visits });
    };
    const onStorage = (event: StorageEvent) => {
      if (key !== null && (event.key === key || event.key === null)) sync();
    };
    const onLocalVisit = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; visits: Visits; unavailable: boolean }>).detail;
      if (key !== null && detail.key === key) commit({ key, visits: detail.visits, unavailable: detail.unavailable });
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(VISIT_EVENT, onLocalVisit);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(VISIT_EVENT, onLocalVisit);
    };
  }, [key, commit]);

  const markVisited = useCallback((id: string) => {
    const saved = readVisits(key);
    const inMemory = current.current.key === key ? current.current.visits : {};
    const visits = { ...saved.visits, ...inMemory, [id]: new Date().toISOString() };
    let unavailable = saved.unavailable;
    if (key !== null) {
      try {
        window.localStorage.setItem(key, JSON.stringify(visits));
        unavailable = false;
      } catch { unavailable = true; }
    }
    commit({ key, visits, unavailable });
    if (key !== null) window.dispatchEvent(new CustomEvent(VISIT_EVENT, { detail: { key, visits, unavailable } }));
  }, [key, commit]);

  return {
    visits: state.key === key ? state.visits : {},
    storageUnavailable: state.key === key && state.unavailable,
    markVisited,
  };
}
