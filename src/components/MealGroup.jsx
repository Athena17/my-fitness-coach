import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import FoodEntryCard from './FoodEntryCard.jsx';
import Modal from './Modal.jsx';
import { sumNutrition } from '../utils/nutritionCalc.js';
import './MealGroup.css';

export default function MealGroup({ meal, entries }) {
  const { dispatch } = useApp();
  const [deleteId, setDeleteId] = useState(null);
  const totals = sumNutrition(entries);

  function confirmDelete() {
    dispatch({ type: 'DELETE_ENTRY', payload: deleteId });
    setDeleteId(null);
  }

  return (
    <div className="meal-group">
      <div className="meal-group-header">
        <h3 className="meal-group-title">{meal}</h3>
        <span className="meal-group-totals">
          {Math.round(totals.kcal)} cal · {Math.round(totals.protein)}g protein
        </span>
      </div>
      <div className="meal-group-entries">
        {entries.map((entry) => (
          <FoodEntryCard key={entry.id} entry={entry} onDelete={setDeleteId} />
        ))}
      </div>

      {deleteId && (
        <Modal title="Delete Entry" onClose={() => setDeleteId(null)}>
          <p style={{ marginBottom: 16 }}>Are you sure you want to delete this entry?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              style={{ flex: 1, background: 'var(--color-danger)', padding: '10px' }}
              onClick={confirmDelete}
            >
              Delete
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }}
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
