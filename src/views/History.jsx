import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { formatDateKey, getToday } from '../utils/dateUtils.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import './History.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days = [];
  // Empty cells before first day
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
    return {
      dateKey,
      kcal: totals.kcal,
      protein: totals.protein,
      kcalOk: totals.kcal <= targets.kcal && totals.kcal > 0,
      kcalOver: totals.kcal > targets.kcal,
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
                className={`history-cell ${isToday ? 'history-cell--today' : ''} ${status ? 'history-cell--logged' : ''}`}
              >
                <span className="history-cell-day">{dayNum}</span>
                {status && (
                  <div className="history-cell-dots">
                    <span
                      className={`history-dot history-dot--kcal ${status.kcalOk ? 'ok' : ''} ${status.kcalOver ? 'over' : ''}`}
                      title={`${Math.round(status.kcal)} kcal`}
                    />
                    <span
                      className={`history-dot history-dot--protein ${status.proteinOk ? 'ok' : ''}`}
                      title={`${Math.round(status.protein)}g protein`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="history-legend">
        <div className="history-legend-item">
          <span className="history-dot history-dot--kcal ok" />
          <span>Calories on track</span>
        </div>
        <div className="history-legend-item">
          <span className="history-dot history-dot--kcal over" />
          <span>Calories over</span>
        </div>
        <div className="history-legend-item">
          <span className="history-dot history-dot--protein ok" />
          <span>Protein target hit</span>
        </div>
      </div>
    </div>
  );
}
