import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import NaturalInput from '../components/NaturalInput.jsx';
import FoodEntryCard from '../components/FoodEntryCard.jsx';
import Modal from '../components/Modal.jsx';
import FoodLog from './FoodLog.jsx';
import { sumNutrition } from '../utils/nutritionCalc.js';
import InsightCard from '../components/InsightCard.jsx';
import ExercisePanel from '../components/ExercisePanel.jsx';
import WaterPanel from '../components/WaterPanel.jsx';
import './Today.css';

const MEAL_CONFIG = [
  { key: 'Breakfast', label: 'Breakfast', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )},
  { key: 'Lunch', label: 'Lunch', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  )},
  { key: 'Dinner', label: 'Dinner', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )},
  { key: 'Snack', label: 'Snacks', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/>
    </svg>
  )},
];

export default function Today() {
  const { state, dispatch } = useApp();
  const { todayEntries, caloriesBurned } = useDailyEntries();
  const [activeTab, setActiveTab] = useState('food');
  const [addingMeal, setAddingMeal] = useState(null);
  const [naturalPrefill, setNaturalPrefill] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function handleNaturalAdd(parsed) {
    const entry = {
      id: generateId(),
      name: parsed.name,
      kcal: parsed.kcal,
      protein: parsed.protein,
      meal: addingMeal || 'Snack',
      servingSize: 1,
      servingUnit: 'g',
      timestamp: Date.now(),
      dateKey: getToday(),
    };
    dispatch({ type: 'ADD_ENTRY', payload: entry });
    setAddingMeal(null);
  }

  function handleNaturalEdit(parsed) {
    setNaturalPrefill({ ...parsed, meal: addingMeal || 'Snack' });
    setShowManualForm(true);
  }

  function handleFoodLogDone() {
    setShowManualForm(false);
    setAddingMeal(null);
    setNaturalPrefill(null);
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  function handleAddToMeal(meal) {
    setAddingMeal(addingMeal === meal ? null : meal);
    setNaturalPrefill(null);
    setShowManualForm(false);
  }

  function confirmDelete() {
    dispatch({ type: 'DELETE_ENTRY', payload: deleteId });
    setDeleteId(null);
  }

  const isEditing = !!state.editingEntry;

  if (showManualForm || isEditing) {
    return (
      <div className="today">
        <FoodLog
          prefill={naturalPrefill}
          defaultMeal={addingMeal}
          onDone={handleFoodLogDone}
        />
      </div>
    );
  }

  return (
    <div className="today">
      {/* Food / Exercise tabs */}
      <div className="today-tabs">
        <button
          className={`today-tab ${activeTab === 'food' ? 'today-tab--active' : ''}`}
          onClick={() => setActiveTab('food')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
          Food
        </button>
        <button
          className={`today-tab ${activeTab === 'water' ? 'today-tab--active' : ''}`}
          onClick={() => setActiveTab('water')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
          </svg>
          Water
        </button>
        <button
          className={`today-tab ${activeTab === 'exercise' ? 'today-tab--active' : ''}`}
          onClick={() => setActiveTab('exercise')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M12 6.5v11"/><rect x="2" y="4" width="4" height="16" rx="1"/><rect x="18" y="4" width="4" height="16" rx="1"/>
          </svg>
          Exercise
          {caloriesBurned > 0 && (
            <span className="today-tab-burned">-{caloriesBurned} cal</span>
          )}
        </button>
      </div>

      {activeTab === 'water' && <WaterPanel />}

      {activeTab === 'exercise' && <ExercisePanel />}

      {activeTab === 'food' && <>
        <InsightCard />
        <div className="meals-section">
        {MEAL_CONFIG.map(({ key: meal, label, icon }) => {
          const entries = todayEntries.filter((e) => e.meal === meal);
          const totals = sumNutrition(entries);
          const isAdding = addingMeal === meal;

          return (
            <div key={meal} className={`meal-row ${isAdding ? 'meal-row--active' : ''}`}>
              <div className="meal-row-left">
                <div className="meal-icon">{icon}</div>
                <div className="meal-info">
                  <span className="meal-label">{label}</span>
                  {entries.length > 0 && (
                    <span className="meal-totals">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-kcal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      {Math.round(totals.kcal)} cal
                      <span className="meal-totals-dot" />
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-protein)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 2 7 4.2 7 7c0 2 1.2 3.8 3 4.6V20a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2v-8.4c1.8-.8 3-2.6 3-4.6 0-2.8-2-5-5-5z"/></svg>
                      {Math.round(totals.protein)}g
                    </span>
                  )}
                </div>
              </div>

              <button
                className={`meal-add-btn ${isAdding ? 'meal-add-btn--close' : ''}`}
                onClick={() => handleAddToMeal(meal)}
                aria-label={isAdding ? 'Close' : `Add to ${meal}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {isAdding
                    ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                    : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                  }
                </svg>
              </button>

              {(entries.length > 0 || isAdding) && (
                <div className="meal-row-body">
                  {isAdding && (
                    <div className="meal-add-section">
                      <NaturalInput
                        onAdd={handleNaturalAdd}
                        onEdit={handleNaturalEdit}
                        onSearchDb={() => setShowManualForm(true)}
                      />
                    </div>
                  )}

                  {entries.length > 0 && (
                    <div className="meal-entries">
                      {entries.map((entry) => (
                        <FoodEntryCard
                          key={entry.id}
                          entry={entry}
                          onDelete={setDeleteId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>}

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
