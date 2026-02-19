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
      dayType: null,
      setDayType: null,
      cyclingEnabled: false,
    };
  }

  const effectiveKcal = dayType === 'training' ? config.trainingKcal : config.restKcal;
  const effectiveProtein = dayType === 'training' ? config.trainingProtein : config.restProtein;

  return {
    kcal: effectiveKcal,
    protein: effectiveProtein,
    dayType,
    setDayType,
    cyclingEnabled: true,
  };
}
