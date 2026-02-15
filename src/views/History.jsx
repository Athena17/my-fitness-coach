import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { formatDateKey, getToday } from '../utils/dateUtils.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import './History.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }
  return days;
}

function formatMonthLabel(year, month) {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function DayRing({ status }) {
  const size = 32;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(status.kcal / status.kcalTarget, 1));

  let ringColor = 'var(--color-success)';
  if (status.kcalOver20) ringColor = 'var(--color-danger)';
  else if (status.kcalOver) ringColor = 'var(--color-warning)';

  return (
    <svg width={size} height={size} className="day-ring">
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth}
      />
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke={ringColor} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      {/* Protein: centered check or X */}
      {status.proteinOk ? (
        <polyline
          points={`${cx - 4},${cy} ${cx - 1},${cy + 3} ${cx + 5},${cy - 3}`}
          fill="none" stroke="var(--color-success)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      ) : (
        <g stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
          <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} />
          <line x1={cx + 3} y1={cy - 3} x2={cx - 3} y2={cy + 3} />
        </g>
      )}
    </svg>
  );
}

export default function History() {
  const { state } = useApp();
  const { entries, targets } = state;
  const today = getToday();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const dayMap = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!map[e.dateKey]) map[e.dateKey] = [];
      map[e.dateKey].push(e);
    }
    return map;
  }, [entries]);

  const monthDays = getMonthData(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function getDayStatus(dayNum) {
    if (!dayNum) return null;
    const dateKey = formatDateKey(new Date(viewYear, viewMonth, dayNum));
    const dayEntries = dayMap[dateKey];
    if (!dayEntries || dayEntries.length === 0) return null;
    const totals = sumNutrition(dayEntries);
    const overPct = (totals.kcal - targets.kcal) / targets.kcal;
    return {
      kcal: totals.kcal,
      kcalTarget: targets.kcal,
      kcalOk: totals.kcal <= targets.kcal,
      kcalOver: overPct > 0 && overPct <= 0.2,
      kcalOver20: overPct > 0.2,
      proteinOk: totals.protein >= targets.protein,
    };
  }

  return (
    <div className="history">
      <div className="history-header">
        <button className="history-nav-btn" onClick={prevMonth} title="Previous month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="history-month-label">{formatMonthLabel(viewYear, viewMonth)}</span>
        <button className="history-nav-btn" onClick={nextMonth} title="Next month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="history-calendar">
        <div className="history-weekdays">
          {WEEKDAYS.map((w) => (
            <span key={w} className="history-weekday">{w}</span>
          ))}
        </div>

        <div className="history-grid">
          {monthDays.map((dayNum, i) => {
            if (dayNum === null) {
              return <div key={`empty-${i}`} className="history-cell history-cell--empty" />;
            }

            const status = getDayStatus(dayNum);
            const dateKey = formatDateKey(new Date(viewYear, viewMonth, dayNum));
            const isToday = dateKey === today;

            return (
              <div
                key={dayNum}
                className={`history-cell ${isToday ? 'history-cell--today' : ''}`}
              >
                {status ? (
                  <DayRing status={status} />
                ) : (
                  <span className="history-cell-day">{dayNum}</span>
                )}
                {status && (
                  <span className="history-cell-day history-cell-day--below">{dayNum}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="history-legend">
        <div className="history-legend-row">
          <span className="history-legend-title">Calories vs. target</span>
          <div className="history-legend-items">
            <div className="history-legend-item">
              <span className="history-legend-swatch history-legend-swatch--green" />
              <span>Below target</span>
            </div>
            <div className="history-legend-item">
              <span className="history-legend-swatch history-legend-swatch--yellow" />
              <span>Slightly above</span>
            </div>
            <div className="history-legend-item">
              <span className="history-legend-swatch history-legend-swatch--red" />
              <span>Significantly above</span>
            </div>
          </div>
        </div>
        <div className="history-legend-row">
          <span className="history-legend-title">Protein</span>
          <div className="history-legend-items">
            <div className="history-legend-item">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,8 6.5,11.5 13,5" />
              </svg>
              <span>Sufficient</span>
            </div>
            <div className="history-legend-item">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" opacity="0.6">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
              <span>Insufficient</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
