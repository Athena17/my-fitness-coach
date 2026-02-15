import { useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import { getWeekRange, getToday } from '../utils/dateUtils.js';
import './GoalBar.css';

function Ring({ value, max, color, size = 52, strokeWidth = 4.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value / max;
  const fullLaps = Math.floor(pct);
  const remainder = pct - fullLaps;
  const layers = Math.min(fullLaps + (remainder > 0 ? 1 : 0), 5);

  return (
    <svg width={size} height={size} className="goal-ring">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        opacity="0.15"
      />
      {Array.from({ length: layers }, (_, i) => {
        const isLast = i === layers - 1;
        const layerPct = isLast ? remainder || 1 : 1;
        const offset = circumference * (1 - layerPct);
        const brightness = Math.max(1 - i * 0.25, 0.3);
        return (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            filter={`brightness(${brightness})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        );
      })}
    </svg>
  );
}

function WeekStrip({ entries, targets }) {
  const today = getToday();
  const weekDays = getWeekRange();

  const dayMap = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!map[e.dateKey]) map[e.dateKey] = [];
      map[e.dateKey].push(e);
    }
    return map;
  }, [entries]);

  return (
    <div className="week-strip">
      {weekDays.map((dateKey) => {
        const [, , d] = dateKey.split('-');
        const dayEntries = dayMap[dateKey] || [];
        const totals = sumNutrition(dayEntries);
        const isToday = dateKey === today;
        const hasData = dayEntries.length > 0;
        const overPct = hasData ? (totals.kcal - targets.kcal) / targets.kcal : 0;

        let dotClass = '';
        if (hasData) {
          if (overPct > 0.2) dotClass = 'week-dot--red';
          else if (overPct > 0) dotClass = 'week-dot--yellow';
          else dotClass = 'week-dot--green';
        }

        const date = new Date(dateKey + 'T00:00:00');
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'narrow' });

        return (
          <div key={dateKey} className={`week-day ${isToday ? 'week-day--today' : ''}`}>
            <span className="week-day-label">{dayLabel}</span>
            <span className="week-day-num">{Number(d)}</span>
            {hasData && !isToday && <span className={`week-dot ${dotClass}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function GoalBar({ variant = 'full' }) {
  const { state } = useApp();
  const { targets, entries } = state;
  const { todayTotals } = useDailyEntries();

  const _kcalLeft = Math.max(0, targets.kcal - todayTotals.kcal);
  const _proteinLeft = Math.max(0, targets.protein - todayTotals.protein);

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

  const absKg = Math.abs(weightEstimate).toFixed(1);
  const goalKg = targets.weightLossTarget || 5;
  const progressPct = Math.min(Math.max(weightEstimate / goalKg, 0), 1) * 100;

  // Compact variant: brand only (for Progress page)
  if (variant === 'compact') {
    return (
      <div className="goal-bar goal-bar--compact">
        <span className="goal-bar-brand">myfitnesscoach</span>
      </div>
    );
  }

  return (
    <div className="goal-bar goal-bar--today">
      <div className="goal-bar-top">
        <span className="goal-bar-brand">myfitnesscoach</span>
      </div>

      {/* Weight loss progress bar */}
      <div className="weight-progress">
        <div className="weight-progress-header">
          <span className="weight-progress-label">
            {weightEstimate >= 0 ? 'Weight loss progress' : 'Weight gained'}
          </span>
          <span className={`weight-progress-value ${weightEstimate < 0 ? 'weight-progress-value--gain' : ''}`}>
            {absKg} / {goalKg} kg
          </span>
        </div>
        <div className="weight-progress-track">
          <div
            className={`weight-progress-fill ${weightEstimate < 0 ? 'weight-progress-fill--gain' : ''}`}
            style={{ width: `${weightEstimate >= 0 ? progressPct : 100}%` }}
          />
        </div>
      </div>

      {/* Weekly strip */}
      <WeekStrip entries={entries} targets={targets} />

      {/* Calorie + Protein rings */}
      <div className="goal-bar-rings">
        <div className="goal-ring-group">
          <div className="goal-ring-wrap">
            <Ring value={todayTotals.kcal} max={targets.kcal} color="var(--color-kcal)" />
            <div className="goal-ring-inner">
              <span className="goal-ring-number">{Math.round(todayTotals.kcal)}</span>
            </div>
          </div>
          <div className="goal-ring-meta">
            <span className="goal-ring-label">
              <svg className="goal-ring-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-kcal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Calories
            </span>
            <span className="goal-ring-sub">
              {todayTotals.kcal > targets.kcal
                ? `${Math.round(todayTotals.kcal - targets.kcal)} over`
                : `/ ${Math.round(targets.kcal)} cal`
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
            <span className="goal-ring-label">
              <svg className="goal-ring-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-protein)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C9 2 7 4.2 7 7c0 2 1.2 3.8 3 4.6V20a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2v-8.4c1.8-.8 3-2.6 3-4.6 0-2.8-2-5-5-5z" />
              </svg>
              Protein
            </span>
            <span className="goal-ring-sub">
              {todayTotals.protein >= targets.protein
                ? 'Target hit!'
                : `/ ${Math.round(targets.protein)}g`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
