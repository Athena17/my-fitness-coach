/**
 * Compute recommended daily water intake.
 * Formula: 35 ml x bodyweight (kg), converted to liters, rounded to 1 decimal.
 */
export function recommendedWaterLiters(weightKg) {
  return Math.round((weightKg * 35) / 100) / 10;
}

export function computeWaterProgress(totalLiters, targetLiters) {
  if (!targetLiters || targetLiters <= 0) return 0;
  return Math.round((totalLiters / targetLiters) * 100);
}
