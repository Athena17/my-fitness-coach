import { useReducer, useEffect } from 'react';
import { loadTargets, saveTargets, loadEntries, saveEntries, loadExerciseLogs, saveExerciseLogs, loadWaterLogs, saveWaterLogs, loadRecipes, saveRecipes, loadLeftovers, saveLeftovers, runMigrations } from '../utils/storage.js';
import { VIEWS } from './constants.js';
import { AppContext } from './context.js';

function init() {
  runMigrations();
  return {
    targets: loadTargets(),
    entries: loadEntries(),
    exerciseLogs: loadExerciseLogs(),
    waterLogs: loadWaterLogs(),
    recipes: loadRecipes(),
    leftovers: loadLeftovers(),
    currentView: VIEWS.DASHBOARD,
    editingEntry: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
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
  const [state, dispatch] = useReducer(reducer, null, init);

  useEffect(() => {
    saveTargets(state.targets);
  }, [state.targets]);

  useEffect(() => {
    saveEntries(state.entries);
  }, [state.entries]);

  useEffect(() => {
    saveExerciseLogs(state.exerciseLogs);
  }, [state.exerciseLogs]);

  useEffect(() => {
    saveWaterLogs(state.waterLogs);
  }, [state.waterLogs]);

  useEffect(() => {
    saveRecipes(state.recipes);
  }, [state.recipes]);

  useEffect(() => {
    saveLeftovers(state.leftovers);
  }, [state.leftovers]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
