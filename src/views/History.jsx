import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { formatDateKey, getToday } from '../utils/dateUtils.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import { getWaterStatusByDate } from '../utils/waterCalc.js';
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
  const size = 28;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(status.kcal / status.kcalTarget, 1));

  const ringColor = status.kcal > status.kcalTarget ? 'var(--color-danger)' : 'var(--color-success)';

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
  const { entries, targets, waterLogs } = state;
  const waterTarget = targets.waterTargetLiters || 2.5;
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
      kcal: totals.kcal,
      kcalTarget: targets.kcal,
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
            const waterStatus = getWaterStatusByDate(dateKey, waterLogs || [], waterTarget);

            return (
              <div
                key={dayNum}
                className={`history-cell ${isToday ? 'history-cell--today' : ''}`}
              >
                {waterStatus && (
                  <svg className="history-water-drop" width="10" height="12" viewBox="0 0 24 30" fill={waterStatus === 'met' ? 'var(--color-water)' : 'rgba(0,0,0,0.12)'}>
                    <path d="M12 2C12 2 4 12.5 4 19a8 8 0 0 0 16 0c0-6.5-8-17-8-17z" />
                  </svg>
                )}
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
          <span className="history-legend-title">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--color-kcal)" stroke="none"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
            Calories
          </span>
          <div className="history-legend-items">
            <div className="history-legend-item">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--color-success)" strokeWidth="2" />
              </svg>
              <span>At or below target</span>
            </div>
            <div className="history-legend-item">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--color-danger)" strokeWidth="2" />
              </svg>
              <span>Above target</span>
            </div>
          </div>
        </div>
        <div className="history-legend-row">
          <span className="history-legend-title">
            <svg width="12" height="12" viewBox="0 0 32 32" fill="var(--color-protein)" stroke="none"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>
            Protein
          </span>
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
        <div className="history-legend-row">
          <span className="history-legend-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-water)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
            Water
          </span>
          <div className="history-legend-items">
            <div className="history-legend-item">
              <svg width="10" height="12" viewBox="0 0 24 30" fill="var(--color-water)">
                <path d="M12 2C12 2 4 12.5 4 19a8 8 0 0 0 16 0c0-6.5-8-17-8-17z" />
              </svg>
              <span>Target met</span>
            </div>
            <div className="history-legend-item">
              <svg width="10" height="12" viewBox="0 0 24 30" fill="rgba(0,0,0,0.12)">
                <path d="M12 2C12 2 4 12.5 4 19a8 8 0 0 0 16 0c0-6.5-8-17-8-17z" />
              </svg>
              <span>Target not met</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
