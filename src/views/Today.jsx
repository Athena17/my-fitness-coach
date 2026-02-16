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
import ExercisePanel from '../components/ExercisePanel.jsx';
import WaterPanel from '../components/WaterPanel.jsx';
import MealBuilder from '../components/MealBuilder.jsx';
import QuickAddRow from '../components/QuickAddRow.jsx';
import ScrollStrip from '../components/ScrollStrip.jsx';
import './Today.css';

const MEAL_CONFIG = [
  { key: 'Breakfast', label: 'Breakfast' },
  { key: 'Lunch', label: 'Lunch' },
  { key: 'Dinner', label: 'Dinner' },
  { key: 'Snack', label: 'Snacks' },
];

export default function Today() {
  const { state, dispatch } = useApp();
  const { todayEntries, caloriesBurned } = useDailyEntries();
  const [activeTab, setActiveTab] = useState('food');
  const [customMealPrefill, setCustomMealPrefill] = useState(null);
  const [quickAddPending, setQuickAddPending] = useState(null);

  // Custom add flow
  const [customStep, setCustomStep] = useState(null);
  const [customDraft, setCustomDraft] = useState(null);
  const [customMealSlot, setCustomMealSlot] = useState(null);

  // --- Editing handlers ---

  function handleFoodLogDone() {
    setCustomMealPrefill(null);
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  function handleCustomMealSelect(food) {
    setCustomMealPrefill({ name: food.name, kcal: food.serving.kcal, protein: food.serving.protein, ingredients: food.ingredients });
  }

  function handleMealBuilderUpdate(built) {
    dispatch({ type: 'UPDATE_ENTRY', payload: { ...state.editingEntry, name: built.name, kcal: built.totalKcal, protein: built.totalProtein, ingredients: built.ingredients } });
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  function handleMealBuilderEditCancel() {
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  // --- Delete handler ---

  function handleDeleteEntry(entry) {
    dispatch({ type: 'DELETE_ENTRY', payload: entry.id });
    if (entry.fromLeftoverId) {
      const existing = state.leftovers.find((l) => l.id === entry.fromLeftoverId);
      if (existing) {
        dispatch({ type: 'UPDATE_LEFTOVER', payload: { ...existing, remainingServings: existing.remainingServings + 1 } });
      } else {
        dispatch({ type: 'ADD_LEFTOVER', payload: { id: entry.fromLeftoverId, recipeId: entry.recipeId, name: entry.name, perServing: { kcal: entry.kcal, protein: entry.protein }, remainingServings: 1, totalServings: 1, dateCooked: entry.dateKey, timestamp: Date.now() } });
      }
    }
  }

  // --- Quick add handler ---

  function handleQuickAddSlot(slot, pending, ts) {
    if (pending.type === 'leftover') {
      const lo = pending.leftover;
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          id: generateId(), name: lo.name, kcal: Math.round(lo.perServing.kcal),
          protein: Math.round(lo.perServing.protein * 10) / 10, meal: slot,
          servingSize: 1, servingUnit: 'serving', timestamp: ts,
          dateKey: getToday(), recipeId: lo.recipeId, fromLeftoverId: lo.id,
        },
      });
      const newRemaining = lo.remainingServings - 1;
      if (newRemaining <= 0) {
        dispatch({ type: 'DELETE_LEFTOVER', payload: lo.id });
      } else {
        dispatch({ type: 'UPDATE_LEFTOVER', payload: { ...lo, remainingServings: newRemaining } });
      }
    } else {
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          id: generateId(), name: pending.name, kcal: pending.kcal, protein: pending.protein,
          meal: slot, servingSize: 1, servingUnit: 'serving', timestamp: ts,
          dateKey: getToday(), ...(pending.ingredients ? { ingredients: pending.ingredients } : {}),
        },
      });
    }
    setQuickAddPending(null);
  }

  // --- Custom add flow ---

  function getDefaultMeal() {
    const h = new Date().getHours();
    if (h < 11) return 'Breakfast';
    if (h < 15) return 'Lunch';
    if (h < 20) return 'Dinner';
    return 'Snack';
  }

  const mealLabel = MEAL_CONFIG.find((m) => m.key === customMealSlot)?.label || customMealSlot;

  function handleDescribeDone(parsed) {
    setCustomDraft({
      name: parsed.name, kcal: parsed.kcal, protein: parsed.protein,
      servingsYield: 1, servingsConsumed: 1,
    });
    setCustomStep('confirm');
  }

  function handleBuildDone(built) {
    setCustomDraft({
      name: built.name, kcal: built.totalKcal, protein: built.totalProtein,
      ingredients: built.ingredients,
      servingsYield: 1, servingsConsumed: 1,
    });
    setCustomStep('confirm');
  }

  function handleConfirmSave() {
    if (!customDraft || !customMealSlot) return;
    const { name, kcal, protein, ingredients, servingsYield, servingsConsumed } = customDraft;
    const yieldN = Math.max(1, servingsYield);
    const consumed = Math.min(Math.max(0, servingsConsumed), yieldN);
    const perServing = { kcal: Math.round(kcal / yieldN), protein: Math.round(protein / yieldN * 10) / 10 };

    if (consumed > 0) {
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          id: generateId(), name,
          kcal: Math.round(perServing.kcal * consumed),
          protein: Math.round(perServing.protein * consumed * 10) / 10,
          meal: customMealSlot, servingSize: consumed, servingUnit: 'serving',
          timestamp: Date.now(), dateKey: getToday(),
          ...(ingredients ? { ingredients } : {}),
        },
      });
    }

    const remaining = yieldN - consumed;
    if (remaining > 0) {
      dispatch({
        type: 'ADD_LEFTOVER',
        payload: {
          id: generateId(), name, perServing,
          remainingServings: remaining, totalServings: yieldN,
          dateCooked: getToday(), timestamp: Date.now(),
        },
      });
    }

    setCustomStep(null);
    setCustomDraft(null);
    setCustomMealSlot(null);
  }

  function handleCustomClose() {
    setCustomStep(null);
    setCustomDraft(null);
    setCustomMealSlot(null);
  }

  // --- Full-view takeovers ---

  const isEditing = !!state.editingEntry;
  const isEditingBuiltMeal = isEditing && state.editingEntry.ingredients;

  if (isEditingBuiltMeal) {
    return (<div className="today"><MealBuilder meal={state.editingEntry.meal} editingEntry={state.editingEntry} onSave={handleMealBuilderUpdate} onCancel={handleMealBuilderEditCancel} /></div>);
  }

  if (customMealPrefill) {
    const prefillSlot = state.editingEntry?.meal || 'Snack';
    return (
      <div className="today">
        <MealBuilder
          meal={prefillSlot}
          editingEntry={customMealPrefill}
          onSave={(built) => {
            dispatch({ type: 'ADD_ENTRY', payload: { id: generateId(), name: built.name, kcal: built.totalKcal, protein: built.totalProtein, ingredients: built.ingredients, meal: prefillSlot, servingSize: 1, servingUnit: 'g', timestamp: Date.now(), dateKey: getToday() } });
            setCustomMealPrefill(null);
          }}
          onCancel={() => setCustomMealPrefill(null)}
        />
      </div>
    );
  }

  if (isEditing) {
    return (<div className="today"><FoodLog defaultMeal={state.editingEntry.meal} onDone={handleFoodLogDone} onCustomMealSelect={handleCustomMealSelect} /></div>);
  }

  if (customStep) {
    return (
      <div className="today">
        {customStep === 'choose' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={handleCustomClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="add-mode-title">Add to {mealLabel}</span>
            </div>
            <div className="add-method-row">
              <button className="add-method-btn" onClick={() => setCustomStep('describe')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="add-method-label">Describe</span>
                <span className="add-method-hint">Tell us what you ate</span>
              </button>
              <button className="add-method-btn" onClick={() => setCustomStep('build')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                <span className="add-method-label">Build</span>
                <span className="add-method-hint">Select ingredients</span>
              </button>
            </div>
          </div>
        )}

        {customStep === 'describe' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={() => setCustomStep('choose')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="add-mode-title">Describe — {mealLabel}</span>
            </div>
            <NaturalInput onAdd={handleDescribeDone} onEdit={handleDescribeDone} />
          </div>
        )}

        {customStep === 'build' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={() => setCustomStep('choose')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="add-mode-title">Build — {mealLabel}</span>
            </div>
            <MealBuilder meal={customMealSlot} onSave={handleBuildDone} onCancel={() => setCustomStep('choose')} submitLabel="Next" />
          </div>
        )}

        {customStep === 'confirm' && customDraft && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={() => setCustomStep('choose')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="add-mode-title">Add to {mealLabel}</span>
            </div>

            <div className="confirm-summary">
              <span className="confirm-name">{customDraft.name}</span>
              <span className="confirm-macros">{Math.round(customDraft.kcal)} cal · {Math.round(customDraft.protein)}g protein</span>
            </div>

            <div className="confirm-field">
              <label className="confirm-label">How many servings does this make?</label>
              <input
                type="number"
                inputMode="numeric"
                className="confirm-input"
                min="1"
                value={customDraft.servingsYield}
                onChange={(e) => setCustomDraft((d) => {
                  const newYield = Math.max(1, Number(e.target.value) || 1);
                  return { ...d, servingsYield: newYield, servingsConsumed: Math.min(d.servingsConsumed, newYield) };
                })}
              />
            </div>

            <div className="confirm-field">
              <label className="confirm-label">How many did you eat?</label>
              <input
                type="number"
                inputMode="numeric"
                className="confirm-input"
                min="0"
                max={customDraft.servingsYield}
                value={customDraft.servingsConsumed}
                onChange={(e) => setCustomDraft((d) => ({ ...d, servingsConsumed: Math.min(Math.max(0, Number(e.target.value) || 0), d.servingsYield) }))}
              />
            </div>

            {customDraft.servingsYield > 1 && (
              <div className="confirm-hint">
                {Math.round(customDraft.kcal / customDraft.servingsYield)} cal per serving
                {customDraft.servingsYield - customDraft.servingsConsumed > 0 && (
                  <> · {customDraft.servingsYield - customDraft.servingsConsumed} serving{customDraft.servingsYield - customDraft.servingsConsumed !== 1 ? 's' : ''} → kitchen</>
                )}
              </div>
            )}

            <button className="btn-primary btn-submit" onClick={handleConfirmSave}>
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Main daily log ---

  return (
    <div className="today">
      {/* Tabs */}
      <div className="today-tabs">
        <button className={`today-tab ${activeTab === 'food' ? 'today-tab--active' : ''}`} onClick={() => setActiveTab('food')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
          Food
        </button>
        <button className={`today-tab ${activeTab === 'water' ? 'today-tab--active' : ''}`} onClick={() => setActiveTab('water')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
          </svg>
          Water
        </button>
        <button className={`today-tab ${activeTab === 'exercise' ? 'today-tab--active' : ''}`} onClick={() => setActiveTab('exercise')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M12 6.5v11"/><rect x="2" y="4" width="4" height="16" rx="1"/><rect x="18" y="4" width="4" height="16" rx="1"/>
          </svg>
          Exercise
          {caloriesBurned > 0 && <span className="today-tab-burned">-{caloriesBurned}</span>}
        </button>
      </div>

      {/* Food tab */}
      {activeTab === 'food' && (() => {
        const activeMealKey = getDefaultMeal();
        const dailyTotals = sumNutrition(todayEntries);
        const calTarget = state.targets?.calories || 2000;
        const protTarget = state.targets?.protein || 120;

        return (
          <>
            {/* Daily summary */}
            <div className="daily-summary">
              <span className="daily-summary-item"><span className="daily-summary-value">{Math.round(dailyTotals.kcal)}</span> / {calTarget} cal</span>
              <span className="daily-summary-sep" />
              <span className="daily-summary-item"><span className="daily-summary-value">{Math.round(dailyTotals.protein)}</span> / {protTarget}g protein</span>
            </div>

            <QuickAddRow onSelect={setQuickAddPending} />

            {/* Meals */}
            <div className="meals-section">
              {MEAL_CONFIG.map(({ key: meal, label }) => {
                const entries = todayEntries.filter((e) => e.meal === meal);
                const totals = sumNutrition(entries);
                const isActive = meal === activeMealKey;
                const isFilled = entries.length > 0;
                const isCollapsed = !isFilled && !isActive;

                const classes = [
                  'meal-row',
                  isFilled && 'meal-row--filled',
                  isActive && 'meal-row--active',
                  isCollapsed && 'meal-row--collapsed',
                ].filter(Boolean).join(' ');

                return (
                  <div key={meal} className={classes}>
                    <div className="meal-row-header">
                      <span className="meal-label">{label}</span>
                      {isFilled && (
                        <span className="meal-totals-compact">{Math.round(totals.kcal)} cal · {Math.round(totals.protein)}g</span>
                      )}
                      <button className="meal-add-btn" onClick={() => { setCustomMealSlot(meal); setCustomStep('choose'); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                    {isFilled && (
                      <ScrollStrip className="meal-entries-scroll">
                        {entries.map((entry) => (
                          <FoodEntryCard key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
                        ))}
                      </ScrollStrip>
                    )}
                    {!isFilled && isActive && (
                      <p className="meal-empty-prompt">What did you have for {label.toLowerCase()}?</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* Water tab */}
      {activeTab === 'water' && <WaterPanel />}

      {/* Exercise tab */}
      {activeTab === 'exercise' && <ExercisePanel />}

      {quickAddPending && (
        <Modal title="Choose meal slot" onClose={() => setQuickAddPending(null)}>
          <div className="slot-picker">
            {MEAL_CONFIG.map(({ key, label }) => (
              <button key={key} className="slot-picker-btn" onClick={() => handleQuickAddSlot(key, quickAddPending, Date.now())}>{label}</button>
            ))}
          </div>
        </Modal>
      )}

    </div>
  );
}
