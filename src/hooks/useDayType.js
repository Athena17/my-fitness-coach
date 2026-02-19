import { useCallback } from 'react';
import { useApp } from '../context/useApp.js';
import { getToday } from '../utils/dateUtils.js';

export function useDayType() {
  const { state, dispatch } = useApp();
  const todayKey = getToday();
  const dayType = state.dayTypes?.[todayKey] || 'rest';

  const setDayType = useCallback((type) => {
    dispatch({ type: 'SET_DAY_TYPE', payload: { dateKey: todayKey, dayType: type } });
  }, [dispatch, todayKey]);

  return [dayType, setDayType];
}

export function getDayTypeForDate(dayTypes, dateKey) {
  return dayTypes?.[dateKey] || 'rest';
}
