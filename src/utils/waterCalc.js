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

/**
 * Check if daily water target was met for a given date.
 * Returns 'met' | 'not_met' | null (no logs).
 */
export function getWaterStatusByDate(dateKey, waterLogs, waterTarget) {
  const total = waterLogs
    .filter((e) => e.dateKey === dateKey)
    .reduce((sum, e) => sum + (e.amountLiters || 0), 0);
  if (total === 0) return null;
  return total >= waterTarget ? 'met' : 'not_met';
}
