import { useEffect, useRef, useState } from 'react';

export function useTextPreview(text: string, lines: number) {
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [preview, setPreview] = useState({ text, hiddenWords: 0 });

  useEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    let frame = 0;
    let disposed = false;
    let lastWidth = -1;
    const words = [...text.matchAll(/\S+/gu)];
    const update = () => {
      if (disposed) return;
      const width = measure.getBoundingClientRect().width;
      const maxHeight = Number.parseFloat(getComputedStyle(measure).lineHeight) * lines;
      measure.textContent = text;
      if (!width || !Number.isFinite(maxHeight) || measure.scrollHeight <= maxHeight + 1 || !words.length) {
        setPreview({ text, hiddenWords: 0 });
        return;
      }
      const prefix = (count: number) => {
        const word = words[count - 1];
        return word ? `${text.slice(0, word.index + word[0].length)}…` : '…';
      };
      let low = 0;
      let high = words.length - 1;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        measure.textContent = prefix(middle);
        if (measure.scrollHeight <= maxHeight + 1) low = middle;
        else high = middle - 1;
      }
      setPreview({ text: prefix(low), hiddenWords: words.length - low });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width === lastWidth) return;
      lastWidth = entry.contentRect.width;
      schedule();
    });
    observer?.observe(measure);
    window.addEventListener('resize', schedule);
    // Font swaps can change wrapping without changing the container's width.
    void document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    document.fonts?.addEventListener('loadingdone', schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', schedule);
    };
  }, [text, lines]);

  return { measureRef, ...preview };
}
