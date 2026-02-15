import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { getInsights } from '../utils/insights.js';
import './InsightCard.css';

export default function InsightCard() {
  const { state } = useApp();
  const { entries, targets } = state;
  const [open, setOpen] = useState(false);

  const insights = useMemo(() => getInsights(entries, targets), [entries, targets]);

  if (insights.length === 0) {
    return (
      <div className="insight-card insight-card--empty">
        <svg className="insight-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
        <span>Log more days to unlock insights.</span>
      </div>
    );
  }

  return (
    <div className={`insight-card ${open ? 'insight-card--open' : ''}`}>
      <button className="insight-toggle" onClick={() => setOpen(!open)}>
        <div className="insight-toggle-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4" /><path d="m6.34 6.34 2.83 2.83" /><path d="M2 12h4" />
            <path d="m17.66 6.34-2.83 2.83" /><path d="M18 12h4" />
            <path d="M12 18a6 6 0 0 0 0-12" />
          </svg>
          <span className="insight-title">Weekly Insights</span>
          <span className="insight-badge">{insights.length}</span>
        </div>
        <svg className={`insight-chevron ${open ? 'insight-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="insight-list">
          {insights.map((text, i) => (
            <li key={i} className="insight-item">{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
