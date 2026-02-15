/**
 * Convert amount + portion to grams.
 * portionGrams = grams per 1 unit of the selected portion (1 for "g").
 */
export function toGrams(amount, portionGrams) {
  return (Number(amount) || 0) * portionGrams;
}

/**
 * Calculate totals from an array of ingredient rows.
 * Each row: { amount, portionGrams, kcalPer100g, proteinPer100g }
 * Returns: { kcal: integer, protein: 1 decimal }
 */
export function calculateMealTotals(ingredients) {
  let kcal = 0;
  let protein = 0;

  for (const ing of ingredients) {
    const g = toGrams(ing.amount, ing.portionGrams);
    kcal += g * (ing.kcalPer100g || 0) / 100;
    protein += g * (ing.proteinPer100g || 0) / 100;
  }

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
  };
}
