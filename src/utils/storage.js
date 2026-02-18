const SCHEMA_KEY = 'nt_schema_version';
const TARGETS_KEY = 'nt_targets';
const ENTRIES_KEY = 'nt_entries';
const EXERCISE_LOGS_KEY = 'nt_exercise_logs';
const WATER_LOGS_KEY = 'nt_water_logs';
const CUSTOM_MEALS_KEY = 'nt_custom_meals';
const RECIPES_KEY = 'nt_recipes';
const LEFTOVERS_KEY = 'nt_leftovers';
const PERSONAL_INGREDIENTS_KEY = 'nt_personal_ingredients';
const CURRENT_SCHEMA = 3;

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export function runMigrations() {
  const version = safeGet(SCHEMA_KEY) || 0;
  if (version < 2) {
    // v2: remove servingLabel, add maintenanceKcal, lock servingUnit to 'g'
    const entries = safeGet(ENTRIES_KEY) || [];
    const migrated = entries.map((e) => {
      const { servingLabel: _SL, carbs: _C, fat: _F, ...rest } = e;
      return { ...rest, servingUnit: 'g' };
    });
    safeSet(ENTRIES_KEY, migrated);

    const targets = safeGet(TARGETS_KEY);
    if (targets && !targets.maintenanceKcal) {
      targets.maintenanceKcal = targets.kcal || 2000;
      safeSet(TARGETS_KEY, targets);
    }
  }
  if (version < 3) {
    // v3: add userName and weightLossTarget
    const targets = safeGet(TARGETS_KEY);
    if (targets) {
      if (!targets.userName) targets.userName = '';
      if (!targets.weightLossTarget) targets.weightLossTarget = 5;
      safeSet(TARGETS_KEY, targets);
    }
  }
  if (version < CURRENT_SCHEMA) {
    safeSet(SCHEMA_KEY, CURRENT_SCHEMA);
  }
}

export function loadTargets() {
  return safeGet(TARGETS_KEY) || { kcal: 2000, protein: 120, maintenanceKcal: 2000, userName: '', weightLossTarget: 5, onboardingComplete: false };
}

export function saveTargets(targets) {
  safeSet(TARGETS_KEY, targets);
}

export function loadEntries() {
  return safeGet(ENTRIES_KEY) || [];
}

export function saveEntries(entries) {
  safeSet(ENTRIES_KEY, entries);
}

export function loadExerciseLogs() {
  return safeGet(EXERCISE_LOGS_KEY) || [];
}

export function saveExerciseLogs(logs) {
  safeSet(EXERCISE_LOGS_KEY, logs);
}

export function loadWaterLogs() {
  return safeGet(WATER_LOGS_KEY) || [];
}

export function saveWaterLogs(logs) {
  safeSet(WATER_LOGS_KEY, logs);
}

export function loadCustomMeals() {
  return safeGet(CUSTOM_MEALS_KEY) || [];
}

export function saveCustomMeals(meals) {
  safeSet(CUSTOM_MEALS_KEY, meals);
}

export function loadRecipes() {
  return safeGet(RECIPES_KEY) || [];
}

export function saveRecipes(recipes) {
  safeSet(RECIPES_KEY, recipes);
}

export function loadLeftovers() {
  return safeGet(LEFTOVERS_KEY) || [];
}

export function saveLeftovers(leftovers) {
  safeSet(LEFTOVERS_KEY, leftovers);
}

export function loadPersonalIngredients() {
  return safeGet(PERSONAL_INGREDIENTS_KEY) || [];
}

export function savePersonalIngredients(list) {
  safeSet(PERSONAL_INGREDIENTS_KEY, list);
}

export function clearAllData() {
  try {
    localStorage.removeItem(TARGETS_KEY);
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(EXERCISE_LOGS_KEY);
    localStorage.removeItem(WATER_LOGS_KEY);
    localStorage.removeItem(CUSTOM_MEALS_KEY);
    localStorage.removeItem(RECIPES_KEY);
    localStorage.removeItem(LEFTOVERS_KEY);
    localStorage.removeItem(PERSONAL_INGREDIENTS_KEY);
    localStorage.removeItem(SCHEMA_KEY);
  } catch (e) {
    console.error('Failed to clear data:', e);
  }
}

export function exportData() {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA,
    targets: loadTargets(),
    entries: loadEntries(),
    recipes: loadRecipes(),
    leftovers: loadLeftovers(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importData(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.targets || !Array.isArray(data.entries)) {
    throw new Error('Invalid data format');
  }
  safeSet(TARGETS_KEY, data.targets);
  safeSet(ENTRIES_KEY, data.entries);
  if (Array.isArray(data.recipes)) safeSet(RECIPES_KEY, data.recipes);
  if (Array.isArray(data.leftovers)) safeSet(LEFTOVERS_KEY, data.leftovers);
  safeSet(SCHEMA_KEY, data.schemaVersion || CURRENT_SCHEMA);
  return {
    targets: data.targets,
    entries: data.entries,
    recipes: data.recipes || [],
    leftovers: data.leftovers || [],
  };
}
