import { useCallback } from 'react';
import { useApp } from '../context/useApp.js';

export function useCyclingConfig() {
  const { state, dispatch } = useApp();
  const targets = state.targets;

  const config = {
    enabled: targets.cyclingEnabled ?? false,
    trainingKcal: targets.cyclingTrainingKcal ?? 0,
    trainingProtein: targets.cyclingTrainingProtein ?? 0,
    trainingCarbs: targets.cyclingTrainingCarbs ?? 0,
    trainingFat: targets.cyclingTrainingFat ?? 0,
    restKcal: targets.cyclingRestKcal ?? 0,
    restProtein: targets.cyclingRestProtein ?? 0,
    restCarbs: targets.cyclingRestCarbs ?? 0,
    restFat: targets.cyclingRestFat ?? 0,
  };

  const setConfig = useCallback((newConfig) => {
    dispatch({
      type: 'SET_TARGETS',
      payload: {
        cyclingEnabled: newConfig.enabled,
        cyclingTrainingKcal: newConfig.trainingKcal,
        cyclingTrainingProtein: newConfig.trainingProtein,
        cyclingTrainingCarbs: newConfig.trainingCarbs,
        cyclingTrainingFat: newConfig.trainingFat,
        cyclingRestKcal: newConfig.restKcal,
        cyclingRestProtein: newConfig.restProtein,
        cyclingRestCarbs: newConfig.restCarbs,
        cyclingRestFat: newConfig.restFat,
      },
    });
  }, [dispatch]);

  return [config, setConfig];
}
