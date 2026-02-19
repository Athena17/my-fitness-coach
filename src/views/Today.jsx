import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { useEffectiveTargets } from '../hooks/useEffectiveTargets.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import FoodEntryCard from '../components/FoodEntryCard.jsx';
import { sumNutrition } from '../utils/nutritionCalc.js';
import ExercisePanel from '../components/ExercisePanel.jsx';
import QuickAddRow from '../components/QuickAddRow.jsx';
import ScrollStrip from '../components/ScrollStrip.jsx';
import IngredientListFlow from '../components/IngredientListFlow.jsx';
import { getEmoji } from '../utils/foodEmoji.js';
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
  const { kcal: effectiveKcal, protein: effectiveProtein } = useEffectiveTargets();
  const [activeTab, setActiveTab] = useState('food');

  // Drag-and-drop state (Quick Add + entry reorder)
  const [dragItem, setDragItem] = useState(null);
  const [dragEntryId, setDragEntryId] = useState(null);
  const [dragOverMeal, setDragOverMeal] = useState(null);

  // Custom add flow
  const [customStep, setCustomStep] = useState(null);
  const [customDraft, setCustomDraft] = useState(null);

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

  function handleQuickAddSelect(item) {
    if (item.type === 'leftover') {
      // Leftovers → confirm step with remaining servings
      setCustomDraft({
        name: item.name,
        kcal: item.kcal,
        protein: item.protein,
        servingsYield: item.remaining,
        servingsConsumed: 1,
        mealSlot: getDefaultMeal(),
        isLeftover: true,
        leftover: item.leftover,
      });
      setCustomStep('confirm');
      return;
    }
    // Meals → confirm step
    setCustomDraft({
      name: item.name,
      kcal: item.kcal,
      protein: item.protein,
      ingredients: item.ingredients,
      servingsYield: 1,
      servingsConsumed: 1,
      mealSlot: getDefaultMeal(),
    });
    setCustomStep('confirm');
  }

  // --- Drop handler (drag-and-drop from Quick Add) ---

  function handleDrop(item, mealKey) {
    if (!item || !mealKey) return;

    if (item.type === 'leftover') {
      // Leftovers → open confirm step with meal pre-set
      setCustomDraft({
        name: item.name,
        kcal: item.kcal,
        protein: item.protein,
        servingsYield: item.remaining,
        servingsConsumed: 1,
        mealSlot: mealKey,
        isLeftover: true,
        leftover: item.leftover,
      });
      setCustomStep('confirm');
    } else {
      // Meals (1 serving) → directly add entry
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          id: generateId(),
          name: item.name,
          kcal: Math.round(item.kcal),
          protein: Math.round(item.protein * 10) / 10,
          meal: mealKey,
          servingSize: 1,
          servingUnit: 'serving',
          timestamp: Date.now(),
          dateKey: getToday(),
          ...(item.ingredients ? { ingredients: item.ingredients } : {}),
        },
      });
    }
    setDragItem(null);
    setDragOverMeal(null);
  }

  // --- Entry reorder drop handler ---

  function handleEntryDrop(entry, newMealKey) {
    if (!entry || !newMealKey || entry.meal === newMealKey) return;
    dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, meal: newMealKey } });
  }

  // --- Custom add flow ---

  function getDefaultMeal() {
    const h = new Date().getHours();
    if (h < 11) return 'Breakfast';
    if (h < 15) return 'Lunch';
    if (h < 20) return 'Dinner';
    return 'Snack';
  }

  function handleListDone(result) {
    setCustomDraft((d) => ({
      ...d,
      name: result.name, kcal: result.kcal, protein: result.protein,
      ingredients: result.ingredients,
      servingsYield: 1, servingsConsumed: 1,
      mealSlot: d?.mealSlot || getDefaultMeal(),
    }));
    setCustomStep('confirm');
  }

  function handleConfirmSave() {
    if (!customDraft || !customDraft.mealSlot) return;
    const { name, kcal, protein, ingredients, servingsYield, servingsConsumed, mealSlot } = customDraft;
    const yieldN = Math.max(1, servingsYield);
    const consumed = Math.min(Math.max(0, servingsConsumed), yieldN);

    if (customDraft.isLeftover) {
      // Eating from existing leftover
      const lo = customDraft.leftover;
      if (consumed > 0) {
        dispatch({
          type: 'ADD_ENTRY',
          payload: {
            id: generateId(), name,
            kcal: Math.round(kcal * consumed),
            protein: Math.round(protein * consumed * 10) / 10,
            meal: mealSlot, servingSize: consumed, servingUnit: 'serving',
            timestamp: Date.now(), dateKey: getToday(),
            fromLeftoverId: lo.id,
          },
        });
        const newRemaining = lo.remainingServings - consumed;
        if (newRemaining > 0) {
          dispatch({ type: 'UPDATE_LEFTOVER', payload: { ...lo, remainingServings: newRemaining } });
        } else {
          dispatch({ type: 'DELETE_LEFTOVER', payload: lo.id });
        }
      }
    } else {
      // New meal
      const perServing = { kcal: Math.round(kcal / yieldN), protein: Math.round(protein / yieldN * 10) / 10 };

      if (consumed > 0) {
        dispatch({
          type: 'ADD_ENTRY',
          payload: {
            id: generateId(), name,
            kcal: Math.round(perServing.kcal * consumed),
            protein: Math.round(perServing.protein * consumed * 10) / 10,
            meal: mealSlot, servingSize: consumed, servingUnit: 'serving',
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
    }

    // Save to My Meals if toggled
    if (customDraft.saveToMyMeals && name) {
      const existing = (state.customMeals || []).find((m) => m.name.toLowerCase() === name.toLowerCase());
      const customMeal = {
        ...(existing ? { id: existing.id } : { id: generateId() }),
        name,
        kcal: Math.round(kcal),
        protein: Math.round(protein * 10) / 10,
        ingredients: ingredients || [],
      };
      dispatch({ type: existing ? 'UPDATE_CUSTOM_MEAL' : 'ADD_CUSTOM_MEAL', payload: customMeal });
    }

    setCustomStep(null);
    setCustomDraft(null);
  }

  function handleDirectNext() {
    const name = customDraft?.name?.trim();
    const kcal = Number(customDraft?.kcal);
    const protein = Number(customDraft?.protein) || 0;
    if (!name || !kcal || kcal <= 0) return;
    setCustomDraft((d) => ({
      ...d,
      name, kcal, protein,
      servingsYield: 1, servingsConsumed: 1,
      mealSlot: d?.mealSlot || getDefaultMeal(),
    }));
    setCustomStep('confirm');
  }

  function handleCustomClose() {
    setCustomStep(null);
    setCustomDraft(null);
  }

  // --- Full-view takeovers ---

  const isEditing = !!state.editingEntry;

  if (isEditing) {
    const entry = state.editingEntry;
    return (
      <div className="today">
        <IngredientListFlow
          initialData={entry.ingredients ? entry : { name: entry.name, ingredients: [] }}
          onSave={(built) => {
            dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, name: built.name, kcal: built.kcal, protein: built.protein, ingredients: built.ingredients } });
            dispatch({ type: 'SET_EDITING_ENTRY', payload: null });
          }}
          onCancel={() => dispatch({ type: 'SET_EDITING_ENTRY', payload: null })}
        />
      </div>
    );
  }

  if (customStep) {
    return (
      <div className="today">
        {customStep === 'choose' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={handleCustomClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <span className="add-mode-title">Add Meal</span>
            </div>
            <div className="add-choose-options">
              <button className="add-choose-card" onClick={() => { setCustomDraft({ name: '', kcal: '', protein: '' }); setCustomStep('direct'); }}>
                <span className="add-choose-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </span>
                <span className="add-choose-card-title">Direct Add</span>
                <span className="add-choose-card-desc">Enter name &amp; macros</span>
              </button>
              <button className="add-choose-card" onClick={() => setCustomStep('list')}>
                <span className="add-choose-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/><circle cx="19" cy="6" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="18" r="1.5" fill="currentColor"/></svg>
                </span>
                <span className="add-choose-card-title">Add Ingredients</span>
                <span className="add-choose-card-desc">Build meal step by step</span>
              </button>
            </div>
          </div>
        )}

        {customStep === 'direct' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={() => setCustomStep('choose')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="add-mode-title">Direct Add</span>
            </div>
            <div className="direct-form">
              <div className="direct-form-group">
                <label className="confirm-label">Meal name</label>
                <input
                  className="direct-input"
                  type="text"
                  placeholder="e.g. Chicken rice bowl"
                  value={customDraft?.name || ''}
                  onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="direct-form-row">
                <div className="direct-form-group">
                  <label className="confirm-label">Calories</label>
                  <input
                    className="direct-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={customDraft?.kcal || ''}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, kcal: e.target.value }))}
                  />
                </div>
                <div className="direct-form-group">
                  <label className="confirm-label">Protein (g)</label>
                  <input
                    className="direct-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={customDraft?.protein || ''}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, protein: e.target.value }))}
                  />
                </div>
              </div>
              <button
                type="button"
                className={`ilf-my-meals-toggle ${customDraft?.saveToMyMeals ? 'ilf-my-meals-toggle--on' : ''}`}
                onClick={() => setCustomDraft((d) => ({ ...d, saveToMyMeals: !d.saveToMyMeals }))}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={customDraft?.saveToMyMeals ? '#fff' : 'none'} stroke={customDraft?.saveToMyMeals ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span>{customDraft?.saveToMyMeals ? 'Saved to My Meals' : 'Save to My Meals'}</span>
              </button>
              <button
                className="confirm-log-btn"
                onClick={handleDirectNext}
                disabled={!customDraft?.name?.trim() || !Number(customDraft?.kcal)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {customStep === 'list' && (
          <IngredientListFlow
            onSave={handleListDone}
            onCancel={customDraft?.servingsYield ? () => setCustomStep('confirm') : () => setCustomStep('choose')}
            initialData={customDraft?.servingsYield ? customDraft : undefined}
          />
        )}

        {customStep === 'confirm' && customDraft && (() => {
          const perServing = customDraft.servingsYield > 1
            ? { kcal: Math.round(customDraft.kcal / customDraft.servingsYield), protein: Math.round(customDraft.protein / customDraft.servingsYield * 10) / 10 }
            : { kcal: Math.round(customDraft.kcal), protein: Math.round(customDraft.protein * 10) / 10 };
          const leftover = customDraft.servingsYield - customDraft.servingsConsumed;

          return (
            <div className="add-mode-view confirm-view">
              <div className="add-mode-header">
                <button className="add-mode-back" onClick={handleCustomClose}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <span className="add-mode-title">Log Meal</span>
              </div>

              <div className="confirm-hero">
                <span className="confirm-hero-emoji">{getEmoji(customDraft.name)}</span>
                <span className="confirm-hero-name">{customDraft.name}</span>
                <div className="confirm-hero-macros">
                  <span className="confirm-hero-macro confirm-hero-macro--kcal">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="#ff6b2b"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
                    {Math.round(customDraft.kcal)} cal
                  </span>
                  <span className="confirm-hero-sep" />
                  <span className="confirm-hero-macro confirm-hero-macro--protein">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#9575cd" stroke="#9575cd" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
                    {Math.round(customDraft.protein)}g
                  </span>
                </div>
              </div>

              {customDraft.ingredients && customDraft.ingredients.length > 0 && (
                <div className="confirm-ingredients">
                  <div className="confirm-ingredients-header">
                    <span className="confirm-ingredients-title">Ingredients</span>
                    <button type="button" className="confirm-ingredients-edit" onClick={() => setCustomStep('list')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      Edit
                    </button>
                  </div>
                  <div className="confirm-ingredients-list">
                    {customDraft.ingredients.map((ing, i) => (
                      <div key={i} className="confirm-ingredient-row">
                        <span className="confirm-ingredient-name">{ing.name}</span>
                        <span className="confirm-ingredient-detail">{ing.grams}g · {ing.kcal} cal · {ing.protein}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="confirm-card">
                <div className="confirm-servings-row">
                  <div className="confirm-serving-group">
                    <label className="confirm-label">{customDraft.isLeftover ? 'Available' : 'Servings prepped'}</label>
                    {customDraft.isLeftover ? (
                      <span className="confirm-input confirm-input--static">{customDraft.servingsYield}</span>
                    ) : (
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
                    )}
                  </div>
                  <div className="confirm-serving-group">
                    <label className="confirm-label">{customDraft.isLeftover ? 'Eating now' : 'Having now'}</label>
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
                </div>

                {customDraft.servingsYield > 1 && (
                  <div className="confirm-breakdown">
                    <span className="confirm-breakdown-item">{perServing.kcal} cal · {perServing.protein}g per serving</span>
                    {!customDraft.isLeftover && leftover > 0 && (
                      <span className="confirm-breakdown-kitchen">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/></svg>
                        {leftover} serving{leftover !== 1 ? 's' : ''} saved to kitchen
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button className="confirm-log-btn" onClick={handleConfirmSave}>
                Log it
              </button>
            </div>
          );
        })()}
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
        const calTarget = effectiveKcal || state.targets?.kcal || 2000;
        const protTarget = effectiveProtein || state.targets?.protein || 120;

        return (
          <>
            {/* Daily summary */}
            <div className="daily-summary">
              <span className="daily-summary-item"><span className="daily-summary-value">{Math.round(dailyTotals.kcal)}</span> / {calTarget} cal</span>
              <span className="daily-summary-sep" />
              <span className="daily-summary-item"><span className="daily-summary-value">{Math.round(dailyTotals.protein)}</span> / {protTarget}g protein</span>
            </div>

            <QuickAddRow
              onSelect={handleQuickAddSelect}
              dragItem={dragItem}
              setDragItem={setDragItem}
              dragOverMeal={dragOverMeal}
              setDragOverMeal={setDragOverMeal}
              onDrop={handleDrop}
            />

            {/* Meals */}
            <div className="meals-section">
              {MEAL_CONFIG.map(({ key: meal, label }) => {
                const entries = todayEntries.filter((e) => e.meal === meal);
                const totals = sumNutrition(entries);
                const isActive = meal === activeMealKey;
                const isFilled = entries.length > 0;

                const anyDragging = dragItem || dragEntryId;
                const classes = [
                  'meal-row',
                  isFilled && 'meal-row--filled',
                  isActive && 'meal-row--active',
                  anyDragging && 'meal-row--drag-active',
                  dragOverMeal === meal && 'meal-row--drop-target',
                ].filter(Boolean).join(' ');

                return (
                  <div key={meal} className={classes} data-meal={meal}>
                    <div className="meal-row-header">
                      <span className="meal-label">{label}</span>
                      {isFilled && (
                        <span className="meal-totals-compact">{Math.round(totals.kcal)} cal · {Math.round(totals.protein)}g</span>
                      )}
                      {isFilled && (
                        <button
                          className="meal-add-btn"
                          onClick={() => {
                            setCustomDraft((d) => ({ ...d, mealSlot: meal }));
                            setCustomStep('choose');
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      )}
                    </div>
                    {isFilled && (
                      <ScrollStrip className="meal-entries-scroll">
                        {entries.map((entry) => (
                          <FoodEntryCard
                            key={entry.id}
                            entry={entry}
                            onDelete={handleDeleteEntry}
                            dragEntryId={dragEntryId}
                            setDragEntryId={setDragEntryId}
                            setDragOverMeal={setDragOverMeal}
                            onEntryDrop={handleEntryDrop}
                          />
                        ))}
                      </ScrollStrip>
                    )}
                    {!isFilled && (
                      <button
                        className="meal-empty-prompt"
                        onClick={() => {
                          setCustomDraft((d) => ({ ...d, mealSlot: meal }));
                          setCustomStep('choose');
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        What did you have for {label.toLowerCase()}?
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}


      {/* Exercise tab */}
      {activeTab === 'exercise' && <ExercisePanel />}

    </div>
  );
}
