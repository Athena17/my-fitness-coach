import { useRef, useEffect, useState, useCallback } from 'react';
import './ScrollStrip.css';

export default function ScrollStrip({ children, className }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  function nudge(dir) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * 140, behavior: 'smooth' });
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ensure rest position is flush-left, then check edges after layout
    el.scrollLeft = 0;
    requestAnimationFrame(updateEdges);

    el.addEventListener('scroll', updateEdges, { passive: true });

    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);

    // Convert vertical wheel → horizontal scroll
    function onWheel(e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }

    // Drag-to-scroll for mouse/trackpad (skip touch — native swipe is fine)
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    function onMouseDown(e) {
      // Only primary button
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    }

    function onMouseMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      if (moved) el.scrollLeft = startScroll - dx;
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      if (!dragging) return;
      dragging = false;
      if (moved) {
        // Suppress the click that follows a real drag
        el.addEventListener('click', suppress, { capture: true, once: true });
      }
    }

    function suppress(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);

    return () => {
      el.removeEventListener('scroll', updateEdges);
      ro.disconnect();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateEdges]);

  return (
    <div className="ss-wrap">
      {canLeft && (
        <button className="ss-arrow ss-arrow--left" onClick={() => nudge(-1)} aria-label="Scroll left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}
      <div ref={ref} className={className}>{children}</div>
      {canRight && (
        <button className="ss-arrow ss-arrow--right" onClick={() => nudge(1)} aria-label="Scroll right">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      )}
    </div>
  );
}
