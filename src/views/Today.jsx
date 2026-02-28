import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { useCyclingConfig } from '../hooks/useCyclingConfig.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday, formatDateKey } from '../utils/dateUtils.js';
import FoodEntryCard from '../components/FoodEntryCard.jsx';
import { sumNutrition, hasMacroTargets } from '../utils/nutritionCalc.js';
import ExercisePanel from '../components/ExercisePanel.jsx';
import IngredientListFlow from '../components/IngredientListFlow.jsx';
import { getEmoji } from '../utils/foodEmoji.js';
import BarcodeScanner from '../components/BarcodeScanner.jsx';
import './Today.css';

const MEAL_CONFIG = [
  { key: 'Breakfast', label: 'Breakfast' },
  { key: 'Lunch', label: 'Lunch' },
  { key: 'Dinner', label: 'Dinner' },
  { key: 'Snack', label: 'Snacks' },
];


export default function Today() {
  const { state, dispatch } = useApp();
  const [selectedDate, setSelectedDate] = useState(getToday);
  const { todayEntries, caloriesBurned, todayWaterLogs, todayWaterTotal } = useDailyEntries(selectedDate);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [waterExpanded, setWaterExpanded] = useState(false);
  const [cyclingConfig] = useCyclingConfig();
  const selectedDayType = state.dayTypes?.[selectedDate] || 'rest';
  const setSelectedDayType = useCallback((type) => {
    dispatch({ type: 'SET_DAY_TYPE', payload: { dateKey: selectedDate, dayType: type } });
  }, [dispatch, selectedDate]);

  const effectiveKcal = cyclingConfig.enabled
    ? (selectedDayType === 'training' ? cyclingConfig.trainingKcal : cyclingConfig.restKcal)
    : state.targets.kcal;
  const effectiveProtein = cyclingConfig.enabled
    ? (selectedDayType === 'training' ? cyclingConfig.trainingProtein : cyclingConfig.restProtein)
    : state.targets.protein;
  const effectiveCarbs = cyclingConfig.enabled
    ? ((selectedDayType === 'training' ? cyclingConfig.trainingCarbs : cyclingConfig.restCarbs) || state.targets.carbs || 0)
    : (state.targets.carbs ?? 0);
  const effectiveFat = cyclingConfig.enabled
    ? ((selectedDayType === 'training' ? cyclingConfig.trainingFat : cyclingConfig.restFat) || state.targets.fat || 0)
    : (state.targets.fat ?? 0);
  const macroFlags = hasMacroTargets(state.targets);
  const [activeTab, setActiveTab] = useState('food');
  const today = getToday();

  const navigateDay = useCallback((offset) => {
    setSelectedDate(prev => {
      const d = new Date(prev + 'T00:00:00');
      d.setDate(d.getDate() + offset);
      return formatDateKey(d);
    });
  }, []);

  const selectedDateObj = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate]);
  const isToday = selectedDate === today;

  // Saved meals search
  const [mealQuery, setMealQuery] = useState('');
  const mealSearchRef = useRef(null);

  const savedMealResults = useMemo(() => {
    const meals = state.customMeals || [];
    if (!mealQuery.trim()) return meals.sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
    const q = mealQuery.toLowerCase();
    return meals.filter((m) => m.name.toLowerCase().includes(q));
  }, [state.customMeals, mealQuery]);

  function handleSavedMealSelect(meal) {
    setMealQuery('');
    handleQuickAddSelect({
      type: 'meal',
      id: meal.id,
      name: meal.name,
      kcal: meal.kcal,
      protein: meal.protein,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      ingredients: meal.ingredients,
    });
  }


  // Recently eaten items (last 3 days, deduplicated by name, up to 10)
  const recentEntries = useMemo(() => {
    const d1 = new Date(); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(); d3.setDate(d3.getDate() - 3);
    const recentKeys = new Set([formatDateKey(d1), formatDateKey(d2), formatDateKey(d3)]);

    const past = (state.entries || [])
      .filter((e) => recentKeys.has(e.dateKey) && e.dateKey !== selectedDate)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const seen = new Set();
    const unique = [];
    for (const e of past) {
      const key = e.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({
        type: 'meal',
        id: `recent-${e.id}`,
        name: e.name,
        kcal: e.kcal,
        protein: e.protein,
        carbs: e.carbs || 0,
        fat: e.fat || 0,
        ingredients: e.ingredients,
      });
      if (unique.length >= 10) break;
    }
    return unique;
  }, [state.entries, selectedDate]);

  // Quick-add meals: top 5 from saved meals + recent entries, deduplicated
  const quickAddMeals = useMemo(() => {
    const seen = new Set();
    const result = [];
    const saved = (state.customMeals || []).slice().sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
    for (const m of saved) {
      const key = m.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ id: m.id, name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs || 0, fat: m.fat || 0, ingredients: m.ingredients });
      if (result.length >= 5) break;
    }
    if (result.length < 5) {
      for (const e of recentEntries) {
        const key = e.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ id: e.id, name: e.name, kcal: e.kcal, protein: e.protein, carbs: e.carbs || 0, fat: e.fat || 0, ingredients: e.ingredients });
        if (result.length >= 5) break;
      }
    }
    return result;
  }, [state.customMeals, recentEntries]);

  // Drag-and-drop state (entry reorder between meal slots)
  const [dragEntryId, setDragEntryId] = useState(null);
  const [dragOverMeal, setDragOverMeal] = useState(null);


  // Helper: increment useCount on a custom meal by name
  function incrementMealUseCount(name) {
    if (!name) return;
    const meal = (state.customMeals || []).find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (meal) {
      dispatch({ type: 'UPDATE_CUSTOM_MEAL', payload: { ...meal, useCount: (meal.useCount || 0) + 1 } });
    }
  }

  // Custom add flow — restore from global draft if available
  const [customStep, setCustomStepRaw] = useState(state.mealDraft?.step ?? null);
  const [customDraft, setCustomDraft] = useState(state.mealDraft?.draft ?? null);
  const [navStack, setNavStack] = useState([]);

  // Navigate forward: push current step onto stack, then go to next step
  function navigateTo(step) {
    setNavStack((prev) => [...prev, customStep]);
    setCustomStepRaw(step);
  }

  // Navigate back: pop from stack (or close if stack empty)
  function navigateBack() {
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setNavStack((s) => s.slice(0, -1));
      setCustomStepRaw(prev);
    } else {
      handleCustomClose();
    }
  }

  // Direct step set (for resets/saves — clears stack)
  function setCustomStep(step) {
    setNavStack([]);
    setCustomStepRaw(step);
  }

  // Sync draft to global state so it survives tab switches
  useEffect(() => {
    if (customStep && customDraft) {
      dispatch({ type: 'SET_MEAL_DRAFT', payload: { step: customStep, draft: customDraft } });
    }
  }, [customStep, customDraft, dispatch]);

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
        carbs: item.carbs || 0,
        fat: item.fat || 0,
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
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      ingredients: item.ingredients,
      servingsYield: 1,
      servingsConsumed: 1,
      mealSlot: getDefaultMeal(),
    });
    setCustomStep('confirm');
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
      carbs: result.carbs || 0, fat: result.fat || 0,
      ingredients: result.ingredients,
      servingsYield: 1, servingsConsumed: 1,
      mealSlot: d?.mealSlot || getDefaultMeal(),
    }));
    navigateTo('confirm');
  }

  function handleConfirmSave() {
    if (!customDraft || !customDraft.mealSlot) return;
    const { kcal, protein, carbs: draftCarbs, fat: draftFat, ingredients, servingsYield, servingsConsumed, mealSlot } = customDraft;
    // For scanned items, append the total grams to the name so you know what the macros are for
    let name = customDraft.name;
    if (customDraft.scanned && customDraft.servingGrams && customDraft.numServings) {
      const totalGrams = Math.round(customDraft.servingGrams * customDraft.numServings);
      name = `${name} (${totalGrams}g)`;
    }
    const cVal = draftCarbs || 0;
    const fVal = draftFat || 0;
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
            protein: Math.round(protein * consumed),
            carbs: Math.round(cVal * consumed),
            fat: Math.round(fVal * consumed),
            meal: mealSlot, servingSize: consumed, servingUnit: 'serving',
            timestamp: Date.now(), dateKey: selectedDate,
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
      const perServing = {
        kcal: Math.round(kcal / yieldN),
        protein: Math.round(protein / yieldN),
        carbs: Math.round(cVal / yieldN),
        fat: Math.round(fVal / yieldN),
      };

      if (consumed > 0) {
        dispatch({
          type: 'ADD_ENTRY',
          payload: {
            id: generateId(), name,
            kcal: Math.round(perServing.kcal * consumed),
            protein: Math.round(perServing.protein * consumed),
            carbs: Math.round(perServing.carbs * consumed),
            fat: Math.round(perServing.fat * consumed),
            meal: mealSlot, servingSize: consumed, servingUnit: 'serving',
            timestamp: Date.now(), dateKey: selectedDate,
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
            dateCooked: selectedDate, timestamp: Date.now(),
          },
        });
      }
    }

    // Save to My Meals if toggled
    if (customDraft.saveToMyMeals && name) {
      const existing = (state.customMeals || []).find((m) => m.name.toLowerCase() === name.toLowerCase());
      const customMeal = {
        ...(existing ? { id: existing.id, useCount: (existing.useCount || 0) + 1 } : { id: generateId(), useCount: 1 }),
        name,
        kcal: Math.round(kcal),
        protein: Math.round(protein),
        carbs: Math.round(cVal),
        fat: Math.round(fVal),
        ingredients: ingredients || [],
      };
      dispatch({ type: existing ? 'UPDATE_CUSTOM_MEAL' : 'ADD_CUSTOM_MEAL', payload: customMeal });
    } else {
      // Still increment useCount even if not saving
      incrementMealUseCount(name);
    }

    setCustomStep(null);
    setCustomDraft(null);
    dispatch({ type: 'CLEAR_MEAL_DRAFT' });
  }

  function handleDirectNext() {
    const name = customDraft?.name?.trim();
    const kcal = Number(customDraft?.kcal);
    const protein = Number(customDraft?.protein) || 0;
    const carbs = Number(customDraft?.carbs) || 0;
    const fat = Number(customDraft?.fat) || 0;
    if (!name || !kcal || kcal <= 0) return;
    setCustomDraft((d) => ({
      ...d,
      name, kcal, protein, carbs, fat,
      servingsYield: 1, servingsConsumed: 1,
      mealSlot: d?.mealSlot || getDefaultMeal(),
    }));
    navigateTo('confirm');
  }

  function handleCustomClose() {
    setCustomStep(null);
    setCustomDraft(null);
    dispatch({ type: 'CLEAR_MEAL_DRAFT' });
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
            dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, name: built.name, kcal: built.kcal, protein: built.protein, carbs: built.carbs || 0, fat: built.fat || 0, ingredients: built.ingredients } });
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
        {customStep === 'search' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={navigateBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <span className="add-mode-title">Find a Meal</span>
            </div>
            <div className="search-flow">
              <div className="search-flow-bar" ref={mealSearchRef}>
                <svg className="add-entry-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  className="add-entry-search-input"
                  type="text"
                  placeholder="Search meals &amp; food…"
                  value={mealQuery}
                  onChange={(e) => setMealQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {/* Search results */}
              {savedMealResults.length > 0 && (
                <div className="search-flow-results">
                  {savedMealResults.map((m) => (
                    <button key={m.id} className="search-flow-item" onClick={() => handleSavedMealSelect(m)}>
                      <span className="search-flow-emoji">{getEmoji(m.name)}</span>
                      <div className="search-flow-info">
                        <span className="search-flow-name">{m.name}</span>
                        <span className="search-flow-meta">{Math.round(m.kcal)} cal · {Math.round(m.protein)}g protein</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {mealQuery.trim() && savedMealResults.length === 0 && (
                <div className="search-flow-empty">
                  <span className="search-flow-empty-msg">No meals found for &ldquo;{mealQuery.trim()}&rdquo;</span>
                </div>
              )}
              {/* Recently Eaten in search */}
              {!mealQuery.trim() && recentEntries.length > 0 && (
                <div className="search-flow-section">
                  <span className="search-flow-section-title">Recently Eaten</span>
                  <div className="search-flow-results">
                    {recentEntries.map((item) => (
                      <button key={item.id} className="search-flow-item" onClick={() => handleQuickAddSelect(item)}>
                        <span className="search-flow-emoji">{getEmoji(item.name)}</span>
                        <div className="search-flow-info">
                          <span className="search-flow-name">{item.name}</span>
                          <span className="search-flow-meta">{Math.round(item.kcal)} cal · {Math.round(item.protein)}g protein</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {customStep === 'direct' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={navigateBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <span className="add-mode-title">Quick Log</span>
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
              <div className="direct-form-row">
                <div className="direct-form-group">
                  <label className="confirm-label">Carbs (g)</label>
                  <input
                    className="direct-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={customDraft?.carbs || ''}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, carbs: e.target.value }))}
                  />
                </div>
                <div className="direct-form-group">
                  <label className="confirm-label">Fat (g)</label>
                  <input
                    className="direct-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={customDraft?.fat || ''}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, fat: e.target.value }))}
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
            onCancel={navigateBack}
            initialData={customDraft?.servingsYield ? customDraft : undefined}
          />
        )}

        {customStep === 'scan' && (
          <BarcodeScanner
            onResult={(product) => {
              setCustomDraft({
                name: product.name,
                // Total macros = per serving × number of servings (starts at 1)
                kcal: product.perServing.kcal,
                protein: product.perServing.protein,
                carbs: product.perServing.carbs,
                fat: product.perServing.fat,
                // Scan-specific fields
                scanned: true,
                perServing: product.perServing,
                servingLabel: product.servingSize || `${product.servingGrams}g`,
                servingGrams: product.servingGrams,
                numServings: 1,
                servingsYield: 1,
                servingsConsumed: 1,
                mealSlot: getDefaultMeal(),
                saveToMyMeals: true,
              });
              navigateTo('confirm');
            }}
            onClose={handleCustomClose}
          />
        )}

        {customStep === 'confirm' && customDraft && (() => {
          const perServing = customDraft.servingsYield > 1
            ? { kcal: Math.round(customDraft.kcal / customDraft.servingsYield), protein: Math.round(customDraft.protein / customDraft.servingsYield) }
            : { kcal: Math.round(customDraft.kcal), protein: Math.round(customDraft.protein) };
          const leftover = customDraft.servingsYield - customDraft.servingsConsumed;

          return (
            <div className="add-mode-view confirm-view">
              <div className="add-mode-header">
                <button className="add-mode-back" onClick={navigateBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <span className="add-mode-title">Quick Log</span>
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
                  {macroFlags.showCarbs && customDraft.carbs > 0 && <>
                    <span className="confirm-hero-sep" />
                    <span className="confirm-hero-macro" style={{ color: 'var(--color-carbs)' }}>C {Math.round(customDraft.carbs)}g</span>
                  </>}
                  {macroFlags.showFat && customDraft.fat > 0 && <>
                    <span className="confirm-hero-sep" />
                    <span className="confirm-hero-macro" style={{ color: 'var(--color-fat)' }}>F {Math.round(customDraft.fat)}g</span>
                  </>}
                </div>
              </div>

              {customDraft.scanned && customDraft.perServing && (
                <div className="confirm-card">
                  <div className="confirm-serving-info">
                    <span className="confirm-serving-label">1 serving = {customDraft.servingLabel}</span>
                    <span className="confirm-serving-macros">
                      {customDraft.perServing.kcal} cal · {customDraft.perServing.protein}g protein
                    </span>
                  </div>
                  <div className="confirm-servings-count">
                    <label className="confirm-label">How many servings?</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="confirm-input"
                      min="0.5"
                      step="0.5"
                      value={customDraft.numServings}
                      onChange={(e) => setCustomDraft((d) => {
                        const n = Math.max(0, Number(e.target.value) || 0);
                        return {
                          ...d,
                          numServings: n,
                          kcal: Math.round(d.perServing.kcal * n),
                          protein: Math.round(d.perServing.protein * n),
                          carbs: Math.round(d.perServing.carbs * n),
                          fat: Math.round(d.perServing.fat * n),
                        };
                      })}
                    />
                  </div>
                </div>
              )}

              {customDraft.ingredients && customDraft.ingredients.length > 0 && (
                <div className="confirm-ingredients">
                  <div className="confirm-ingredients-header">
                    <span className="confirm-ingredients-title">Ingredients</span>
                    <button type="button" className="confirm-ingredients-edit" onClick={() => navigateTo('list')}>
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

              <div className="confirm-meal-picker">
                <label className="confirm-label">Meal</label>
                <div className="confirm-meal-options">
                  {MEAL_CONFIG.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`confirm-meal-chip${customDraft.mealSlot === key ? ' confirm-meal-chip--active' : ''}`}
                      onClick={() => setCustomDraft((d) => ({ ...d, mealSlot: key }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {!customDraft.scanned && (
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
              )}

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
    <div className={`today${cyclingConfig.enabled && selectedDayType === 'training' ? ' today--training' : ''}`}>
      {/* Date selector */}
      <div className="date-selector">
        <button className="date-nav-btn" onClick={() => navigateDay(-1)} aria-label="Previous day">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="date-selector-center">
          <span className="date-selector-label">
            {isToday
              ? 'Today'
              : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          {!isToday && (
            <button className="date-today-btn" onClick={() => setSelectedDate(today)}>
              Back to today
            </button>
          )}
        </div>
        <button className="date-nav-btn" onClick={() => navigateDay(1)} aria-label="Next day" disabled={isToday}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Training/Rest toggle (calorie cycling) — above tabs */}
      {cyclingConfig.enabled && (
        <div className="day-type-toggle">
          <button
            className={`day-type-btn day-type-btn--rest${selectedDayType === 'rest' ? ' day-type-btn--active' : ''}`}
            onClick={() => setSelectedDayType('rest')}
          >Rest</button>
          <button
            className={`day-type-btn day-type-btn--training${selectedDayType === 'training' ? ' day-type-btn--active' : ''}`}
            onClick={() => setSelectedDayType('training')}
          >Train</button>
        </div>
      )}

      {/* Tabs + content panel */}
      <div className="today-tab-panel">
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

        <div className="today-tab-content">
      {/* Food tab */}
      {activeTab === 'food' && (() => {
        const dailyTotals = sumNutrition(todayEntries);
        const waterTarget = state.targets?.waterTargetLiters || 2.5;
        const waterPct = waterTarget > 0 ? Math.min(todayWaterTotal / waterTarget, 1) : 0;
        const waterDone = todayWaterTotal >= waterTarget;

        return (
          <>
            {/* Add Food button */}
            <button
              className={`food-add-btn ${addFoodOpen ? 'food-add-btn--active' : ''}`}
              onClick={() => setAddFoodOpen(!addFoodOpen)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {addFoodOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                }
              </svg>
              {addFoodOpen ? 'Cancel' : 'Add Food'}
            </button>

            {addFoodOpen && (
              <div className="food-add-panel">
                {quickAddMeals.length > 0 && (
                  <div className="food-quick-add">
                    <span className="food-quick-add-label">Quick add</span>
                    <div className="food-quick-add-scroll">
                      {quickAddMeals.map((meal) => (
                        <button
                          key={meal.id}
                          className="food-quick-add-chip"
                          onClick={() => {
                            setAddFoodOpen(false);
                            handleQuickAddSelect({ type: 'meal', ...meal });
                          }}
                        >
                          <span className="food-quick-add-emoji">{getEmoji(meal.name)}</span>
                          <span className="food-quick-add-name">{meal.name}</span>
                          <span className="food-quick-add-cal">{Math.round(meal.kcal)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="food-add-options">
                <button className="food-add-option" onClick={() => { setAddFoodOpen(false); setMealQuery(''); setCustomStep('search'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span className="food-add-option-text">
                    <span className="food-add-option-title">Find a meal</span>
                    <span className="food-add-option-desc">Search saved &amp; database</span>
                  </span>
                </button>
                <button className="food-add-option" onClick={() => { setAddFoodOpen(false); setCustomDraft({ mealSlot: getDefaultMeal() }); setCustomStep('list'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C9 2 4 3.5 4 8c0 3 2 5 2 5h12s2-2 2-5c0-4.5-5-6-8-6z"/>
                    <path d="M6 13v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
                  </svg>
                  <span className="food-add-option-text">
                    <span className="food-add-option-title">Cook a meal</span>
                    <span className="food-add-option-desc">Build from ingredients</span>
                  </span>
                </button>
                <button className="food-add-option" onClick={() => { setAddFoodOpen(false); setCustomDraft({ mealSlot: getDefaultMeal(), name: '', kcal: '', protein: '', saveToMyMeals: true }); setCustomStep('direct'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  <span className="food-add-option-text">
                    <span className="food-add-option-title">Quick log</span>
                    <span className="food-add-option-desc">Enter name &amp; macros</span>
                  </span>
                </button>
                <button className="food-add-option" onClick={() => { setAddFoodOpen(false); setCustomStep('scan'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  <span className="food-add-option-text">
                    <span className="food-add-option-title">Scan barcode</span>
                    <span className="food-add-option-desc">Look up nutrition info</span>
                  </span>
                </button>
                </div>
              </div>
            )}

            {/* Food log card — targets + meal categories */}
            <div className="daily-progress">
              <div className="daily-progress-macros">
                <span className="daily-progress-macro">
                  <span className="daily-progress-value">{Math.round(dailyTotals.kcal)}</span> / {effectiveKcal} cal
                </span>
                <span className="daily-progress-sep" />
                <span className="daily-progress-macro">
                  <span className="daily-progress-value">{Math.round(dailyTotals.protein)}</span> / {effectiveProtein}g P
                </span>
                {macroFlags.showCarbs && <>
                  <span className="daily-progress-sep" />
                  <span className="daily-progress-macro">
                    <span className="daily-progress-value">{Math.round(dailyTotals.carbs)}</span> / {effectiveCarbs}g C
                  </span>
                </>}
                {macroFlags.showFat && <>
                  <span className="daily-progress-sep" />
                  <span className="daily-progress-macro">
                    <span className="daily-progress-value">{Math.round(dailyTotals.fat)}</span> / {effectiveFat}g F
                  </span>
                </>}
              </div>
              <div className="meals-section">
                {MEAL_CONFIG.map(({ key: meal, label }) => {
                  const entries = todayEntries.filter((e) => e.meal === meal);
                  const totals = sumNutrition(entries);
                  const isFilled = entries.length > 0;

                  const anyDragging = dragEntryId;
                  const classes = [
                    'meal-category',
                    isFilled && 'meal-category--filled',
                    anyDragging && 'meal-category--drag-active',
                    dragOverMeal === meal && 'meal-category--drop-target',
                  ].filter(Boolean).join(' ');

                  return (
                    <div key={meal} className={classes} data-meal={meal}>
                      <div className="meal-category-header">
                        <span className="meal-label">{label}</span>
                        {isFilled ? (
                          <span className="meal-category-summary">
                            {Math.round(totals.kcal)} cal{totals.protein > 0 ? ` · ${Math.round(totals.protein)}g P` : ''}
                          </span>
                        ) : (
                          <span className="meal-category-empty">—</span>
                        )}
                      </div>
                      {isFilled && (
                        <div className="meal-entries-scroll">
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ——— Water section ——— */}
            <div className="food-tab-divider" />

            {/* Add Water button */}
            <button
              className={`water-add-btn ${waterExpanded ? 'water-add-btn--active' : ''}`}
              onClick={() => setWaterExpanded(!waterExpanded)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {waterExpanded
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                }
              </svg>
              {waterExpanded ? 'Cancel' : 'Add Water'}
            </button>

            {waterExpanded && (
              <div className="water-add-options">
                {[0.15, 0.25, 0.5, 0.75, 1].map((amt) => (
                  <button
                    key={amt}
                    className="water-add-option"
                    onClick={() => {
                      dispatch({
                        type: 'ADD_WATER',
                        payload: { id: generateId(), amountLiters: amt, dateKey: selectedDate, timestamp: Date.now() },
                      });
                      setWaterExpanded(false);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#50bfe8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
                    </svg>
                    <span className="water-add-option-text">{amt >= 1 ? `${amt}L` : `${Math.round(amt * 1000)}ml`}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Water progress */}
            <div className={`water-progress${waterDone ? ' water-progress--done' : ''}`}>
              <div className="water-progress-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#50bfe8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
                </svg>
                <span className="water-progress-amount">{todayWaterTotal.toFixed(1)}L <span className="water-progress-target">/ {waterTarget}L</span></span>
                <div className="water-progress-bar">
                  <div className="water-progress-bar-fill" style={{ width: `${waterPct * 100}%` }} />
                </div>
                {waterDone && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#50bfe8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 13 4 4L18 7"/></svg>
                )}
              </div>
              {todayWaterLogs.length > 0 && (
                <div className="water-log">
                  {todayWaterLogs.map((log) => (
                    <div key={log.id} className="water-log-item">
                      <span className="water-log-amt">+{log.amountLiters >= 1 ? `${log.amountLiters}L` : `${Math.round(log.amountLiters * 1000)}ml`}</span>
                      <span className="water-log-time">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        className="water-log-delete"
                        onClick={() => dispatch({ type: 'DELETE_WATER', payload: log.id })}
                        aria-label="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}


      {/* Exercise tab */}
      {activeTab === 'exercise' && <ExercisePanel selectedDate={selectedDate} />}
        </div>
      </div>

      {/* Sources disclaimer */}
      <div className="ov-sources-note">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
        <span>All targets and estimates are based on peer-reviewed formulas for general guidance only — not medical advice. <button type="button" className="ov-sources-link" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'profile' })}>View sources</button></span>
      </div>

    </div>
  );
}
