import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import NaturalInput from '../components/NaturalInput.jsx';
import FoodEntryCard from '../components/FoodEntryCard.jsx';
import Modal from '../components/Modal.jsx';
import FoodLog from './FoodLog.jsx';
import FoodSearch from '../components/FoodSearch.jsx';
import { sumNutrition } from '../utils/nutritionCalc.js';
import ExercisePanel from '../components/ExercisePanel.jsx';
import WaterPanel from '../components/WaterPanel.jsx';
import MealBuilder from '../components/MealBuilder.jsx';
import CookFlow from '../components/CookFlow.jsx';
import FloatingActionButton from '../components/FloatingActionButton.jsx';
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
  const [addingMeal, setAddingMeal] = useState(null);
  const [naturalPrefill, setNaturalPrefill] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [customMealPrefill, setCustomMealPrefill] = useState(null);
  const [addMode, setAddMode] = useState(null);
  const [showCookFlow, setShowCookFlow] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');

  // --- Handlers ---

  function handleInlineSearchSelect(food) {
    if (food.isLeftover) {
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          id: generateId(), name: food.name, kcal: food.serving.kcal, protein: food.serving.protein,
          meal: addingMeal || 'Snack', servingSize: 1, servingUnit: 'serving',
          timestamp: Date.now(), dateKey: getToday(), recipeId: food.recipeId, fromLeftoverId: food.leftoverId,
        },
      });
      const newRemaining = food.remainingServings - 1;
      if (newRemaining <= 0) {
        dispatch({ type: 'DELETE_LEFTOVER', payload: food.leftoverId });
      } else {
        const leftover = state.leftovers.find((l) => l.id === food.leftoverId);
        if (leftover) dispatch({ type: 'UPDATE_LEFTOVER', payload: { ...leftover, remainingServings: newRemaining } });
      }
      setAddingMeal(null);
      return;
    }
    if (food.isRecipe) {
      setNaturalPrefill({ name: food.name, kcal: food.serving.kcal, protein: food.serving.protein, meal: addingMeal || 'Snack', recipeId: food.recipeId });
      setShowManualForm(true);
      return;
    }
    if (food.isCustomMeal && food.ingredients) {
      setCustomMealPrefill({ name: food.name, kcal: food.serving.kcal, protein: food.serving.protein, ingredients: food.ingredients });
      return;
    }
    setNaturalPrefill({ name: food.name, kcal: food.serving.kcal, protein: food.serving.protein, meal: addingMeal || 'Snack' });
    setShowManualForm(true);
  }

  function handleNaturalAdd(parsed) {
    dispatch({ type: 'ADD_ENTRY', payload: { id: generateId(), name: parsed.name, kcal: parsed.kcal, protein: parsed.protein, meal: addingMeal || 'Snack', servingSize: 1, servingUnit: 'g', timestamp: Date.now(), dateKey: getToday() } });
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
    setCustomMealPrefill(null);
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  function handleCustomMealSelect(food) {
    setShowManualForm(false);
    setCustomMealPrefill({ name: food.name, kcal: food.serving.kcal, protein: food.serving.protein, ingredients: food.ingredients });
  }

  function handleManualSubmit() {
    const k = Number(manualKcal), p = Number(manualProtein);
    if (!manualName.trim() || isNaN(k) || isNaN(p)) return;
    dispatch({ type: 'ADD_ENTRY', payload: { id: generateId(), name: manualName.trim(), kcal: k, protein: p, meal: addingMeal || 'Snack', servingSize: 1, servingUnit: 'g', timestamp: Date.now(), dateKey: getToday() } });
    setManualName(''); setManualKcal(''); setManualProtein('');
    setAddMode(null); setAddingMeal(null);
  }

  function handleBackToSearch() {
    setAddMode(null); setManualName(''); setManualKcal(''); setManualProtein('');
  }

  function handleCloseAddMeal() {
    setAddingMeal(null); setAddMode(null); setManualName(''); setManualKcal(''); setManualProtein('');
  }

  function handleMealBuilderSave(built) {
    dispatch({ type: 'ADD_ENTRY', payload: { id: generateId(), name: built.name, kcal: built.totalKcal, protein: built.totalProtein, ingredients: built.ingredients, meal: addingMeal || 'Snack', servingSize: 1, servingUnit: 'g', timestamp: Date.now(), dateKey: getToday() } });
    setAddMode(null); setAddingMeal(null);
  }

  function handleCookComplete(result) {
    const { recipe, servingsEaten, saveLeftovers: doSaveLeftovers, remainingServings, perServing, meal } = result;
    const recipeId = generateId();
    const existingRecipe = state.recipes.find((r) => r.name.toLowerCase() === recipe.name.toLowerCase());
    if (existingRecipe) {
      dispatch({ type: 'UPDATE_RECIPE', payload: { ...existingRecipe, ...recipe, id: existingRecipe.id, updatedAt: Date.now() } });
    } else {
      dispatch({ type: 'ADD_RECIPE', payload: { ...recipe, id: recipeId, createdAt: Date.now(), updatedAt: Date.now() } });
    }
    const usedRecipeId = existingRecipe ? existingRecipe.id : recipeId;
    if (servingsEaten > 0) {
      dispatch({ type: 'ADD_ENTRY', payload: { id: generateId(), name: recipe.name, kcal: Math.round(perServing.kcal * servingsEaten), protein: Math.round(perServing.protein * servingsEaten * 10) / 10, meal: meal || 'Snack', servingSize: servingsEaten, servingUnit: 'serving', timestamp: Date.now(), dateKey: getToday(), recipeId: usedRecipeId } });
    }
    if (doSaveLeftovers && remainingServings > 0) {
      dispatch({ type: 'ADD_LEFTOVER', payload: { id: generateId(), recipeId: usedRecipeId, name: recipe.name, perServing, remainingServings, totalServings: recipe.servingsYield, dateCooked: getToday(), timestamp: Date.now() } });
    }
    setShowCookFlow(false);
  }

  function getDefaultMeal() {
    const h = new Date().getHours();
    if (h < 11) return 'Breakfast';
    if (h < 15) return 'Lunch';
    if (h < 20) return 'Dinner';
    return 'Snack';
  }

  function confirmDelete() {
    dispatch({ type: 'DELETE_ENTRY', payload: deleteId });
    setDeleteId(null);
  }

  const isEditing = !!state.editingEntry;
  const isEditingBuiltMeal = isEditing && state.editingEntry.ingredients;

  function handleMealBuilderUpdate(built) {
    dispatch({ type: 'UPDATE_ENTRY', payload: { ...state.editingEntry, name: built.name, kcal: built.totalKcal, protein: built.totalProtein, ingredients: built.ingredients } });
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  function handleMealBuilderEditCancel() {
    dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
  }

  // --- Full-view takeovers ---

  if (isEditingBuiltMeal) {
    return (<div className="today"><MealBuilder meal={state.editingEntry.meal} editingEntry={state.editingEntry} onSave={handleMealBuilderUpdate} onCancel={handleMealBuilderEditCancel} /></div>);
  }

  if (customMealPrefill) {
    return (<div className="today"><MealBuilder meal={addingMeal || 'Snack'} editingEntry={customMealPrefill} onSave={(built) => { handleMealBuilderSave(built); setCustomMealPrefill(null); }} onCancel={() => setCustomMealPrefill(null)} /></div>);
  }

  if (showCookFlow) {
    return (
      <div className="today">
        <div className="add-mode-header">
          <button className="add-mode-back" onClick={() => setShowCookFlow(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="add-mode-title">Cook</span>
        </div>
        <CookFlow onComplete={handleCookComplete} onCancel={() => setShowCookFlow(false)} />
      </div>
    );
  }

  if (showManualForm || isEditing) {
    return (<div className="today"><FoodLog prefill={naturalPrefill} defaultMeal={addingMeal} onDone={handleFoodLogDone} onCustomMealSelect={handleCustomMealSelect} /></div>);
  }

  if (addingMeal) {
    return (
      <div className="today">
        <div className="add-mode-header">
          <button className="add-mode-back" onClick={handleCloseAddMeal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="add-mode-title">Log meal</span>
        </div>

        <div className="add-meal-picker">
          {MEAL_CONFIG.map(({ key, label }) => (
            <button key={key} className={`add-meal-chip ${addingMeal === key ? 'add-meal-chip--active' : ''}`} onClick={() => setAddingMeal(key)}>{label}</button>
          ))}
        </div>

        {!addMode && (
          <>
            <FoodSearch onSelect={handleInlineSearchSelect} />
            <div className="add-alt-row">
              <span className="add-alt-label">or</span>
              <button className="add-alt-btn" onClick={() => setAddMode('describe')}>Describe</button>
              <button className="add-alt-btn" onClick={() => setAddMode('manual')}>Enter Manually</button>
              <button className="add-alt-btn" onClick={() => setAddMode('build')}>Build Meal</button>
            </div>
          </>
        )}

        {addMode && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={handleBackToSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="add-mode-title">
                {addMode === 'describe' && 'Describe'}
                {addMode === 'manual' && 'Enter Manually'}
                {addMode === 'build' && 'Build Meal'}
              </span>
            </div>
            {addMode === 'describe' && <NaturalInput onAdd={handleNaturalAdd} onEdit={handleNaturalEdit} />}
            {addMode === 'manual' && (
              <div className="add-manual-form">
                <input type="text" className="add-manual-input" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Food name" />
                <div className="add-manual-row">
                  <input type="number" inputMode="decimal" className="add-manual-input" value={manualKcal} onChange={(e) => setManualKcal(e.target.value)} placeholder="Calories" />
                  <input type="number" inputMode="decimal" className="add-manual-input" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} placeholder="Protein (g)" />
                </div>
                <button className="add-manual-submit" onClick={handleManualSubmit} disabled={!manualName.trim() || !manualKcal}>Add Entry</button>
              </div>
            )}
            {addMode === 'build' && <MealBuilder meal={addingMeal} onSave={handleMealBuilderSave} onCancel={handleBackToSearch} />}
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
      {activeTab === 'food' && (
        <>
          <div className="meals-section">
            {MEAL_CONFIG.map(({ key: meal, label }) => {
              const entries = todayEntries.filter((e) => e.meal === meal);
              const totals = sumNutrition(entries);

              return (
                <div key={meal} className="meal-row">
                  <div className="meal-row-header">
                    <span className="meal-label">{label}</span>
                    {entries.length > 0 && (
                      <span className="meal-totals-compact">{Math.round(totals.kcal)} cal · {Math.round(totals.protein)}g</span>
                    )}
                  </div>
                  {entries.length > 0 && (
                    <div className="meal-entries">
                      {entries.map((entry) => (
                        <FoodEntryCard key={entry.id} entry={entry} onDelete={setDeleteId} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <FloatingActionButton
            onLogMeal={() => { setAddMode(null); setAddingMeal(getDefaultMeal()); }}
            onCookBatch={() => setShowCookFlow(true)}
            onLogWater={() => setActiveTab('water')}
            onLogExercise={() => setActiveTab('exercise')}
          />
        </>
      )}

      {/* Water tab */}
      {activeTab === 'water' && <WaterPanel />}

      {/* Exercise tab */}
      {activeTab === 'exercise' && <ExercisePanel />}

      {deleteId && (
        <Modal title="Delete Entry" onClose={() => setDeleteId(null)}>
          <p style={{ marginBottom: 16 }}>Are you sure you want to delete this entry?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-danger)', padding: '10px' }} onClick={confirmDelete}>Delete</button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }} onClick={() => setDeleteId(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
