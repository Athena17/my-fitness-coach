import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import FoodSearch from '../components/FoodSearch.jsx';
import './FoodLog.css';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function FoodLog({ prefill, onDone }) {
  const { state, dispatch } = useApp();
  const editing = state.editingEntry;
  const isEditing = !!editing;

  const initial = editing || prefill;

  const [name, setName] = useState(initial?.name ?? '');
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '');
  const [protein, setProtein] = useState(initial ? String(initial.protein) : '');
  const [meal, setMeal] = useState(initial?.meal ?? 'Breakfast');
  const [servingSize, setServingSize] = useState(initial ? String(initial.servingSize) : '');
  const [servingUnit, setServingUnit] = useState(initial?.servingUnit ?? 'g');
  const [servingLabel, setServingLabel] = useState(initial?.servingLabel ?? '');
  const [errors, setErrors] = useState({});

  function handleFoodSelect(food) {
    setName(food.name);
    setKcal(String(food.serving.kcal));
    setProtein(String(food.serving.protein));
    setServingSize(String(food.serving.size));
    setServingUnit(food.serving.unit);
    setServingLabel(food.serving.label);
  }

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    const k = Number(kcal);
    if (isNaN(k) || k < 0) e.kcal = 'Enter valid calories';
    const p = Number(protein);
    if (isNaN(p) || p < 0) e.protein = 'Enter valid protein';
    if (!servingSize || Number(servingSize) <= 0) e.servingSize = 'Enter valid serving size';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const entry = {
      id: isEditing ? state.editingEntry.id : generateId(),
      name: name.trim(),
      kcal: Number(kcal),
      protein: Number(protein),
      carbs: null,
      fat: null,
      meal,
      servingSize: Number(servingSize),
      servingUnit,
      servingLabel,
      timestamp: isEditing ? state.editingEntry.timestamp : Date.now(),
      dateKey: isEditing ? state.editingEntry.dateKey : getToday(),
    };

    dispatch({
      type: isEditing ? 'UPDATE_ENTRY' : 'ADD_ENTRY',
      payload: entry,
    });
    onDone();
  }

  function handleCancel() {
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
    onDone();
  }

  return (
    <div className="food-log">
      <div className="food-log-header">
        <h1>{isEditing ? 'Edit Entry' : 'Add Food'}</h1>
        <button className="food-log-cancel" onClick={handleCancel}>Cancel</button>
      </div>

      {!isEditing && (
        <div className="food-log-search">
          <FoodSearch onSelect={handleFoodSelect} />
          <p className="food-log-hint">Search the database or enter manually below.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="food-log-form">
        <div className="form-group">
          <label htmlFor="food-name">Food Name</label>
          <input
            id="food-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken Breast"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="food-kcal">Calories (kcal)</label>
            <input
              id="food-kcal"
              type="number"
              inputMode="decimal"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              placeholder="0"
            />
            {errors.kcal && <span className="form-error">{errors.kcal}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="food-protein">Protein (g)</label>
            <input
              id="food-protein"
              type="number"
              inputMode="decimal"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
            />
            {errors.protein && <span className="form-error">{errors.protein}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="food-serving">Serving Size</label>
            <input
              id="food-serving"
              type="number"
              inputMode="decimal"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              placeholder="100"
            />
            {errors.servingSize && <span className="form-error">{errors.servingSize}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="food-unit">Unit</label>
            <select
              id="food-unit"
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="oz">oz</option>
              <option value="cup">cup</option>
              <option value="piece">piece</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="food-label">Serving Label (optional)</label>
          <input
            id="food-label"
            type="text"
            value={servingLabel}
            onChange={(e) => setServingLabel(e.target.value)}
            placeholder="e.g. 1 breast, 1 cup"
          />
        </div>

        <div className="form-group">
          <label>Meal</label>
          <div className="meal-selector">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                className={`meal-chip ${meal === m ? 'active' : ''}`}
                onClick={() => setMeal(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary btn-submit">
          {isEditing ? 'Update Entry' : 'Add Entry'}
        </button>
      </form>
    </div>
  );
}
