import { useApp } from '../context/useApp.js';
import './FoodEntryCard.css';

function PenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export default function FoodEntryCard({ entry, onDelete }) {
  const { dispatch } = useApp();

  function handleEdit() {
    dispatch({ type: 'SET_EDITING_ENTRY', payload: entry });
  }

  return (
    <div className="food-entry-card">
      <div className="food-entry-info">
        <span className="food-entry-name">{entry.name}</span>
      </div>
      <div className="food-entry-nutrition">
        <span className="food-entry-kcal">{Math.round(entry.kcal)} kcal</span>
        <span className="food-entry-protein">{Math.round(entry.protein)}g</span>
      </div>
      <div className="food-entry-actions">
        <button className="food-entry-btn" onClick={handleEdit} title="Edit"><PenIcon /></button>
        <button className="food-entry-btn" onClick={() => onDelete(entry.id)} title="Delete"><TrashIcon /></button>
      </div>
    </div>
  );
}
