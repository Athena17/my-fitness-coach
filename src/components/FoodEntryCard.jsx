import { useApp } from '../context/useApp.js';
import { getEmoji } from '../utils/foodEmoji.js';
import './FoodEntryCard.css';

export default function FoodEntryCard({ entry, onDelete }) {
  const { dispatch } = useApp();

  function handleEdit() {
    dispatch({ type: 'SET_EDITING_ENTRY', payload: entry });
  }

  return (
    <button className="fec-card" onClick={handleEdit}>
      <span
        className="fec-delete"
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(entry); } }}
      >
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
      </span>
      <span className="fec-emoji">{getEmoji(entry.name)}</span>
      <span className="fec-name">{entry.name}</span>
      <span className="fec-macros">{Math.round(entry.kcal)} cal · {Math.round(entry.protein)}g</span>
    </button>
  );
}
