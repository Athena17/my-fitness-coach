import { useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { getToday, getWeekRange } from '../utils/dateUtils.js';
import { sumNutrition } from '../utils/nutritionCalc.js';

export function useDailyEntries(dateKey) {
  const { state } = useApp();
  const day = dateKey || getToday();

  const todayEntries = useMemo(
    () => state.entries.filter((e) => e.dateKey === day),
    [state.entries, day]
  );

  const todayTotals = useMemo(() => sumNutrition(todayEntries), [todayEntries]);

  const todayExerciseLogs = useMemo(
    () => (state.exerciseLogs || []).filter((e) => e.dateKey === day),
    [state.exerciseLogs, day]
  );

  const caloriesBurned = useMemo(
    () => todayExerciseLogs.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0),
    [todayExerciseLogs]
  );

  const todayWaterLogs = useMemo(
    () => (state.waterLogs || []).filter((e) => e.dateKey === day),
    [state.waterLogs, day]
  );

  const todayWaterTotal = useMemo(
    () => todayWaterLogs.reduce((sum, e) => sum + (e.amountLiters || 0), 0),
    [todayWaterLogs]
  );

  const weekSummary = useMemo(() => {
    const days = getWeekRange();
    return days.map((dateKey) => {
      const dayEntries = state.entries.filter((e) => e.dateKey === dateKey);
      const dayExercise = (state.exerciseLogs || []).filter((e) => e.dateKey === dateKey);
      const burned = dayExercise.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
      return { dateKey, ...sumNutrition(dayEntries), burned, entryCount: dayEntries.length };
    });
  }, [state.entries, state.exerciseLogs]);

  return { todayEntries, todayTotals, todayExerciseLogs, caloriesBurned, todayWaterLogs, todayWaterTotal, weekSummary };
}
