import { useState } from 'react';
import MealBuilder from './MealBuilder.jsx';
import './CookFlow.css';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function CookFlow({ onComplete, onCancel }) {
  const [phase, setPhase] = useState('build'); // 'build' | 'finish'
  const [builtData, setBuiltData] = useState(null);
  const [servingsYield, setServingsYield] = useState('');
  const [servingsEaten, setServingsEaten] = useState('1');
  const [saveLeftovers, setSaveLeftovers] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState('Lunch');

  function handleBuildDone(data) {
    setBuiltData(data);
    setPhase('finish');
  }

  function handleFinish() {
    const yieldNum = Number(servingsYield);
    const eatenNum = Number(servingsEaten);
    if (!yieldNum || yieldNum < 1) return;

    const perServing = {
      kcal: Math.round(builtData.totalKcal / yieldNum),
      protein: Math.round(builtData.totalProtein / yieldNum * 10) / 10,
    };

    const recipe = {
      name: builtData.name,
      ingredients: builtData.ingredients,
      totalKcal: builtData.totalKcal,
      totalProtein: builtData.totalProtein,
      servingsYield: yieldNum,
      perServing,
    };

    const remaining = yieldNum - eatenNum;

    onComplete({
      recipe,
      servingsEaten: eatenNum,
      saveLeftovers: saveLeftovers && remaining > 0,
      remainingServings: remaining,
      perServing,
      meal: selectedMeal,
    });
  }

  if (phase === 'build') {
    return (
      <MealBuilder
        meal="Cook"
        onSave={handleBuildDone}
        onCancel={onCancel}
        submitLabel="Next: Finish Cooking"
        skipCustomMealSave
      />
    );
  }

  const yieldNum = Number(servingsYield) || 0;
  const eatenNum = Number(servingsEaten) || 0;
  const remaining = Math.max(0, yieldNum - eatenNum);
  const perServing = yieldNum > 0
    ? {
        kcal: Math.round(builtData.totalKcal / yieldNum),
        protein: Math.round(builtData.totalProtein / yieldNum * 10) / 10,
      }
    : { kcal: 0, protein: 0 };

  return (
    <div className="cf">
      <div className="cf-summary">
        <span className="cf-name">{builtData.name}</span>
        <span className="cf-total">{builtData.totalKcal} cal · {builtData.totalProtein}g protein total</span>
      </div>

      <div className="cf-field">
        <label className="cf-label" htmlFor="cf-yield">How many servings did you make?</label>
        <input
          id="cf-yield"
          type="number"
          inputMode="numeric"
          className="cf-input"
          value={servingsYield}
          onChange={(e) => setServingsYield(e.target.value)}
          placeholder="e.g. 4"
          min="1"
        />
      </div>

      <div className="cf-field">
        <label className="cf-label" htmlFor="cf-eaten">How many servings did you eat now?</label>
        <input
          id="cf-eaten"
          type="number"
          inputMode="decimal"
          className="cf-input"
          value={servingsEaten}
          onChange={(e) => setServingsEaten(e.target.value)}
          placeholder="e.g. 1"
          min="0"
          step="0.5"
        />
      </div>

      {eatenNum > 0 && (
        <div className="cf-field">
          <label className="cf-label">Log under which meal?</label>
          <div className="cf-meal-picker">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                className={`cf-meal-chip ${selectedMeal === m ? 'cf-meal-chip--active' : ''}`}
                onClick={() => setSelectedMeal(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {yieldNum > 0 && (
        <div className="cf-per-serving">
          <span className="cf-per-serving-label">Per serving</span>
          <span className="cf-per-serving-value">{perServing.kcal} cal · {perServing.protein}g protein</span>
        </div>
      )}

      {remaining > 0 && (
        <label className="cf-leftover-toggle">
          <input
            type="checkbox"
            checked={saveLeftovers}
            onChange={(e) => setSaveLeftovers(e.target.checked)}
          />
          <span className="cf-leftover-text">
            Save {remaining} leftover serving{remaining !== 1 ? 's' : ''} for later
          </span>
        </label>
      )}

      <button
        type="button"
        className="btn-primary btn-submit"
        disabled={!yieldNum || yieldNum < 1}
        onClick={handleFinish}
      >
        Finish Cooking
      </button>

      <button
        type="button"
        className="cf-back-btn"
        onClick={() => setPhase('build')}
      >
        Back to ingredients
      </button>
    </div>
  );
}
