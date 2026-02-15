import { useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import './GoalBar.css';

function Ring({ value, max, color, size = 64, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="goal-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={value > max ? 'var(--color-danger)' : color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

export default function GoalBar() {
  const { state } = useApp();
  const { targets, entries } = state;
  const { todayTotals } = useDailyEntries();

  const kcalLeft = Math.max(0, targets.kcal - todayTotals.kcal);
  const proteinLeft = Math.max(0, targets.protein - todayTotals.protein);

  const weightEstimate = useMemo(() => {
    const maintenance = targets.maintenanceKcal || targets.kcal;
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
    return totalDeficit / 7000;
  }, [entries, targets]);

  const sign = weightEstimate >= 0 ? '-' : '+';
  const absKg = Math.abs(weightEstimate).toFixed(1);

  return (
    <div className="goal-bar">
      <div className="goal-bar-top">
        <span className="goal-bar-brand">myfitnesscoach</span>
        <div className={`goal-bar-weight ${weightEstimate >= 0 ? 'loss' : 'gain'}`}>
          <span className="weight-label">{weightEstimate >= 0 ? 'Progress' : 'Gained'}</span>
          <span className="weight-value">{sign}{absKg} kg</span>
        </div>
      </div>

      <div className="goal-bar-rings">
        <div className="goal-ring-group">
          <div className="goal-ring-wrap">
            <Ring value={todayTotals.kcal} max={targets.kcal} color="var(--color-kcal)" />
            <div className="goal-ring-inner">
              <span className="goal-ring-number">{Math.round(todayTotals.kcal)}</span>
            </div>
          </div>
          <div className="goal-ring-meta">
            <span className="goal-ring-label">Calories</span>
            <span className="goal-ring-sub">
              {todayTotals.kcal > targets.kcal
                ? `${Math.round(todayTotals.kcal - targets.kcal)} over`
                : `${Math.round(kcalLeft)} left`
              }
            </span>
          </div>
        </div>

        <div className="goal-ring-divider" />

        <div className="goal-ring-group">
          <div className="goal-ring-wrap">
            <Ring value={todayTotals.protein} max={targets.protein} color="var(--color-protein)" />
            <div className="goal-ring-inner">
              <span className="goal-ring-number">{Math.round(todayTotals.protein)}</span>
            </div>
          </div>
          <div className="goal-ring-meta">
            <span className="goal-ring-label">Protein</span>
            <span className="goal-ring-sub">
              {todayTotals.protein >= targets.protein
                ? 'Target hit!'
                : `${Math.round(proteinLeft)}g left`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
