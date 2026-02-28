import { useState, useEffect } from 'react';
import './FloatingActionButton.css';

const HINT_KEY = 'nt_fab_hint_dismissed';

export default function FloatingActionButton({ onFindMeal, onCookMeal, onQuickLog }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => !localStorage.getItem(HINT_KEY));

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem(HINT_KEY, '1');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  function handle(action) {
    setOpen(false);
    if (showHint) {
      setShowHint(false);
      localStorage.setItem(HINT_KEY, '1');
    }
    action();
  }

  function handleFabClick() {
    if (showHint) {
      setShowHint(false);
      localStorage.setItem(HINT_KEY, '1');
    }
    setOpen(!open);
  }

  return (
    <>
      {open && <div className="fab-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div className="fab-sheet">
          <button className="fab-sheet-item" onClick={() => handle(onFindMeal)}>
            <div className="fab-sheet-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div className="fab-sheet-text">
              <span className="fab-sheet-title">Find a meal</span>
              <span className="fab-sheet-desc">Search saved &amp; database</span>
            </div>
          </button>
          <button className="fab-sheet-item" onClick={() => handle(onCookMeal)}>
            <div className="fab-sheet-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C9 2 4 3.5 4 8c0 3 2 5 2 5h12s2-2 2-5c0-4.5-5-6-8-6z"/>
                <path d="M6 13v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
              </svg>
            </div>
            <div className="fab-sheet-text">
              <span className="fab-sheet-title">Cook a meal</span>
              <span className="fab-sheet-desc">Build from ingredients</span>
            </div>
          </button>
          <button className="fab-sheet-item" onClick={() => handle(onQuickLog)}>
            <div className="fab-sheet-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="fab-sheet-text">
              <span className="fab-sheet-title">Quick log</span>
              <span className="fab-sheet-desc">Enter name &amp; macros</span>
            </div>
          </button>
        </div>
      )}

      {/* First-time hint tooltip */}
      {showHint && !open && (
        <div className="fab-hint">Tap + to log a meal</div>
      )}

      <button
        className={`fab ${open ? 'fab--open' : ''}${showHint && !open ? ' fab--pulse' : ''}`}
        onClick={handleFabClick}
        aria-label={open ? 'Close menu' : 'Add'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </>
  );
}
