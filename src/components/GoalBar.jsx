import { useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import './GoalBar.css';

export default function GoalBar() {
  const { state } = useApp();
  const { targets, entries } = state;

  const weightEstimate = useMemo(() => {
    const maintenance = targets.maintenanceKcal || targets.kcal;
    // Group entries by day, compute daily deficit relative to maintenance
    const byDay = {};
    for (const e of entries) {
      if (!byDay[e.dateKey]) byDay[e.dateKey] = [];
      byDay[e.dateKey].push(e);
    }

    let totalDeficit = 0;
    for (const dateKey in byDay) {
      const dayTotal = sumNutrition(byDay[dateKey]);
      totalDeficit += maintenance - dayTotal.kcal;
    }

    // 7000 kcal deficit ≈ 1 kg lost
    return totalDeficit / 7000;
  }, [entries, targets]);

  const sign = weightEstimate >= 0 ? '-' : '+';
  const absKg = Math.abs(weightEstimate).toFixed(1);

  return (
    <div className="goal-bar">
      <div className="goal-bar-targets">
        <span className="goal-bar-item">
          <span className="goal-bar-dot kcal-dot" />
          {targets.kcal} kcal
        </span>
        <span className="goal-bar-item">
          <span className="goal-bar-dot protein-dot" />
          {targets.protein}g protein
        </span>
      </div>
      <div className="goal-bar-weight">
        <span className={`weight-value ${weightEstimate >= 0 ? 'loss' : 'gain'}`}>
          {sign}{absKg} kg
        </span>
      </div>
    </div>
  );
}
