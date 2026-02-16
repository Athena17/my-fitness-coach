export function sumNutrition(entries) {
  return entries.reduce(
    (acc, entry) => ({
      kcal: acc.kcal + (entry.kcal || 0),
      protein: acc.protein + (entry.protein || 0),
    }),
    { kcal: 0, protein: 0 }
  );
}

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

export function calculateBMR(weight, height, age, sex) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateMaintenance(weight, height, age, sex, activityLevel) {
  const bmr = calculateBMR(weight, height, age, sex);
  const factor = ACTIVITY_FACTORS[activityLevel] || 1.2;
  return Math.round(bmr * factor);
}

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
