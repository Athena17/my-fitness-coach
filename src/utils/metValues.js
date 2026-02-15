/**
 * MET (Metabolic Equivalent of Task) values for common exercises.
 * Base MET values represent moderate intensity.
 * Intensity multipliers adjust the base value.
 */

export const EXERCISES = [
  { key: 'walking', label: 'Walking', met: 3.5 },
  { key: 'jogging', label: 'Jogging', met: 7 },
  { key: 'running', label: 'Running', met: 10 },
  { key: 'cycling', label: 'Cycling', met: 8 },
  { key: 'swimming', label: 'Swimming', met: 8 },
  { key: 'weight_training', label: 'Weight Training', met: 6 },
  { key: 'hiit', label: 'HIIT', met: 10 },
  { key: 'yoga', label: 'Yoga', met: 3 },
  { key: 'basketball', label: 'Basketball', met: 8 },
  { key: 'soccer', label: 'Soccer', met: 10 },
  { key: 'jump_rope', label: 'Jump Rope', met: 11 },
  { key: 'rowing', label: 'Rowing', met: 7 },
  { key: 'dancing', label: 'Dancing', met: 5 },
  { key: 'hiking', label: 'Hiking', met: 6 },
  { key: 'elliptical', label: 'Elliptical', met: 5 },
];

export const INTENSITY_MODIFIERS = {
  light: { label: 'Light', factor: 0.75 },
  moderate: { label: 'Moderate', factor: 1.0 },
  intense: { label: 'Intense', factor: 1.25 },
};

export function getExerciseMET(exerciseKey, intensity = 'moderate') {
  const exercise = EXERCISES.find((e) => e.key === exerciseKey);
  if (!exercise) return 0;
  const modifier = INTENSITY_MODIFIERS[intensity] || INTENSITY_MODIFIERS.moderate;
  return exercise.met * modifier.factor;
}
