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
