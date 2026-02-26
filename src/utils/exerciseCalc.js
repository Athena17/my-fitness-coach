import { getExerciseMET } from './metValues.js';

/**
 * Calculate calories burned using the MET formula:
 * Calories = MET x weight (kg) x duration (hours)
 *
 * Based on: Ainsworth BE et al. 2011 Compendium of Physical Activities.
 * Med Sci Sports Exerc. 2011;43(8):1575-1581.
 * https://doi.org/10.1249/MSS.0b013e31821ece12
 */
export function calculateCaloriesBurned(exerciseKey, durationMinutes, weightKg, intensity = 'moderate') {
  const met = getExerciseMET(exerciseKey, intensity);
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}
