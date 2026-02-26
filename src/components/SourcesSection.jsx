import { useState } from 'react';
import { CITATIONS } from '../utils/citations.js';
import './SourcesSection.css';

export default function SourcesSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sources-section">
      {/* Medical disclaimer */}
      <div className="sources-disclaimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
        <span>
          Irada is not a medical device. All calculations are estimates for general guidance only and do not constitute medical advice. Consult a healthcare professional before making dietary changes.
        </span>
      </div>

      {/* Collapsible sources list */}
      <button className="sources-toggle" onClick={() => setOpen(!open)}>
        <div className="sources-toggle-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="sources-toggle-title">Science & Sources</span>
          <span className="sources-toggle-count">{CITATIONS.length}</span>
        </div>
        <svg
          className={`sources-chevron ${open ? 'sources-chevron--open' : ''}`}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {open && (
        <div className="sources-list">
          {CITATIONS.map((c) => (
            <div key={c.id} className="sources-item">
              <span className="sources-item-num">[{c.id}]</span>
              <div className="sources-item-body">
                <span className="sources-item-label">{c.label}</span>
                <span className="sources-item-ref">{c.reference}</span>
                <a
                  className="sources-item-link"
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {c.url}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
