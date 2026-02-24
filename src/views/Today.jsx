import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { useEffectiveTargets } from '../hooks/useEffectiveTargets.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday, formatDateKey } from '../utils/dateUtils.js';
import FoodEntryCard from '../components/FoodEntryCard.jsx';
import { sumNutrition, hasMacroTargets } from '../utils/nutritionCalc.js';
import ExercisePanel from '../components/ExercisePanel.jsx';
import ScrollStrip from '../components/ScrollStrip.jsx';
import IngredientListFlow from '../components/IngredientListFlow.jsx';
import { getEmoji } from '../utils/foodEmoji.js';
import FoodSearch from '../components/FoodSearch.jsx';
import './Today.css';

const MEAL_CONFIG = [
  { key: 'Breakfast', label: 'Breakfast' },
  { key: 'Lunch', label: 'Lunch' },
  { key: 'Dinner', label: 'Dinner' },
  { key: 'Snack', label: 'Snacks' },
];

const LONG_PRESS_MS = 300;
const TAP_THRESHOLD_PX = 8;

function preventTouchScroll(e) { e.preventDefault(); }

function detectMeal(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    const row = el.closest('[data-meal]');
    if (row) return row.dataset.meal;
  }
  return null;
}

export default function Today() {
  const { state, dispatch } = useApp();
  const { todayEntries, caloriesBurned } = useDailyEntries();
  const { kcal: effectiveKcal, protein: effectiveProtein, carbs: effectiveCarbs, fat: effectiveFat } = useEffectiveTargets();
  const macroFlags = hasMacroTargets(state.targets);
  const [activeTab, setActiveTab] = useState('food');

  // FAB menu
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Recently eaten items (last 3 days, deduplicated by name, up to 10)
  const recentEntries = useMemo(() => {
    const today = getToday();
    const d1 = new Date(); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(); d3.setDate(d3.getDate() - 3);
    const recentKeys = new Set([formatDateKey(d1), formatDateKey(d2), formatDateKey(d3)]);

    const past = (state.entries || [])
      .filter((e) => recentKeys.has(e.dateKey) && e.dateKey !== today)
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
  }, [state.entries]);

  // Drag-and-drop state (sections + entry reorder)
  const [dragItem, setDragItem] = useState(null);
  const [dragEntryId, setDragEntryId] = useState(null);
  const [dragOverMeal, setDragOverMeal] = useState(null);

  // Drag refs
  const dragRef = useRef(null);
  const docRef = useRef(null);
  const dropRef = useRef(null);

  const removeGhost = useCallback(() => {
    const el = document.querySelector('.qmr-ghost');
    if (el) el.remove();
  }, []);

  const cleanupAll = useCallback(() => {
    if (dragRef.current?.timerId) clearTimeout(dragRef.current.timerId);
    dragRef.current = null;
    removeGhost();
    if (docRef.current) {
      document.removeEventListener('pointermove', docRef.current.move);
      document.removeEventListener('pointerup', docRef.current.up);
      document.removeEventListener('pointercancel', docRef.current.cancel);
      document.removeEventListener('touchmove', preventTouchScroll);
      docRef.current = null;
    }
  }, [removeGhost]);

  useEffect(() => cleanupAll, [cleanupAll]);

  const handlePointerDown = useCallback((e, item, cardEl) => {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;

    const timerId = setTimeout(() => {
      if (!dragRef.current) return;
      dragRef.current.isDragging = true;
      dragRef.current.item = item;
      setDragItem(item);
      if (navigator.vibrate) navigator.vibrate(30);

      const ghost = cardEl.cloneNode(true);
      ghost.className = 'qmr-ghost';
      const rect = cardEl.getBoundingClientRect();
      ghost.style.width = rect.width + 'px';
      ghost.style.left = (startX - rect.width / 2) + 'px';
      ghost.style.top = (startY - rect.height / 2) + 'px';
      document.body.appendChild(ghost);
      dragRef.current.ghost = ghost;

      const docMove = (ev) => {
        ev.preventDefault();
        const d = dragRef.current;
        if (!d?.ghost) return;
        const w = parseFloat(d.ghost.style.width);
        const h = d.ghost.getBoundingClientRect().height;
        d.ghost.style.left = (ev.clientX - w / 2) + 'px';
        d.ghost.style.top = (ev.clientY - h / 2) + 'px';
        setDragOverMeal(detectMeal(ev.clientX, ev.clientY));
      };

      const docUp = (ev) => {
        const droppedItem = dragRef.current?.item;
        const meal = detectMeal(ev.clientX, ev.clientY);
        cleanupAll();
        if (meal && droppedItem) {
          dropRef.current(droppedItem, meal);
        } else {
          setDragItem(null);
          setDragOverMeal(null);
        }
      };

      const docCancel = () => {
        cleanupAll();
        setDragItem(null);
        setDragOverMeal(null);
      };

      docRef.current = { move: docMove, up: docUp, cancel: docCancel };
      document.addEventListener('pointermove', docMove);
      document.addEventListener('pointerup', docUp);
      document.addEventListener('pointercancel', docCancel);
      document.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }, LONG_PRESS_MS);

    dragRef.current = { startX, startY, timerId, isDragging: false, ghost: null, item };
  }, [cleanupAll]);

  const handlePointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > TAP_THRESHOLD_PX || Math.abs(dy) > TAP_THRESHOLD_PX) {
      clearTimeout(d.timerId);
      dragRef.current = null;
    }
  }, []);

  const handlePointerUp = useCallback((e, onSelect) => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    clearTimeout(d.timerId);
    const item = d.item;
    dragRef.current = null;
    if (Math.abs(dx) < TAP_THRESHOLD_PX && Math.abs(dy) < TAP_THRESHOLD_PX) {
      onSelect(item);
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    clearTimeout(d.timerId);
    dragRef.current = null;
  }, []);

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

  // --- Food search handler ---

  function handleFoodSearchSelect(food) {
    if (food.isCustomMeal && food.ingredients) {
      // Custom meal with ingredients → confirm step
      setCustomDraft({
        name: food.name,
        kcal: food.serving.kcal,
        protein: food.serving.protein,
        carbs: food.serving.carbs || 0,
        fat: food.serving.fat || 0,
        ingredients: food.ingredients,
        servingsYield: 1,
        servingsConsumed: 1,
        mealSlot: getDefaultMeal(),
      });
      setCustomStep('confirm');
      return;
    }
    if (food.isLeftover) {
      setCustomDraft({
        name: food.name,
        kcal: food.serving.kcal,
        protein: food.serving.protein,
        carbs: food.serving.carbs || 0,
        fat: food.serving.fat || 0,
        servingsYield: food.remainingServings,
        servingsConsumed: 1,
        mealSlot: getDefaultMeal(),
        isLeftover: true,
        leftover: (state.leftovers || []).find((l) => l.id === food.leftoverId),
      });
      setCustomStep('confirm');
      return;
    }
    // Regular food / recent → confirm step
    setCustomDraft({
      name: food.name,
      kcal: food.serving.kcal,
      protein: food.serving.protein,
      carbs: food.serving.carbs || 0,
      fat: food.serving.fat || 0,
      ingredients: food.ingredients,
      servingsYield: 1,
      servingsConsumed: 1,
      mealSlot: getDefaultMeal(),
    });
    setCustomStep('confirm');
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

  // --- Drop handler (drag-and-drop) ---

  function handleDrop(item, mealKey) {
    if (!item || !mealKey) return;

    if (item.type === 'leftover') {
      // Leftovers → open confirm step with meal pre-set
      setCustomDraft({
        name: item.name,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
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
          protein: Math.round(item.protein),
          carbs: Math.round(item.carbs || 0),
          fat: Math.round(item.fat || 0),
          meal: mealKey,
          servingSize: 1,
          servingUnit: 'serving',
          timestamp: Date.now(),
          dateKey: getToday(),
          ...(item.ingredients ? { ingredients: item.ingredients } : {}),
        },
      });
      incrementMealUseCount(item.name);
    }
    setDragItem(null);
    setDragOverMeal(null);
  }
  useEffect(() => { dropRef.current = handleDrop; });

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
    const { name, kcal, protein, carbs: draftCarbs, fat: draftFat, ingredients, servingsYield, servingsConsumed, mealSlot } = customDraft;
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
        {customStep === 'direct' && (
          <div className="add-mode-view">
            <div className="add-mode-header">
              <button className="add-mode-back" onClick={navigateBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <span className="add-mode-title">Log Meal</span>
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
              <span className="daily-summary-item" style={{ color: 'var(--color-kcal)' }}><span className="daily-summary-value">{Math.round(dailyTotals.kcal)}</span> / {calTarget} cal</span>
              <span className="daily-summary-sep" />
              <span className="daily-summary-item" style={{ color: 'var(--color-protein)' }}><span className="daily-summary-value">{Math.round(dailyTotals.protein)}</span> / {protTarget}g P</span>
              {macroFlags.showCarbs && <>
                <span className="daily-summary-sep" />
                <span className="daily-summary-item" style={{ color: 'var(--color-carbs)' }}><span className="daily-summary-value">{Math.round(dailyTotals.carbs)}</span> / {effectiveCarbs}g C</span>
              </>}
              {macroFlags.showFat && <>
                <span className="daily-summary-sep" />
                <span className="daily-summary-item" style={{ color: 'var(--color-fat)' }}><span className="daily-summary-value">{Math.round(dailyTotals.fat)}</span> / {effectiveFat}g F</span>
              </>}
            </div>

            {/* Inline food search */}
            <FoodSearch onSelect={handleFoodSearchSelect} />

            {/* My Saved Meals section — hidden when empty */}
            {(() => {
              const customMeals = state.customMeals || [];
              const mealItems = customMeals
                .map((m, i) => ({
                  type: 'meal',
                  id: m.id || `meal-${i}`,
                  name: m.name,
                  kcal: m.kcal,
                  protein: m.protein,
                  carbs: m.carbs || 0,
                  fat: m.fat || 0,
                  ingredients: m.ingredients,
                  useCount: m.useCount || 0,
                }))
                .sort((a, b) => b.useCount - a.useCount);
              if (mealItems.length === 0) return null;
              return (
                <div className="dl-section">
                  <div className="dl-section-header">
                    <span className="dl-section-title">My Saved Meals</span>
                    {dragItem && <span className="dl-drag-hint">Drop on a meal below</span>}
                  </div>
                  <ScrollStrip className="dl-section-scroll">
                    {mealItems.map((item) => (
                      <button
                        key={item.id}
                        className={[
                          'dl-card dl-card--meal',
                          dragItem?.id === item.id && 'dl-card--dragging',
                        ].filter(Boolean).join(' ')}
                        onPointerDown={(e) => handlePointerDown(e, item, e.currentTarget)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={(e) => handlePointerUp(e, handleQuickAddSelect)}
                        onPointerCancel={handlePointerCancel}
                        style={{ touchAction: 'pan-x' }}
                      >
                        <span className="dl-card-emoji">{getEmoji(item.name)}</span>
                        <span className="dl-card-name">{item.name}</span>
                        <span className="dl-card-meta">{Math.round(item.kcal)} cal · {Math.round(item.protein)}g</span>
                      </button>
                    ))}
                  </ScrollStrip>
                </div>
              );
            })()}

            {/* My Kitchen section — hidden when empty */}
            {(() => {
              const kitchenItems = (state.leftovers || [])
                .filter((l) => l.remainingServings > 0)
                .map((l) => ({
                  type: 'leftover',
                  id: l.id,
                  name: l.name,
                  kcal: l.perServing.kcal,
                  protein: l.perServing.protein,
                  carbs: l.perServing.carbs || 0,
                  fat: l.perServing.fat || 0,
                  remaining: l.remainingServings,
                  leftover: l,
                }));
              if (kitchenItems.length === 0) return null;
              return (
                <div className="dl-section">
                  <div className="dl-section-header">
                    <span className="dl-section-title">My Kitchen</span>
                    {dragItem && <span className="dl-drag-hint">Drop on a meal below</span>}
                  </div>
                  <ScrollStrip className="dl-section-scroll">
                    {kitchenItems.map((item) => (
                      <div key={item.id} className="dl-card-wrap">
                        <button
                          className={[
                            'dl-card dl-card--kitchen',
                            dragItem?.id === item.id && 'dl-card--dragging',
                          ].filter(Boolean).join(' ')}
                          onPointerDown={(e) => handlePointerDown(e, item, e.currentTarget.closest('.dl-card-wrap').querySelector('.dl-card'))}
                          onPointerMove={handlePointerMove}
                          onPointerUp={(e) => handlePointerUp(e, handleQuickAddSelect)}
                          onPointerCancel={handlePointerCancel}
                          style={{ touchAction: 'pan-x' }}
                        >
                          <span className="dl-card-emoji">{getEmoji(item.name)}</span>
                          <span className="dl-card-name">{item.name}</span>
                          <span className="dl-card-tag">{item.remaining} left · {Math.round(item.kcal)} cal</span>
                        </button>
                        <button
                          className="dl-card-discard"
                          onClick={() => dispatch({ type: 'DELETE_LEFTOVER', payload: item.id })}
                          aria-label="Discard"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </div>
                    ))}
                  </ScrollStrip>
                </div>
              );
            })()}

            {/* Recently Eaten section — hidden when empty */}
            {recentEntries.length > 0 && (
              <div className="dl-section">
                <div className="dl-section-header">
                  <span className="dl-section-title">Recently Eaten</span>
                  {dragItem && <span className="dl-drag-hint">Drop on a meal below</span>}
                </div>
                <ScrollStrip className="dl-section-scroll">
                  {recentEntries.map((item) => (
                    <button
                      key={item.id}
                      className={[
                        'dl-card dl-card--recent',
                        dragItem?.id === item.id && 'dl-card--dragging',
                      ].filter(Boolean).join(' ')}
                      onPointerDown={(e) => handlePointerDown(e, item, e.currentTarget)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={(e) => handlePointerUp(e, handleQuickAddSelect)}
                      onPointerCancel={handlePointerCancel}
                      style={{ touchAction: 'pan-x' }}
                    >
                      <span className="dl-card-emoji">{getEmoji(item.name)}</span>
                      <span className="dl-card-name">{item.name}</span>
                      <span className="dl-card-meta">{Math.round(item.kcal)} cal · {Math.round(item.protein)}g</span>
                    </button>
                  ))}
                </ScrollStrip>
              </div>
            )}

            {/* Today's Log */}
            <div className="meals-section-header">Today&apos;s Log</div>
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
                        <span className="meal-totals-compact">
                          {Math.round(totals.kcal)} cal · {Math.round(totals.protein)}g
                          {macroFlags.showCarbs && totals.carbs > 0 ? ` · C ${Math.round(totals.carbs)}g` : ''}
                          {macroFlags.showFat && totals.fat > 0 ? ` · F ${Math.round(totals.fat)}g` : ''}
                        </span>
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
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}


      {/* Exercise tab */}
      {activeTab === 'exercise' && <ExercisePanel />}

      {/* Floating action button + menu */}
      {activeTab === 'food' && (
        <>
          {showFabMenu && <div className="fab-overlay" onClick={() => setShowFabMenu(false)} />}
          <div className="fab-wrap">
            {showFabMenu && (
              <div className="fab-menu">
                <button className="fab-menu-item" onClick={() => { setShowFabMenu(false); setCustomDraft({ mealSlot: getDefaultMeal(), name: '', kcal: '', protein: '', saveToMyMeals: true }); setCustomStep('direct'); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Log Meal
                </button>
                <button className="fab-menu-item" onClick={() => { setShowFabMenu(false); setCustomDraft({ mealSlot: getDefaultMeal() }); setCustomStep('list'); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3m0 0v7"/></svg>
                  Cook
                </button>
              </div>
            )}
            <button
              className={`fab${showFabMenu ? ' fab--open' : ''}`}
              onClick={() => setShowFabMenu(!showFabMenu)}
              aria-label="Add"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
