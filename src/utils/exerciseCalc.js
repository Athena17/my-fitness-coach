import { getExerciseMET } from './metValues.js';

/**
 * Calculate calories burned using the MET formula:
 * Calories = MET x weight (kg) x duration (hours)
 */
export function calculateCaloriesBurned(exerciseKey, durationMinutes, weightKg, intensity = 'moderate') {
  const met = getExerciseMET(exerciseKey, intensity);
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}
