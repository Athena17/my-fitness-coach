import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { formatDateKey, getToday } from '../utils/dateUtils.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import './History.css';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMonthWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
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

  const burnByDay = useMemo(() => {
    const map = {};
    for (const e of (state.exerciseLogs || [])) {
      map[e.dateKey] = (map[e.dateKey] || 0) + (e.caloriesBurned || 0);
    }
    return map;
  }, [state.exerciseLogs]);

  const weeks = getMonthWeeks(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  function getDayData(dayNum) {
    if (!dayNum) return null;
    const dateKey = formatDateKey(new Date(viewYear, viewMonth, dayNum));
    const dayEntries = dayMap[dateKey];
    if (!dayEntries || dayEntries.length === 0) return { dateKey, hasData: false };
    const totals = sumNutrition(dayEntries);
    const burn = burnByDay[dateKey] || 0;
    const net = totals.kcal - burn;
    return {
      dateKey,
      hasData: true,
      kcalPct: targets.kcal > 0 ? net / targets.kcal : 0,
      proteinPct: targets.protein > 0 ? totals.protein / targets.protein : 0,
    };
  }

  // Monthly summary stats
  const monthStats = useMemo(() => {
    let tracked = 0, calOkDays = 0, protOkDays = 0;
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const dateKey = formatDateKey(new Date(viewYear, viewMonth, d));
      const dayEntries = dayMap[dateKey];
      if (!dayEntries || dayEntries.length === 0) continue;
      tracked++;
      const totals = sumNutrition(dayEntries);
      const burn = burnByDay[dateKey] || 0;
      const net = totals.kcal - burn;
      if (targets.kcal > 0 && net <= targets.kcal) calOkDays++;
      if (targets.protein > 0 && totals.protein >= targets.protein) protOkDays++;
    }
    return { tracked, calOkDays, protOkDays };
  }, [viewYear, viewMonth, dayMap, burnByDay, targets]);

  return (
    <div className="progress">
      {/* Month nav */}
      <div className="progress-header">
        <button className="progress-nav-btn" onClick={prevMonth} aria-label="Previous month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="progress-month-label">{formatMonthLabel(viewYear, viewMonth)}</span>
        <button className="progress-nav-btn" onClick={nextMonth} aria-label="Next month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Month summary */}
      {monthStats.tracked > 0 && (
        <div className="progress-summary">
          <span className="progress-stat">
            <span className="progress-stat-value">{monthStats.tracked}</span> days tracked
          </span>
          <span className="progress-stat-sep" />
          <span className="progress-stat">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-success)" stroke="none"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
            <span className="progress-stat-value">{monthStats.calOkDays}</span>
          </span>
          <span className="progress-stat-sep" />
          <span className="progress-stat">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-success)" stroke="var(--color-success)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
            <span className="progress-stat-value">{monthStats.protOkDays}</span>
          </span>
        </div>
      )}

      {/* Scorecard grid */}
      <div className="progress-grid">
        {/* Weekday headers */}
        <div className="progress-week-row progress-weekday-row">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="progress-weekday">{w}</div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div key={wi} className="progress-week-row">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`pad-${di}`} className="progress-card progress-card--pad" />;
              }

              const data = getDayData(dayNum);
              const dateKey = data?.dateKey;
              const isToday = dateKey === today;
              const isFuture = dateKey > today;

              if (isFuture || !data?.hasData) {
                return (
                  <div key={dayNum} className={`progress-card progress-card--empty${isToday ? ' progress-card--today' : ''}${isFuture ? ' progress-card--future' : ''}`}>
                    <span className={`progress-card-day${isToday ? ' progress-card-day--today' : ''}`}>{dayNum}</span>
                    <div className="progress-card-body" />
                  </div>
                );
              }

              const calOk = data.kcalPct <= 1;
              const protOk = data.proteinPct >= 1;
              const calColor = calOk ? 'var(--color-success)' : 'var(--color-danger)';
              const protColor = protOk ? 'var(--color-success)' : 'var(--color-danger)';

              return (
                <div key={dayNum} className={`progress-card${isToday ? ' progress-card--today' : ''}`}>
                  <span className={`progress-card-day${isToday ? ' progress-card-day--today' : ''}`}>{dayNum}</span>
                  <div className="progress-card-body">
                    {/* Fire — calories */}
                    <svg width="11" height="11" viewBox="0 0 16 16" fill={calColor} opacity={calOk ? 0.85 : 0.45}>
                      <path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/>
                    </svg>
                    <span className="progress-card-divider" />
                    {/* Drumstick — protein */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={protColor} stroke={protColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={protOk ? 0.85 : 0.45}>
                      <path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/>
                      <path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="progress-legend">
        <div className="progress-legend-row">
          <span className="progress-legend-label">Calories</span>
          <div className="progress-legend-pair">
            <div className="progress-legend-item">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-success)" stroke="none"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
              <span>On target</span>
            </div>
            <div className="progress-legend-item">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-danger)" stroke="none" opacity="0.45"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
              <span>Over target</span>
            </div>
          </div>
        </div>
        <div className="progress-legend-row">
          <span className="progress-legend-label">Protein</span>
          <div className="progress-legend-pair">
            <div className="progress-legend-item">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-success)" stroke="var(--color-success)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
              <span>Goal met</span>
            </div>
            <div className="progress-legend-item">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-danger)" stroke="var(--color-danger)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
              <span>Under target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
