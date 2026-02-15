import { useReducer, useEffect } from 'react';
import { loadTargets, saveTargets, loadEntries, saveEntries, runMigrations } from '../utils/storage.js';
import { VIEWS } from './constants.js';
import { AppContext } from './context.js';

function init() {
  runMigrations();
  return {
    targets: loadTargets(),
    entries: loadEntries(),
    currentView: VIEWS.TODAY,
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

    case 'IMPORT_DATA':
      return {
        ...state,
        targets: action.payload.targets,
        entries: action.payload.entries,
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

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
