import { useState, useRef, useEffect } from 'react';
import { getCitation } from '../utils/citations.js';
import './CitationFootnote.css';

export default function CitationFootnote({ ids }) {
  const [openId, setOpenId] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!openId) return;
    function handleOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpenId(null);
      }
    }
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [openId]);

  const idList = Array.isArray(ids) ? ids : [ids];

  return (
    <span className="cf-wrap">
      {idList.map((id) => {
        const citation = getCitation(id);
        if (!citation) return null;
        return (
          <span key={id} className="cf-anchor">
            <button
              type="button"
              className="cf-sup"
              onClick={(e) => { e.stopPropagation(); setOpenId(openId === id ? null : id); }}
              aria-label={`Citation ${id}`}
            >
              [{id}]
            </button>
            {openId === id && (
              <span className="cf-popover" ref={popoverRef}>
                <span className="cf-popover-label">{citation.label}</span>
                <span className="cf-popover-ref">{citation.reference}</span>
                <a
                  className="cf-popover-link"
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source
                </a>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
