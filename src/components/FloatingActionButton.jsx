import { useState } from 'react';
import './FloatingActionButton.css';

export default function FloatingActionButton({ onLogMeal, onCookBatch, onLogWater, onLogExercise }) {
  const [open, setOpen] = useState(false);

  function handle(action) {
    setOpen(false);
    action();
  }

  return (
    <>
      {open && <div className="fab-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div className="fab-sheet">
          <button className="fab-sheet-item" onClick={() => handle(onLogMeal)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
            Log meal
          </button>
          <button className="fab-sheet-item" onClick={() => handle(onCookBatch)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C9 2 4 3.5 4 8c0 3 2 5 2 5h12s2-2 2-5c0-4.5-5-6-8-6z"/>
              <path d="M6 13v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
            </svg>
            Cook batch
          </button>
          <button className="fab-sheet-item" onClick={() => handle(onLogWater)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
            </svg>
            Log water
          </button>
          <button className="fab-sheet-item" onClick={() => handle(onLogExercise)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M12 6.5v11"/><rect x="2" y="4" width="4" height="16" rx="1"/><rect x="18" y="4" width="4" height="16" rx="1"/>
            </svg>
            Log exercise
          </button>
        </div>
      )}

      <button
        className={`fab ${open ? 'fab--open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Add'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </>
  );
}
