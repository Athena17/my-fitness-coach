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
} from '../utils/api.js';

const DEFAULT_TARGETS = {
  kcal: 2000,
  protein: 120,
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
    dayTypes: {},
    currentView: VIEWS.DASHBOARD,
    editingEntry: null,
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

  // Load data from Supabase when user becomes available
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [profile, entries, exerciseLogs, waterLogs, recipes, leftovers, customMeals, dayTypes] = await Promise.all([
        fetchProfile(user.id),
        fetchEntries(user.id),
        fetchExerciseLogs(user.id),
        fetchWaterLogs(user.id),
        fetchRecipes(user.id),
        fetchLeftovers(user.id),
        fetchCustomMeals(user.id),
        fetchDayTypes(user.id),
      ]);
      if (cancelled) return;
      rawDispatch({
        type: 'INIT_DATA',
        payload: { targets: profile || DEFAULT_TARGETS, entries, exerciseLogs, waterLogs, recipes, leftovers, customMeals, dayTypes },
      });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Dispatch wrapper that persists to Supabase
  const dispatch = useCallback((action) => {
    if (!user) {
      rawDispatch(action);
      return;
    }

    switch (action.type) {
      case 'SET_TARGETS': {
        rawDispatch(action);
        clearTimeout(profileTimerRef.current);
        profileTimerRef.current = setTimeout(() => {
          upsertProfile(user.id, stateRef.current.targets);
        }, 500);
        break;
      }

      case 'ADD_ENTRY': {
        rawDispatch(action);
        insertEntry(user.id, action.payload);
        break;
      }
      case 'UPDATE_ENTRY': {
        rawDispatch(action);
        updateEntry(action.payload);
        break;
      }
      case 'DELETE_ENTRY': {
        rawDispatch(action);
        deleteEntry(action.payload);
        break;
      }

      case 'ADD_EXERCISE': {
        rawDispatch(action);
        insertExerciseLog(user.id, action.payload);
        break;
      }
      case 'DELETE_EXERCISE': {
        rawDispatch(action);
        deleteExerciseLog(action.payload);
        break;
      }

      case 'ADD_WATER': {
        rawDispatch(action);
        insertWaterLog(user.id, action.payload);
        break;
      }
      case 'DELETE_WATER': {
        rawDispatch(action);
        deleteWaterLog(action.payload);
        break;
      }

      case 'ADD_RECIPE': {
        rawDispatch(action);
        apiInsertRecipe(user.id, action.payload);
        break;
      }
      case 'UPDATE_RECIPE': {
        rawDispatch(action);
        apiUpdateRecipe(action.payload);
        break;
      }
      case 'DELETE_RECIPE': {
        rawDispatch(action);
        apiDeleteRecipe(action.payload);
        break;
      }

      case 'ADD_LEFTOVER': {
        rawDispatch(action);
        apiInsertLeftover(user.id, action.payload);
        break;
      }
      case 'UPDATE_LEFTOVER': {
        rawDispatch(action);
        apiUpdateLeftover(action.payload);
        break;
      }
      case 'DELETE_LEFTOVER': {
        rawDispatch(action);
        apiDeleteLeftover(action.payload);
        break;
      }

      case 'ADD_CUSTOM_MEAL': {
        rawDispatch(action);
        apiInsertCustomMeal(user.id, action.payload);
        break;
      }
      case 'UPDATE_CUSTOM_MEAL': {
        rawDispatch(action);
        apiUpdateCustomMeal(action.payload);
        break;
      }
      case 'DELETE_CUSTOM_MEAL': {
        rawDispatch(action);
        apiDeleteCustomMeal(action.payload);
        break;
      }

      case 'SET_DAY_TYPE': {
        rawDispatch(action);
        upsertDayType(user.id, action.payload.dateKey, action.payload.dayType);
        break;
      }

      default:
        rawDispatch(action);
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </AppContext.Provider>
  );
}
