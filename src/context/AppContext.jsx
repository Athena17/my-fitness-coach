import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { VIEWS } from './constants.js';
import { AppContext } from './context.js';
import { useAuth } from './useAuth.js';
import {
  fetchProfile, upsertProfile,
  fetchEntries, insertEntry, updateEntry, deleteEntry,
  fetchExerciseLogs, insertExerciseLog, deleteExerciseLog,
  fetchWaterLogs, insertWaterLog, deleteWaterLog,
  fetchRecipes, insertRecipe as apiInsertRecipe, updateRecipe as apiUpdateRecipe, deleteRecipe as apiDeleteRecipe,
  fetchLeftovers, insertLeftover as apiInsertLeftover, updateLeftover as apiUpdateLeftover, deleteLeftover as apiDeleteLeftover,
  fetchCustomMeals, insertCustomMeal as apiInsertCustomMeal, updateCustomMeal as apiUpdateCustomMeal, deleteCustomMeal as apiDeleteCustomMeal,
  fetchDayTypes, upsertDayType,
  fetchPersonalIngredients, insertPersonalIngredient as apiInsertPersonalIng, updatePersonalIngredient as apiUpdatePersonalIng, deletePersonalIngredient as apiDeletePersonalIng,
} from '../utils/api.js';
import { enqueue, getQueue, clearQueue, isOnline } from '../utils/offlineQueue.js';

// Maps mutation type → API function. Used for offline queue replay.
const API_MAP = {
  SET_TARGETS: (uid, p) => upsertProfile(uid, p.targets),
  ADD_ENTRY: (uid, p) => insertEntry(uid, p),
  UPDATE_ENTRY: (_uid, p) => updateEntry(p),
  DELETE_ENTRY: (_uid, p) => deleteEntry(p),
  ADD_EXERCISE: (uid, p) => insertExerciseLog(uid, p),
  DELETE_EXERCISE: (_uid, p) => deleteExerciseLog(p),
  ADD_WATER: (uid, p) => insertWaterLog(uid, p),
  DELETE_WATER: (_uid, p) => deleteWaterLog(p),
  ADD_RECIPE: (uid, p) => apiInsertRecipe(uid, p),
  UPDATE_RECIPE: (_uid, p) => apiUpdateRecipe(p),
  DELETE_RECIPE: (_uid, p) => apiDeleteRecipe(p),
  ADD_LEFTOVER: (uid, p) => apiInsertLeftover(uid, p),
  UPDATE_LEFTOVER: (_uid, p) => apiUpdateLeftover(p),
  DELETE_LEFTOVER: (_uid, p) => apiDeleteLeftover(p),
  ADD_CUSTOM_MEAL: (uid, p) => apiInsertCustomMeal(uid, p),
  UPDATE_CUSTOM_MEAL: (_uid, p) => apiUpdateCustomMeal(p),
  DELETE_CUSTOM_MEAL: (_uid, p) => apiDeleteCustomMeal(p),
  SET_DAY_TYPE: (uid, p) => upsertDayType(uid, p.dateKey, p.dayType),
  ADD_PERSONAL_INGREDIENT: (uid, p) => apiInsertPersonalIng(uid, p, 0),
  UPDATE_PERSONAL_INGREDIENT: (_uid, p) => apiUpdatePersonalIng(p),
  DELETE_PERSONAL_INGREDIENT: (_uid, p) => apiDeletePersonalIng(p),
};

/** Try an API call; if offline or network error, enqueue for later */
function tryApi(type, userId, payload) {
  if (!isOnline()) {
    enqueue({ type, userId, payload });
    return;
  }
  const fn = API_MAP[type];
  if (!fn) return;
  fn(userId, payload).catch(() => {
    // Network error while technically "online" — enqueue
    enqueue({ type, userId, payload });
  });
}

/** Replay all queued mutations sequentially */
async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;
  clearQueue(); // clear first so re-enqueue on failure doesn't loop
  for (const item of queue) {
    const fn = API_MAP[item.type];
    if (!fn) continue;
    try {
      await fn(item.userId, item.payload);
    } catch {
      // If still failing, re-enqueue remaining items
      enqueue(item);
    }
  }
}

const DEFAULT_TARGETS = {
  kcal: 2000,
  protein: 120,
  carbs: 0,
  fat: 0,
  maintenanceKcal: 2000,
  userName: '',
  weightLossTarget: 5,
  onboardingComplete: false,
};

function init() {
  return {
    targets: DEFAULT_TARGETS,
    entries: [],
    exerciseLogs: [],
    waterLogs: [],
    recipes: [],
    leftovers: [],
    customMeals: [],
    personalIngredients: [],
    dayTypes: {},
    currentView: VIEWS.DASHBOARD,
    editingEntry: null,
    mealDraft: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_DATA':
      return {
        ...state,
        targets: action.payload.targets || DEFAULT_TARGETS,
        entries: action.payload.entries || [],
        exerciseLogs: action.payload.exerciseLogs || [],
        waterLogs: action.payload.waterLogs || [],
        recipes: action.payload.recipes || [],
        leftovers: action.payload.leftovers || [],
        customMeals: action.payload.customMeals || [],
        personalIngredients: action.payload.personalIngredients || [],
        dayTypes: action.payload.dayTypes || {},
        currentView: VIEWS.DASHBOARD,
        editingEntry: null,
      };

    case 'SET_TARGETS':
      return { ...state, targets: { ...state.targets, ...action.payload } };

    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };

    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };

    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
      };

    case 'SET_VIEW':
      return { ...state, currentView: action.payload, editingEntry: null };

    case 'SET_EDITING_ENTRY':
      return { ...state, editingEntry: action.payload };

    case 'SET_MEAL_DRAFT':
      return { ...state, mealDraft: action.payload };

    case 'CLEAR_MEAL_DRAFT':
      return { ...state, mealDraft: null };

    case 'ADD_EXERCISE':
      return { ...state, exerciseLogs: [...state.exerciseLogs, action.payload] };

    case 'DELETE_EXERCISE':
      return {
        ...state,
        exerciseLogs: state.exerciseLogs.filter((e) => e.id !== action.payload),
      };

    case 'ADD_WATER':
      return { ...state, waterLogs: [...state.waterLogs, action.payload] };

    case 'DELETE_WATER':
      return {
        ...state,
        waterLogs: state.waterLogs.filter((e) => e.id !== action.payload),
      };

    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };

    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };

    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter((r) => r.id !== action.payload),
      };

    case 'ADD_LEFTOVER':
      return { ...state, leftovers: [...state.leftovers, action.payload] };

    case 'UPDATE_LEFTOVER':
      return {
        ...state,
        leftovers: state.leftovers.map((l) => (l.id === action.payload.id ? action.payload : l)),
      };

    case 'DELETE_LEFTOVER':
      return {
        ...state,
        leftovers: state.leftovers.filter((l) => l.id !== action.payload),
      };

    case 'SET_CUSTOM_MEALS':
      return { ...state, customMeals: action.payload };

    case 'ADD_CUSTOM_MEAL':
      return { ...state, customMeals: [action.payload, ...state.customMeals] };

    case 'UPDATE_CUSTOM_MEAL':
      return {
        ...state,
        customMeals: state.customMeals.map((m) => (m.id === action.payload.id ? action.payload : m)),
      };

    case 'DELETE_CUSTOM_MEAL':
      return {
        ...state,
        customMeals: state.customMeals.filter((m) => m.id !== action.payload),
      };

    case 'SET_PERSONAL_INGREDIENTS':
      return { ...state, personalIngredients: action.payload };

    case 'ADD_PERSONAL_INGREDIENT':
      return { ...state, personalIngredients: [action.payload, ...state.personalIngredients] };

    case 'UPDATE_PERSONAL_INGREDIENT':
      return {
        ...state,
        personalIngredients: state.personalIngredients.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };

    case 'DELETE_PERSONAL_INGREDIENT':
      return {
        ...state,
        personalIngredients: state.personalIngredients.filter((i) => i.id !== action.payload),
      };

    case 'SET_DAY_TYPE':
      return {
        ...state,
        dayTypes: { ...state.dayTypes, [action.payload.dateKey]: action.payload.dayType },
      };

    case 'IMPORT_DATA':
      return {
        ...state,
        targets: action.payload.targets,
        entries: action.payload.entries,
        recipes: action.payload.recipes || state.recipes,
        leftovers: action.payload.leftovers || state.leftovers,
      };

    case 'CLEAR_DATA':
      return {
        ...state,
        entries: [],
        exerciseLogs: [],
        waterLogs: [],
        recipes: [],
        leftovers: [],
        customMeals: [],
        personalIngredients: [],
        dayTypes: {},
      };

    case 'DELETE_ACCOUNT_DATA':
      return {
        ...init(),
        currentView: state.currentView,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [state, rawDispatch] = useReducer(reducer, null, init);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef(state);
  const profileTimerRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  });

  // Keep localStorage cache in sync with state (debounced)
  const cacheTimerRef = useRef(null);
  useEffect(() => {
    const uid = user?.id;
    if (!uid || loading) return;
    clearTimeout(cacheTimerRef.current);
    cacheTimerRef.current = setTimeout(() => {
      try {
        const { targets, entries, exerciseLogs, waterLogs, recipes, leftovers, customMeals, personalIngredients, dayTypes } = stateRef.current;
        localStorage.setItem(`nt_data_cache_${uid}`, JSON.stringify({ targets, entries, exerciseLogs, waterLogs, recipes, leftovers, customMeals, personalIngredients, dayTypes }));
      } catch { /* quota */ }
    }, 1000);
    return () => clearTimeout(cacheTimerRef.current);
  }, [state, user, loading]);

  // Load data from Supabase when user becomes available
  const userIdRef = useRef(undefined); // undefined so first null check doesn't skip
  const fetchIdRef = useRef(0); // tracks which fetch is current
  useEffect(() => {
    // Same user — skip re-fetch (avoids Supabase auth firing multiple events)
    const uid = user?.id ?? null;
    if (uid === userIdRef.current) return;
    userIdRef.current = uid;

    const fetchId = ++fetchIdRef.current;

    (async () => {
      if (!uid) {
        rawDispatch({ type: 'INIT_DATA', payload: {} });
        setLoading(false);
        return;
      }

      // Try to show cached data instantly while Supabase loads
      const cacheKey = `nt_data_cache_${uid}`;
      let usedCache = false;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          rawDispatch({ type: 'INIT_DATA', payload: { ...parsed, targets: parsed.targets || DEFAULT_TARGETS } });
          setLoading(false);
          usedCache = true;
        }
      } catch { /* ignore cache errors */ }

      if (!usedCache) setLoading(true);

      try {
        const dataPromise = Promise.all([
          fetchProfile(uid),
          fetchEntries(uid),
          fetchExerciseLogs(uid),
          fetchWaterLogs(uid),
          fetchRecipes(uid),
          fetchLeftovers(uid),
          fetchCustomMeals(uid),
          fetchDayTypes(uid),
          fetchPersonalIngredients(uid),
        ]);
        const timeoutPromise = new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('Data load timeout')), 15000)
        );
        const [profile, entries, exerciseLogs, waterLogs, recipes, leftovers, customMeals, dayTypes, personalIngredients] = await Promise.race([dataPromise, timeoutPromise]);
        if (fetchId !== fetchIdRef.current) return;
        const payload = { targets: profile || DEFAULT_TARGETS, entries, exerciseLogs, waterLogs, recipes, leftovers, customMeals, personalIngredients, dayTypes };
        rawDispatch({ type: 'INIT_DATA', payload });
        // Update cache for next load
        try { localStorage.setItem(cacheKey, JSON.stringify(payload)); } catch { /* quota */ }
      } catch (err) {
        console.error('Data load failed:', err);
        if (fetchId !== fetchIdRef.current) return;
        if (!usedCache) rawDispatch({ type: 'INIT_DATA', payload: { targets: DEFAULT_TARGETS } });
      } finally {
        if (fetchId === fetchIdRef.current) setLoading(false);
      }
    })();
  }, [user]);

  // Flush offline queue when we come back online
  useEffect(() => {
    function handleOnline() { flushQueue(); }
    window.addEventListener('online', handleOnline);
    // Also flush on mount in case we loaded while online with a stale queue
    flushQueue();
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Dispatch wrapper that persists to Supabase (with offline queue fallback)
  const dispatch = useCallback((action) => {
    rawDispatch(action);

    if (!user) return;

    const { type, payload } = action;

    // SET_TARGETS is debounced
    if (type === 'SET_TARGETS') {
      clearTimeout(profileTimerRef.current);
      profileTimerRef.current = setTimeout(() => {
        tryApi('SET_TARGETS', user.id, { targets: stateRef.current.targets });
      }, 500);
      return;
    }

    // These are handled externally (Profile.jsx calls API directly)
    if (type === 'CLEAR_DATA' || type === 'DELETE_ACCOUNT_DATA') return;

    // All other mutation types — try API with offline fallback
    if (API_MAP[type]) {
      tryApi(type, user.id, payload);
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </AppContext.Provider>
  );
}
