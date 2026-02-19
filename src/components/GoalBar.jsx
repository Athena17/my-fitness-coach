import { useMemo } from 'react';
import { sumNutrition } from '../utils/nutritionCalc.js';
import { getWeekRange, getToday } from '../utils/dateUtils.js';
import './GoalBar.css';

export function Ring({ value, max, color, size = 52, strokeWidth = 4.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value / max;
  const fullLaps = Math.floor(pct);
  const remainder = pct - fullLaps;
  const layers = Math.min(fullLaps + (remainder > 0 ? 1 : 0), 5);

  return (
    <svg width={size} height={size} className="goal-ring">
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

export function WeekStrip({ entries, targets }) {
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

export default function GoalBar() {
  return (
    <div className="goal-bar goal-bar--compact">
      <span className="goal-bar-brand">
Irada
      </span>
    </div>
  );
}
