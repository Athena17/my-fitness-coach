import { useMemo, useState, useEffect, useRef } from 'react';
import { useApp } from '../context/useApp.js';
import { VIEWS } from '../context/constants.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { sumNutrition } from '../utils/nutritionCalc.js';
import { getWeekRange, getToday } from '../utils/dateUtils.js';
import FloatingActionButton from '../components/FloatingActionButton.jsx';
import './Dashboard.css';

/* Hero ring constants */
const R_SIZE = 120;
const R_STROKE = 7;
const R_RADIUS = (R_SIZE - R_STROKE) / 2;
const R_CIRC = 2 * Math.PI * R_RADIUS;

function WeekScorecard({ weekData }) {
  return (
    <div className="ov-cards-row">
      {weekData.map((d) => {
        if (!d.hasData) {
          return (
            <div key={d.dateKey} className={`ov-card ov-card--empty${d.isToday ? ' ov-card--today' : ''}`}>
              <span className={`ov-card-day${d.isToday ? ' ov-card-day--today' : ''}`}>{d.label}</span>
              <div className="ov-card-body" />
            </div>
          );
        }
        const calOk = d.kcalPct <= 1;
        const protOk = d.proteinPct >= 1;
        const calColor = calOk ? 'var(--color-success)' : 'var(--color-danger)';
        const protColor = protOk ? 'var(--color-success)' : 'var(--color-danger)';
        return (
          <div key={d.dateKey} className={`ov-card${d.isToday ? ' ov-card--today' : ''}`}>
            <span className={`ov-card-day${d.isToday ? ' ov-card-day--today' : ''}`}>{d.label}</span>
            <div className="ov-card-body">
              {/* Fire — calories */}
              <svg width="12" height="12" viewBox="0 0 16 16" fill={calColor} opacity={calOk ? 0.85 : 0.45}>
                <path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/>
              </svg>
              <span className="ov-card-divider" />
              {/* Chicken drumstick — protein */}
              <svg width="13" height="13" viewBox="0 0 32 32" fill={protColor} opacity={protOk ? 0.85 : 0.45}>
                <path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/>
                <circle cx="5.5" cy="27" r="2" fill={protColor}/>
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeroRing({ pct, color, label, value, unit, isOver, mounted, icon }) {
  const offset = mounted ? R_CIRC * (1 - Math.min(pct, 1)) : R_CIRC;
  return (
    <div className="ov-hero-ring">
      <div className="ov-hero-ring-wrap">
        <svg width={R_SIZE} height={R_SIZE}>
          <circle cx={R_SIZE / 2} cy={R_SIZE / 2} r={R_RADIUS}
            fill="none" stroke="var(--color-text-secondary)" strokeWidth={R_STROKE} opacity="0.08" />
          <circle cx={R_SIZE / 2} cy={R_SIZE / 2} r={R_RADIUS}
            fill="none" stroke={color} strokeWidth={R_STROKE}
            strokeDasharray={R_CIRC} strokeDashoffset={offset}
            strokeLinecap="round" className="ov-ring-anim"
            transform={`rotate(-90 ${R_SIZE / 2} ${R_SIZE / 2})`} />
        </svg>
        <div className="ov-hero-ring-inner">
          <span className={`ov-hero-ring-num ${isOver ? 'ov-hero-ring-num--over' : ''}`}>{value}</span>
          <span className="ov-hero-ring-unit">{unit}</span>
        </div>
      </div>
      <span className="ov-hero-ring-label">{icon}{label}</span>
    </div>
  );
}


export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { targets, entries } = state;
  const { todayTotals, caloriesBurned, todayWaterTotal } = useDailyEntries();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const kcalEaten = Math.round(todayTotals.kcal);
  const isOver = kcalEaten > targets.kcal;
  const waterTarget = targets.waterTargetLiters || 2.5;
  const kcalPct = Math.min(kcalEaten / targets.kcal, 1);

  const proteinEaten = Math.round(todayTotals.protein);
  const proteinTarget = Math.round(targets.protein);
  const proteinPct = Math.min(proteinEaten / proteinTarget, 1);

  const kcalColor = isOver ? 'var(--color-danger)' : kcalPct > 0.85 ? 'var(--color-warning)' : 'var(--color-kcal)';
  const proteinColor = proteinPct >= 1 ? 'var(--color-success)' : 'var(--color-protein)';

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (targets.userName || '').split(' ')[0];

  // Weekly data with protein
  const weekData = useMemo(() => {
    const weekDays = getWeekRange();
    const today = getToday();
    const logs = state.exerciseLogs || [];
    const burnByDay = {};
    for (const e of logs) {
      burnByDay[e.dateKey] = (burnByDay[e.dateKey] || 0) + (e.caloriesBurned || 0);
    }
    return weekDays.map((dateKey) => {
      const dayEntries = entries.filter((e) => e.dateKey === dateKey);
      const totals = sumNutrition(dayEntries);
      const dayBurn = burnByDay[dateKey] || 0;
      const net = totals.kcal - dayBurn;
      const date = new Date(dateKey + 'T00:00:00');
      return {
        dateKey,
        label: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
        kcalPct: targets.kcal > 0 ? net / targets.kcal : 0,
        proteinPct: targets.protein > 0 ? totals.protein / targets.protein : 0,
        isToday: dateKey === today,
        hasData: dayEntries.length > 0,
      };
    });
  }, [entries, state.exerciseLogs, targets]);

  // Streak: consecutive green days going back from most recent day with data
  const streak = useMemo(() => {
    const today = getToday();
    const logs = state.exerciseLogs || [];
    const burnByDay = {};
    for (const e of logs) {
      burnByDay[e.dateKey] = (burnByDay[e.dateKey] || 0) + (e.caloriesBurned || 0);
    }
    let count = 0;
    const d = new Date(today + 'T00:00:00');
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      const dayEntries = entries.filter(e => e.dateKey === key);
      if (dayEntries.length === 0) {
        // Skip today if no data yet, but stop on any other empty day
        if (i === 0) { d.setDate(d.getDate() - 1); continue; }
        break;
      }
      const totals = sumNutrition(dayEntries);
      const net = totals.kcal - (burnByDay[key] || 0);
      const calOk = targets.kcal > 0 && net <= targets.kcal;
      const protOk = targets.protein > 0 && totals.protein >= targets.protein;
      if (calOk && protOk) count++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [entries, state.exerciseLogs, targets]);

  // Personalized insights (swipeable cards)
  // level: 'good' (on track), 'alert' (needs attention)
  const insights = useMemo(() => {
    const msgs = [];
    if (todayTotals.kcal === 0) {
      msgs.push({ tag: 'Getting Started', text: 'Start logging to see your progress come alive.', level: 'alert' });
      msgs.push({ tag: 'Hydration', text: 'No water logged yet — stay hydrated!', level: 'alert' });
      return msgs;
    }
    // Calories
    const kcalLeft = targets.kcal - kcalEaten;
    if (isOver) msgs.push({ tag: 'Calories', text: 'You\'ve gone a bit over on calories — no stress, just be mindful.', level: 'alert' });
    else if (kcalLeft < targets.kcal * 0.15) msgs.push({ tag: 'Calories', text: 'Almost at your calorie limit — you\'re doing great.', level: 'good' });
    else msgs.push({ tag: 'Calories', text: `${kcalLeft.toLocaleString()} kcal left — good calorie control so far.`, level: 'good' });
    // Protein
    if (proteinPct >= 1) msgs.push({ tag: 'Protein', text: 'Protein target hit — nice work!', level: 'good' });
    else if (proteinPct < 0.5) msgs.push({ tag: 'Protein', text: 'Try adding more protein to your next meal.', level: 'alert' });
    else msgs.push({ tag: 'Protein', text: `${proteinTarget - proteinEaten}g of protein left to hit your target.`, level: 'alert' });
    // Water — always show when behind
    const waterRatio = todayWaterTotal / waterTarget;
    if (waterRatio >= 1) msgs.push({ tag: 'Hydration', text: 'Water goal reached — well hydrated today!', level: 'good' });
    else if (waterRatio < 0.3) msgs.push({ tag: 'Hydration', text: 'You\'re behind on water — try to catch up.', level: 'alert' });
    else if (waterRatio < 0.6) msgs.push({ tag: 'Hydration', text: `${(waterTarget - todayWaterTotal).toFixed(1)}L of water left — keep sipping.`, level: 'alert' });
    else msgs.push({ tag: 'Hydration', text: `${(waterTarget - todayWaterTotal).toFixed(1)}L left — almost there.`, level: 'good' });
    // Exercise
    if (caloriesBurned > 200) msgs.push({ tag: 'Activity', text: `Great workout! ${caloriesBurned} kcal burned today.`, level: 'good' });
    else if (caloriesBurned > 0) msgs.push({ tag: 'Activity', text: `${caloriesBurned} kcal burned — every bit counts.`, level: 'good' });
    else if (hour > 16) msgs.push({ tag: 'Activity', text: 'Still time for a walk or workout today.', level: 'alert' });
    // Weekly trend
    const daysOnTrack = weekData.filter(d => d.hasData && d.kcalPct <= 1.1 && d.kcalPct > 0).length;
    if (daysOnTrack >= 5) msgs.push({ tag: 'Weekly', text: `${daysOnTrack}/7 days on track this week — strong consistency!`, level: 'good' });
    else if (daysOnTrack >= 3) msgs.push({ tag: 'Weekly', text: `${daysOnTrack}/7 days on track — keep building momentum.`, level: 'alert' });
    return msgs;
  }, [todayTotals, isOver, kcalEaten, targets, proteinPct, proteinEaten, proteinTarget, todayWaterTotal, waterTarget, hour, caloriesBurned, weekData]);

  // Insight swipe state
  const [insightIdx, setInsightIdx] = useState(0);
  const [slideDir, setSlideDir] = useState('none'); // 'left' | 'right' | 'none'
  const touchRef = useRef({ x: 0, y: 0 });

  // Clamp index if insights shrink
  const clampedIdx = Math.min(insightIdx, Math.max(0, insights.length - 1));

  function handleInsightTouchStart(e) {
    touchRef.current.x = e.touches[0].clientX;
    touchRef.current.y = e.touches[0].clientY;
  }

  function handleInsightTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && clampedIdx < insights.length - 1) {
        setSlideDir('left');
        setTimeout(() => { setInsightIdx(i => i + 1); setSlideDir('none'); }, 250);
      } else if (dx > 0 && clampedIdx > 0) {
        setSlideDir('right');
        setTimeout(() => { setInsightIdx(i => i - 1); setSlideDir('none'); }, 250);
      }
    }
  }

  function insightGoBack() {
    if (clampedIdx > 0) {
      setSlideDir('right');
      setTimeout(() => { setInsightIdx(i => i - 1); setSlideDir('none'); }, 250);
    }
  }

  function goToDailyLog() {
    dispatch({ type: 'SET_VIEW', payload: VIEWS.DAILY_LOG });
  }

  return (
    <div className="overview">
      {/* Streak badge — top right */}
      <div className="ov-streak">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={streak > 0 ? 'var(--color-success)' : 'var(--color-text-secondary)'} stroke="none" opacity={streak > 0 ? 1 : 0.35}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <span className="ov-streak-num" style={streak === 0 ? { color: 'var(--color-text-secondary)', opacity: 0.4 } : undefined}>{streak}</span>
      </div>

      {/* 1. Greeting */}
      <p className="ov-greeting ov-enter ov-enter--1">
        {timeGreeting}{firstName ? `, ${firstName}` : ''}!
      </p>

      {/* 2. Weekly scorecard */}
      <div className="ov-week ov-enter ov-enter--2">
        <WeekScorecard weekData={weekData} />
      </div>

      {/* 3. Connector */}
      <div className="ov-connector ov-enter ov-enter--3">
        <div className="ov-connector-line" />
        <span className="ov-connector-label">Today</span>
        <div className="ov-connector-line" />
      </div>

      {/* 4. Two hero rings */}
      <div className="ov-heroes ov-enter ov-enter--3">
        <HeroRing
          pct={kcalPct} color={kcalColor} label="Calories" mounted={mounted} isOver={isOver}
          value={`${kcalEaten.toLocaleString()}`}
          unit={`/ ${targets.kcal.toLocaleString()}`}
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="var(--color-kcal)" stroke="none"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>}
        />
        <HeroRing
          pct={proteinPct} color={proteinColor} label="Protein" mounted={mounted} isOver={false}
          value={`${proteinEaten}`}
          unit={`/ ${proteinTarget}g`}
          icon={<svg width="12" height="12" viewBox="0 0 32 32" fill="var(--color-protein)" stroke="none"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>}
        />
      </div>

      {/* 5. Swipeable insights */}
      {insights.length > 0 && (
        <div
          className="ov-insights ov-enter ov-enter--4"
          onTouchStart={handleInsightTouchStart}
          onTouchEnd={handleInsightTouchEnd}
        >
          <div
            key={clampedIdx}
            className={`ov-insight-card ov-insight-card--${insights[clampedIdx].level} ${
              slideDir === 'left' ? 'ov-insight-card--exit-left' :
              slideDir === 'right' ? 'ov-insight-card--exit-right' :
              'ov-insight-card--enter'
            }`}
          >
            <div className="ov-insight-top">
              <span className="ov-insight-tag">
                {insights[clampedIdx].level === 'good' ? (
                  <span className="ov-insight-badge ov-insight-badge--good">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 13 4 4L18 7"/></svg>
                  </span>
                ) : insights[clampedIdx].level === 'alert' ? (
                  <span className="ov-insight-badge ov-insight-badge--alert">
                    <span className="ov-insight-badge-text">!</span>
                  </span>
                ) : (
                  <span className="ov-insight-badge ov-insight-badge--neutral">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="none"><circle cx="12" cy="7.5" r="1.4"/><rect x="10.75" y="10.5" width="2.5" height="7" rx="1.25"/></svg>
                  </span>
                )}
                {insights[clampedIdx].tag}
              </span>
              {clampedIdx > 0 && (
                <button className="ov-insight-back" onClick={insightGoBack} aria-label="Previous insight">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
              )}
            </div>
            <p className="ov-insight-text">{insights[clampedIdx].text}</p>
          </div>
          {insights.length > 1 && (
            <div className="ov-insight-dots">
              {insights.map((_, i) => (
                <span key={i} className={`ov-insight-dot ${i === clampedIdx ? 'ov-insight-dot--active' : ''}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <FloatingActionButton
        onLogMeal={goToDailyLog}
        onCookBatch={goToDailyLog}
        onLogWater={goToDailyLog}
        onLogExercise={goToDailyLog}
      />
    </div>
  );
}
