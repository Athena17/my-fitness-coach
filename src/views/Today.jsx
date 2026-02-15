import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import ProgressBar from '../components/ProgressBar.jsx';
import MealGroup from '../components/MealGroup.jsx';
import NaturalInput from '../components/NaturalInput.jsx';
import FoodLog from './FoodLog.jsx';
import './Today.css';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Today() {
  const { state, dispatch } = useApp();
  const { todayEntries, todayTotals } = useDailyEntries();
  const { targets } = state;
  const [showAddFood, setShowAddFood] = useState(false);
  const [naturalPrefill, setNaturalPrefill] = useState(null);

  const groupedEntries = MEALS.map((meal) => ({
    meal,
    entries: todayEntries.filter((e) => e.meal === meal),
  })).filter((g) => g.entries.length > 0);

  function handleNaturalAdd(parsed) {
    const entry = {
      id: generateId(),
      name: parsed.name,
      kcal: parsed.kcal,
      protein: parsed.protein,
      meal: 'Snack',
      servingSize: parsed.servingSize,
      servingUnit: 'g',
      timestamp: Date.now(),
      dateKey: getToday(),
    };
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  }

  function handleNaturalEdit(parsed) {
    setNaturalPrefill(parsed);
    setShowAddFood(true);
  }

  function handleFoodLogDone() {
    setShowAddFood(false);
    setNaturalPrefill(null);
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  // If editing an entry (triggered from MealGroup), show inline form
  const isEditing = !!state.editingEntry;

  if (showAddFood || isEditing) {
    return (
      <div className="today">
        <FoodLog
          prefill={naturalPrefill}
          onDone={handleFoodLogDone}
        />
      </div>
    );
  }

  return (
    <div className="today">
      <h1 className="today-title">Today</h1>

      <div className="progress-section">
        <ProgressBar
          label="Calories"
          current={todayTotals.kcal}
          target={targets.kcal}
          unit="kcal"
          colorVar="--color-kcal"
        />
        <ProgressBar
          label="Protein"
          current={todayTotals.protein}
          target={targets.protein}
          unit="g"
          colorVar="--color-protein"
        />
      </div>

      <div className="today-natural-section">
        <h2>Quick Add</h2>
        <NaturalInput onAdd={handleNaturalAdd} onEdit={handleNaturalEdit} />
      </div>

      <div className="meals-section">
        <div className="section-header">
          <h2>Meals</h2>
          <button
            className="btn-add-meal"
            onClick={() => setShowAddFood(true)}
          >
            + Add Food
          </button>
        </div>

        {groupedEntries.length === 0 ? (
          <div className="empty-state">
            <p>No food logged today.</p>
            <button
              className="btn-primary"
              onClick={() => setShowAddFood(true)}
            >
              Log Your First Meal
            </button>
          </div>
        ) : (
          groupedEntries.map((group) => (
            <MealGroup key={group.meal} meal={group.meal} entries={group.entries} />
          ))
        )}
      </div>
    </div>
  );
}
