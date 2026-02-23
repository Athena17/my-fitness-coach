import { useApp } from '../context/useApp.js';
import { useCyclingConfig } from './useCyclingConfig.js';
import { useDayType } from './useDayType.js';

export function useEffectiveTargets() {
  const { state } = useApp();
  const targets = state.targets;
  const [config] = useCyclingConfig();
  const [dayType, setDayType] = useDayType();

  if (!config.enabled) {
    return {
      kcal: targets.kcal,
      protein: targets.protein,
      carbs: targets.carbs ?? 0,
      fat: targets.fat ?? 0,
      dayType: null,
      setDayType: null,
      cyclingEnabled: false,
    };
  }

  const isTraining = dayType === 'training';
  const effectiveKcal = isTraining ? config.trainingKcal : config.restKcal;
  const effectiveProtein = isTraining ? config.trainingProtein : config.restProtein;
  const effectiveCarbs = isTraining ? config.trainingCarbs : config.restCarbs;
  const effectiveFat = isTraining ? config.trainingFat : config.restFat;

  return {
    kcal: effectiveKcal,
    protein: effectiveProtein,
    carbs: effectiveCarbs || targets.carbs || 0,
    fat: effectiveFat || targets.fat || 0,
    dayType,
    setDayType,
    cyclingEnabled: true,
  };
}
