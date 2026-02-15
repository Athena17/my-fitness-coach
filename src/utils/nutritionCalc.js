export function sumNutrition(entries) {
  return entries.reduce(
    (acc, entry) => ({
      kcal: acc.kcal + (entry.kcal || 0),
      protein: acc.protein + (entry.protein || 0),
    }),
    { kcal: 0, protein: 0 }
  );
}

export function calcPercentage(current, target) {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}
