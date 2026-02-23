import { supabase } from './supabase.js';

// ─── Timestamp helpers ───────────────────────────────
// App uses Date.now() (milliseconds number), Supabase uses ISO 8601 string (TIMESTAMPTZ)
function toISOTimestamp(ts) {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return ts; // already a string
}

function toMsTimestamp(ts) {
  if (!ts) return Date.now();
  if (typeof ts === 'string') return new Date(ts).getTime();
  return ts; // already a number
}

// ─── Profiles ─────────────────────────────────────────

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('fetchProfile:', error); return null; }
  return profileToApp(data);
}

export async function upsertProfile(userId, profile) {
  const row = profileToDB(userId, profile);
  const { error } = await supabase.from('profiles').upsert(row);
  if (error) console.error('upsertProfile:', error);
}

function profileToApp(row) {
  if (!row) return null;
  return {
    kcal: row.calorie_target,
    protein: row.protein_target,
    maintenanceKcal: row.maintenance_kcal,
    userName: row.user_name,
    weightLossTarget: row.weight_loss_target,
    onboardingComplete: row.onboarding_complete,
    age: row.age,
    sex: row.sex,
    height: row.height,
    weight: row.weight,
    activityLevel: row.activity_level,
    goal: row.goal,
    intensity: row.intensity,
    waterTargetLiters: row.water_target_liters,
    carbs: row.carbs_target ?? 0,
    fat: row.fat_target ?? 0,
    cyclingEnabled: row.cycling_enabled ?? false,
    cyclingTrainingKcal: row.cycling_training_kcal ?? 0,
    cyclingTrainingProtein: row.cycling_training_protein ?? 0,
    cyclingTrainingCarbs: row.cycling_training_carbs ?? 0,
    cyclingTrainingFat: row.cycling_training_fat ?? 0,
    cyclingRestKcal: row.cycling_rest_kcal ?? 0,
    cyclingRestProtein: row.cycling_rest_protein ?? 0,
    cyclingRestCarbs: row.cycling_rest_carbs ?? 0,
    cyclingRestFat: row.cycling_rest_fat ?? 0,
  };
}

function profileToDB(userId, p) {
  return {
    id: userId,
    calorie_target: p.kcal,
    protein_target: p.protein,
    maintenance_kcal: p.maintenanceKcal,
    user_name: p.userName,
    weight_loss_target: p.weightLossTarget,
    onboarding_complete: p.onboardingComplete,
    age: p.age,
    sex: p.sex,
    height: p.height,
    weight: p.weight,
    activity_level: p.activityLevel,
    goal: p.goal,
    intensity: p.intensity,
    water_target_liters: p.waterTargetLiters,
    carbs_target: p.carbs ?? 0,
    fat_target: p.fat ?? 0,
    cycling_enabled: p.cyclingEnabled ?? false,
    cycling_training_kcal: p.cyclingTrainingKcal ?? 0,
    cycling_training_protein: p.cyclingTrainingProtein ?? 0,
    cycling_training_carbs: p.cyclingTrainingCarbs ?? 0,
    cycling_training_fat: p.cyclingTrainingFat ?? 0,
    cycling_rest_kcal: p.cyclingRestKcal ?? 0,
    cycling_rest_protein: p.cyclingRestProtein ?? 0,
    cycling_rest_carbs: p.cyclingRestCarbs ?? 0,
    cycling_rest_fat: p.cyclingRestFat ?? 0,
  };
}

// ─── Entries ──────────────────────────────────────────
// Schema: id UUID PK, user_id UUID NOT NULL, name TEXT NOT NULL,
//   kcal REAL DEFAULT 0, protein REAL DEFAULT 0, meal TEXT DEFAULT 'Snack',
//   serving_size REAL, serving_unit TEXT, date_key TEXT NOT NULL,
//   timestamp TIMESTAMPTZ DEFAULT now(), ingredients JSONB,
//   from_leftover_id UUID, recipe_id UUID

export async function fetchEntries(userId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });
  if (error) { console.error('fetchEntries:', error); return []; }
  return data.map(entryToApp);
}

export async function insertEntry(userId, entry) {
  const row = entryToDB(userId, entry);
  const { error } = await supabase.from('entries').insert(row);
  if (error) console.error('insertEntry:', error);
}

export async function updateEntry(entry) {
  const { id, ...rest } = entryToDB(null, entry);
  const { error } = await supabase.from('entries').update(rest).eq('id', id);
  if (error) console.error('updateEntry:', error);
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) console.error('deleteEntry:', error);
}

function entryToApp(row) {
  return {
    id: row.id,
    name: row.name,
    kcal: row.kcal,
    protein: row.protein,
    carbs: row.carbs ?? 0,
    fat: row.fat ?? 0,
    meal: row.meal,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    dateKey: row.date_key,
    timestamp: toMsTimestamp(row.timestamp),
    ingredients: row.ingredients,
    fromLeftoverId: row.from_leftover_id,
    recipeId: row.recipe_id,
  };
}

function entryToDB(userId, e) {
  const row = {
    id: e.id,
    name: e.name || 'Food',
    kcal: e.kcal ?? 0,
    protein: e.protein ?? 0,
    carbs: e.carbs ?? 0,
    fat: e.fat ?? 0,
    meal: e.meal || 'Snack',
    serving_size: e.servingSize ?? null,
    serving_unit: e.servingUnit || 'g',
    date_key: e.dateKey || new Date().toISOString().slice(0, 10),
    timestamp: toISOTimestamp(e.timestamp),
    ingredients: e.ingredients || null,
    from_leftover_id: e.fromLeftoverId || null,
    recipe_id: e.recipeId || null,
  };
  if (userId) row.user_id = userId;
  return row;
}

// ─── Exercise Logs ────────────────────────────────────
// Schema: id UUID PK, user_id UUID NOT NULL, name TEXT NOT NULL,
//   calories_burned REAL DEFAULT 0, duration REAL, date_key TEXT NOT NULL,
//   timestamp TIMESTAMPTZ DEFAULT now(), type TEXT, label TEXT,
//   intensity TEXT, weight_used REAL, duration_minutes REAL

export async function fetchExerciseLogs(userId) {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });
  if (error) { console.error('fetchExerciseLogs:', error); return []; }
  return data.map(exerciseToApp);
}

export async function insertExerciseLog(userId, log) {
  const row = exerciseToDB(userId, log);
  const { error } = await supabase.from('exercise_logs').insert(row);
  if (error) console.error('insertExerciseLog:', error);
}

export async function deleteExerciseLog(id) {
  const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
  if (error) console.error('deleteExerciseLog:', error);
}

function exerciseToApp(row) {
  return {
    id: row.id,
    name: row.name,
    caloriesBurned: row.calories_burned,
    duration: row.duration_minutes ?? row.duration,
    durationMinutes: row.duration_minutes,
    type: row.type,
    label: row.label || row.name,
    intensity: row.intensity,
    weightUsed: row.weight_used,
    dateKey: row.date_key,
    timestamp: toMsTimestamp(row.timestamp),
  };
}

function exerciseToDB(userId, e) {
  const row = {
    id: e.id,
    name: e.name || e.label || e.type || 'Exercise',
    calories_burned: e.caloriesBurned ?? 0,
    duration_minutes: e.durationMinutes ?? e.duration ?? null,
    type: e.type || null,
    label: e.label || null,
    intensity: e.intensity || null,
    weight_used: e.weightUsed || null,
    date_key: e.dateKey || new Date().toISOString().slice(0, 10),
    timestamp: toISOTimestamp(e.timestamp),
  };
  if (userId) row.user_id = userId;
  return row;
}

// ─── Water Logs ───────────────────────────────────────
// Schema: id UUID PK, user_id UUID NOT NULL, amount_ml REAL DEFAULT 250,
//   date_key TEXT NOT NULL, timestamp TIMESTAMPTZ DEFAULT now()

export async function fetchWaterLogs(userId) {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });
  if (error) { console.error('fetchWaterLogs:', error); return []; }
  return data.map(waterToApp);
}

export async function insertWaterLog(userId, log) {
  const row = waterToDB(userId, log);
  const { error } = await supabase.from('water_logs').insert(row);
  if (error) console.error('insertWaterLog:', error);
}

export async function deleteWaterLog(id) {
  const { error } = await supabase.from('water_logs').delete().eq('id', id);
  if (error) console.error('deleteWaterLog:', error);
}

function waterToApp(row) {
  return {
    id: row.id,
    amountLiters: row.amount_ml != null ? row.amount_ml / 1000 : 0,
    dateKey: row.date_key,
    timestamp: toMsTimestamp(row.timestamp),
  };
}

function waterToDB(userId, w) {
  const row = {
    id: w.id,
    amount_ml: Math.round((w.amountLiters || 0) * 1000),
    date_key: w.dateKey || new Date().toISOString().slice(0, 10),
    timestamp: toISOTimestamp(w.timestamp),
  };
  if (userId) row.user_id = userId;
  return row;
}

// ─── Recipes ──────────────────────────────────────────
// Schema: id UUID PK, user_id UUID NOT NULL, name TEXT NOT NULL,
//   ingredients JSONB DEFAULT '[]', total_kcal REAL DEFAULT 0,
//   total_protein REAL DEFAULT 0, servings INT DEFAULT 1,
//   servings_yield INT, notes TEXT, per_serving_kcal REAL, per_serving_protein REAL

export async function fetchRecipes(userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchRecipes:', error); return []; }
  return data.map(recipeToApp);
}

export async function insertRecipe(userId, recipe) {
  const row = recipeToDB(userId, recipe);
  const { error } = await supabase.from('recipes').insert(row);
  if (error) console.error('insertRecipe:', error);
}

export async function updateRecipe(recipe) {
  const { id, ...rest } = recipeToDB(null, recipe);
  const { error } = await supabase.from('recipes').update(rest).eq('id', id);
  if (error) console.error('updateRecipe:', error);
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) console.error('deleteRecipe:', error);
}

function recipeToApp(row) {
  return {
    id: row.id,
    name: row.name,
    ingredients: row.ingredients,
    totalKcal: row.total_kcal,
    totalProtein: row.total_protein,
    totalCarbs: row.total_carbs ?? 0,
    totalFat: row.total_fat ?? 0,
    servings: row.servings,
    servingsYield: row.servings_yield ?? row.servings,
    perServing: {
      kcal: row.per_serving_kcal ?? (row.servings ? Math.round(row.total_kcal / row.servings) : row.total_kcal),
      protein: row.per_serving_protein ?? (row.servings ? Math.round(row.total_protein / row.servings) : row.total_protein),
      carbs: row.per_serving_carbs ?? (row.servings ? Math.round((row.total_carbs ?? 0) / row.servings) : (row.total_carbs ?? 0)),
      fat: row.per_serving_fat ?? (row.servings ? Math.round((row.total_fat ?? 0) / row.servings) : (row.total_fat ?? 0)),
    },
    notes: row.notes,
  };
}

function recipeToDB(userId, r) {
  const row = {
    id: r.id,
    name: r.name || 'Recipe',
    ingredients: r.ingredients || [],
    total_kcal: r.totalKcal ?? 0,
    total_protein: r.totalProtein ?? 0,
    total_carbs: r.totalCarbs ?? 0,
    total_fat: r.totalFat ?? 0,
    servings: r.servings ?? r.servingsYield ?? 1,
    servings_yield: r.servingsYield ?? r.servings ?? 1,
    per_serving_kcal: r.perServing?.kcal ?? 0,
    per_serving_protein: r.perServing?.protein ?? 0,
    per_serving_carbs: r.perServing?.carbs ?? 0,
    per_serving_fat: r.perServing?.fat ?? 0,
    notes: r.notes || null,
  };
  if (userId) row.user_id = userId;
  return row;
}

// ─── Leftovers ────────────────────────────────────────
// Schema: id UUID PK, user_id UUID NOT NULL, name TEXT NOT NULL,
//   kcal REAL DEFAULT 0, protein REAL DEFAULT 0, servings_left REAL DEFAULT 1,
//   date_key TEXT NOT NULL, per_serving_kcal REAL, per_serving_protein REAL,
//   remaining_servings REAL, total_servings REAL, date_cooked TEXT, recipe_id UUID

export async function fetchLeftovers(userId) {
  const { data, error } = await supabase
    .from('leftovers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchLeftovers:', error); return []; }
  return data.map(leftoverToApp);
}

export async function insertLeftover(userId, leftover) {
  const row = leftoverToDB(userId, leftover);
  const { error } = await supabase.from('leftovers').insert(row);
  if (error) console.error('insertLeftover:', error);
}

export async function updateLeftover(leftover) {
  const { id, ...rest } = leftoverToDB(null, leftover);
  const { error } = await supabase.from('leftovers').update(rest).eq('id', id);
  if (error) console.error('updateLeftover:', error);
}

export async function deleteLeftover(id) {
  const { error } = await supabase.from('leftovers').delete().eq('id', id);
  if (error) console.error('deleteLeftover:', error);
}

function leftoverToApp(row) {
  return {
    id: row.id,
    name: row.name,
    remainingServings: row.remaining_servings ?? row.servings_left,
    totalServings: row.total_servings ?? row.remaining_servings ?? row.servings_left,
    perServing: {
      kcal: row.per_serving_kcal ?? row.kcal,
      protein: row.per_serving_protein ?? row.protein,
      carbs: row.per_serving_carbs ?? 0,
      fat: row.per_serving_fat ?? 0,
    },
    dateKey: row.date_key,
    dateCooked: row.date_cooked,
    recipeId: row.recipe_id,
  };
}

function leftoverToDB(userId, l) {
  const row = {
    id: l.id,
    name: l.name || 'Leftover',
    kcal: l.perServing?.kcal ?? l.kcal ?? 0,
    protein: l.perServing?.protein ?? l.protein ?? 0,
    remaining_servings: l.remainingServings ?? 1,
    total_servings: l.totalServings ?? l.remainingServings ?? 1,
    servings_left: l.remainingServings ?? 1,
    per_serving_kcal: l.perServing?.kcal ?? 0,
    per_serving_protein: l.perServing?.protein ?? 0,
    per_serving_carbs: l.perServing?.carbs ?? 0,
    per_serving_fat: l.perServing?.fat ?? 0,
    date_key: l.dateKey || l.dateCooked || new Date().toISOString().slice(0, 10),
    date_cooked: l.dateCooked || null,
    recipe_id: l.recipeId || null,
  };
  if (userId) row.user_id = userId;
  return row;
}

// ─── Custom Meals ─────────────────────────────────────
// Schema: id UUID PK, user_id UUID NOT NULL, name TEXT NOT NULL,
//   ingredients JSONB DEFAULT '[]', total_kcal REAL DEFAULT 0,
//   total_protein REAL DEFAULT 0, use_count INTEGER DEFAULT 0

export async function fetchCustomMeals(userId) {
  const { data, error } = await supabase
    .from('custom_meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchCustomMeals:', error); return []; }
  return data.map(customMealToApp);
}

export async function insertCustomMeal(userId, meal) {
  const row = customMealToDB(userId, meal);
  const { error } = await supabase.from('custom_meals').insert(row);
  if (error) console.error('insertCustomMeal:', error);
}

export async function updateCustomMeal(meal) {
  const { id, ...rest } = customMealToDB(null, meal);
  const { error } = await supabase.from('custom_meals').update(rest).eq('id', id);
  if (error) console.error('updateCustomMeal:', error);
}

export async function saveCustomMeal(userId, meal) {
  if (meal.id) {
    const { data } = await supabase.from('custom_meals').select('id').eq('id', meal.id).maybeSingle();
    if (data) {
      await updateCustomMeal(meal);
    } else {
      await insertCustomMeal(userId, meal);
    }
  } else {
    await insertCustomMeal(userId, meal);
  }
}

export async function deleteCustomMeal(id) {
  const { error } = await supabase.from('custom_meals').delete().eq('id', id);
  if (error) console.error('deleteCustomMeal:', error);
}

function customMealToApp(row) {
  return {
    id: row.id,
    name: row.name,
    ingredients: row.ingredients,
    kcal: row.total_kcal,
    protein: row.total_protein,
    carbs: row.total_carbs ?? 0,
    fat: row.total_fat ?? 0,
    useCount: row.use_count ?? 0,
  };
}

function customMealToDB(userId, m) {
  const row = {
    name: m.name || 'Meal',
    ingredients: m.ingredients || [],
    total_kcal: m.kcal ?? 0,
    total_protein: m.protein ?? 0,
    total_carbs: m.carbs ?? 0,
    total_fat: m.fat ?? 0,
    use_count: m.useCount ?? 0,
  };
  if (m.id) row.id = m.id;
  if (userId) row.user_id = userId;
  return row;
}

// ─── Day Types (calorie cycling) ─────────────────────

export async function fetchDayTypes(userId) {
  const { data, error } = await supabase
    .from('day_types')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.error('fetchDayTypes:', error); return {}; }
  const map = {};
  for (const row of data) {
    map[row.date_key] = row.day_type;
  }
  return map;
}

export async function upsertDayType(userId, dateKey, dayType) {
  const { error } = await supabase
    .from('day_types')
    .upsert({ user_id: userId, date_key: dateKey, day_type: dayType }, { onConflict: 'user_id,date_key' });
  if (error) console.error('upsertDayType:', error);
}

// ─── Personal Ingredients ────────────────────────────

function personalIngToApp(row) {
  return {
    id: row.id,
    name: row.name,
    refAmount: row.ref_amount ?? 0,
    refUnit: row.ref_unit ?? 'g',
    refKcal: row.ref_kcal ?? 0,
    refProtein: row.ref_protein ?? 0,
    refCarbs: row.ref_carbs ?? 0,
    refFat: row.ref_fat ?? 0,
    sortOrder: row.sort_order ?? 0,
  };
}

function personalIngToDB(userId, ing, index) {
  const row = {
    name: ing.name || '',
    ref_amount: ing.refAmount ?? 0,
    ref_unit: ing.refUnit ?? 'g',
    ref_kcal: ing.refKcal ?? 0,
    ref_protein: ing.refProtein ?? 0,
    ref_carbs: ing.refCarbs ?? 0,
    ref_fat: ing.refFat ?? 0,
    sort_order: index ?? 0,
  };
  if (ing.id) row.id = ing.id;
  if (userId) row.user_id = userId;
  return row;
}

export async function fetchPersonalIngredients(userId) {
  const { data, error } = await supabase
    .from('personal_ingredients')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) { console.error('fetchPersonalIngredients:', error); return []; }
  console.log('[DEBUG] fetchPersonalIngredients: got', data?.length, 'rows');
  return data.map(personalIngToApp);
}

export async function insertPersonalIngredient(userId, ing, index) {
  const row = personalIngToDB(userId, ing, index);
  console.log('[DEBUG] insertPersonalIngredient payload:', JSON.stringify(row));
  const { data, error } = await supabase.from('personal_ingredients').insert(row).select().single();
  if (error) { console.error('[DEBUG] insertPersonalIngredient FAILED:', error.message, error.code, error.details); return null; }
  console.log('[DEBUG] insertPersonalIngredient SUCCESS:', data?.id);
  return personalIngToApp(data);
}

export async function updatePersonalIngredient(ing) {
  const row = personalIngToDB(null, ing, ing.sortOrder);
  delete row.id;
  const { error } = await supabase.from('personal_ingredients').update(row).eq('id', ing.id);
  if (error) console.error('updatePersonalIngredient:', error);
}

export async function deletePersonalIngredient(id) {
  const { error } = await supabase.from('personal_ingredients').delete().eq('id', id);
  if (error) console.error('deletePersonalIngredient:', error);
}
