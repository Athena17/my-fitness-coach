import { useCallback } from 'react';
import { useApp } from '../context/useApp.js';

export function useCyclingConfig() {
  const { state, dispatch } = useApp();
  const targets = state.targets;

  const config = {
    enabled: targets.cyclingEnabled ?? false,
    trainingKcal: targets.cyclingTrainingKcal ?? 0,
    trainingProtein: targets.cyclingTrainingProtein ?? 0,
    restKcal: targets.cyclingRestKcal ?? 0,
    restProtein: targets.cyclingRestProtein ?? 0,
  };

  const setConfig = useCallback((newConfig) => {
    dispatch({
      type: 'SET_TARGETS',
      payload: {
        cyclingEnabled: newConfig.enabled,
        cyclingTrainingKcal: newConfig.trainingKcal,
        cyclingTrainingProtein: newConfig.trainingProtein,
        cyclingRestKcal: newConfig.restKcal,
        cyclingRestProtein: newConfig.restProtein,
      },
    });
  }, [dispatch]);

  return [config, setConfig];
}
