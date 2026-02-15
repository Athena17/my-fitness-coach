import { useApp } from '../context/useApp.js';
import './FoodEntryCard.css';

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
        <button className="food-entry-btn" onClick={handleEdit} title="Edit">✏️</button>
        <button className="food-entry-btn" onClick={() => onDelete(entry.id)} title="Delete">🗑️</button>
      </div>
    </div>
  );
}
