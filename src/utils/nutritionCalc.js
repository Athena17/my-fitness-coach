export function sumNutrition(entries) {
  return entries.reduce(
    (acc, entry) => ({
      kcal: acc.kcal + (entry.kcal || 0),
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function hasMacroTargets(targets) {
  const showCarbs = (targets?.carbs || 0) > 0;
  const showFat = (targets?.fat || 0) > 0;
  return { showCarbs, showFat, showEither: showCarbs || showFat };
}

/**
 * Activity multipliers adapted from Harris-Benedict revisions.
 * Source: Harris JA, Benedict FG. A Biometric Study of Human Basal Metabolism.
 * Proc Natl Acad Sci USA. 1918;4(12):370-373.
 * https://doi.org/10.1073/pnas.4.12.370
 */
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

/**
 * Mifflin-St Jeor equation for Basal Metabolic Rate.
 * Source: Mifflin MD, St Jeor ST, et al. Am J Clin Nutr. 1990;51(2):241-247.
 * https://doi.org/10.1093/ajcn/51.2.241
 */
export function calculateBMR(weight, height, age, sex) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateMaintenance(weight, height, age, sex, activityLevel) {
  const bmr = calculateBMR(weight, height, age, sex);
  const factor = ACTIVITY_FACTORS[activityLevel] || 1.2;
  return Math.round(bmr * factor);
}

/**
 * Suggest daily calorie and protein targets.
 * Protein: 1.6 g/kg — Morton RW et al. Br J Sports Med. 2018;52(6):376-384.
 * https://doi.org/10.1136/bjsports-2017-097608
 */
export function suggestTargets(maintenance, weight, goal) {
  let kcal = maintenance;
  if (goal === 'lose') kcal = maintenance - 300;
  else if (goal === 'gain') kcal = maintenance + 300;
  const protein = Math.round(1.6 * weight);
  return { kcal, protein };
}

export function calcPercentage(current, target) {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Caloric equivalent of 1 kg body weight.
 * Source: Wishnofsky M. Am J Clin Nutr. 1958;6(5):542-546.
 * https://doi.org/10.1093/ajcn/6.5.542
 */
const CAL_PER_KG = 7700;

export function calcWeightChange(entries, exerciseLogs, targets) {
  const maintenance = targets.maintenanceKcal || targets.kcal;
  const goal = targets.goal || 'maintain'; // 'lose' | 'gain' | 'maintain'
  const goalKg = targets.weightLossTarget || 5;
  if (!maintenance || maintenance <= 0) return { deltaKcal: 0, deltaKg: 0, goalKg, goal, pct: 0, daysTracked: 0, firstDate: null };

  const dayMap = {};
  for (const e of entries) {
    if (!dayMap[e.dateKey]) dayMap[e.dateKey] = [];
    dayMap[e.dateKey].push(e);
  }
  const burnMap = {};
  for (const e of (exerciseLogs || [])) {
    burnMap[e.dateKey] = (burnMap[e.dateKey] || 0) + (e.caloriesBurned || 0);
  }

  let totalDeficit = 0;
  let daysTracked = 0;
  let firstDate = null;
  for (const [dateKey, dayEntries] of Object.entries(dayMap)) {
    const totals = sumNutrition(dayEntries);
    const burn = burnMap[dateKey] || 0;
    totalDeficit += maintenance - (totals.kcal - burn);
    daysTracked++;
    if (!firstDate || dateKey < firstDate) firstDate = dateKey;
  }

  // deltaKg: positive = weight lost, negative = weight gained
  const deltaKg = totalDeficit / CAL_PER_KG;
  let pct = 0;
  if (goal === 'lose' && goalKg > 0) pct = Math.min(Math.max(deltaKg, 0) / goalKg, 1);
  else if (goal === 'gain' && goalKg > 0) pct = Math.min(Math.max(-deltaKg, 0) / goalKg, 1);
  return { deltaKcal: Math.round(totalDeficit), deltaKg, goalKg, goal, pct, daysTracked, firstDate };
}
