import { useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { getToday, getWeekRange } from '../utils/dateUtils.js';
import { sumNutrition } from '../utils/nutritionCalc.js';

export function useDailyEntries() {
  const { state } = useApp();
  const today = getToday();

  const todayEntries = useMemo(
    () => state.entries.filter((e) => e.dateKey === today),
    [state.entries, today]
  );

  const todayTotals = useMemo(() => sumNutrition(todayEntries), [todayEntries]);

  const weekSummary = useMemo(() => {
    const days = getWeekRange();
    return days.map((dateKey) => {
      const dayEntries = state.entries.filter((e) => e.dateKey === dateKey);
      return { dateKey, ...sumNutrition(dayEntries), entryCount: dayEntries.length };
    });
  }, [state.entries]);

  return { todayEntries, todayTotals, weekSummary };
}
