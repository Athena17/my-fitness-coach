import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { sumNutrition, calcWeightChange } from '../utils/nutritionCalc.js';
import { getWeekRange, getToday } from '../utils/dateUtils.js';
import { generateId } from '../utils/idGenerator.js';
import './Dashboard.css';

/* Hero ring constants */
const R_SIZE = 120;
const R_STROKE = 7;
const R_RADIUS = (R_SIZE - R_STROKE) / 2;
const R_CIRC = 2 * Math.PI * R_RADIUS;

function WeekScorecard({ weekData, targets }) {
  const maxKcal = Math.max(...weekData.map(d => d.kcalPct), 1.2);
  const maxProt = Math.max(...weekData.map(d => d.proteinPct), 1.2);
  const goalKcalPct = (1 / maxKcal) * 100;
  const goalProtPct = (1 / maxProt) * 100;

  return (
    <div className="ov-bars">
      {/* ——— Calories row ——— */}
      <div className="ov-bar-section">
        <div className="ov-bar-header">
          <span className="ov-bar-label" style={{ color: '#ff9500' }}>
            <svg width="9" height="9" viewBox="0 0 16 16" fill="#ff9500"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
            Calories
          </span>
        </div>
        <div className="ov-bar-chart-wrap">
          <div className="ov-bar-chart">
            <div className="ov-bar-goal" style={{ bottom: `${goalKcalPct}%`, borderColor: 'rgba(255,149,0,0.45)' }} />
            {weekData.map((d) => {
              const h = d.hasData ? (d.kcalPct / maxKcal) * 100 : 0;
              const met = d.hasData && d.kcalPct > 0 && d.kcalPct <= 1;
              return (
                <div key={d.dateKey} className="ov-bar-col">
                  <div className="ov-bar" style={{
                    height: `${Math.max(h, d.hasData ? 5 : 0)}%`,
                    background: d.hasData ? (met ? '#ff9500' : 'rgba(255,149,0,0.35)') : 'transparent',
                  }} />
                </div>
              );
            })}
          </div>
          <div className="ov-bar-goal-label" style={{ bottom: `${goalKcalPct}%`, color: '#ff9500' }}>
            <span>Goal</span>
            <span>{targets.kcal}</span>
          </div>
        </div>
      </div>

      {/* ——— Protein row ——— */}
      <div className="ov-bar-section">
        <div className="ov-bar-header">
          <span className="ov-bar-label" style={{ color: '#0a84ff' }}>
            <svg width="9" height="9" viewBox="0 0 32 32" fill="#0a84ff"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>
            Protein
          </span>
        </div>
        <div className="ov-bar-chart-wrap">
          <div className="ov-bar-chart">
            <div className="ov-bar-goal" style={{ bottom: `${goalProtPct}%`, borderColor: 'rgba(10,132,255,0.45)' }} />
            {weekData.map((d) => {
              const h = d.hasData ? (d.proteinPct / maxProt) * 100 : 0;
              const met = d.hasData && d.proteinPct >= 1;
              return (
                <div key={d.dateKey} className="ov-bar-col">
                  <div className="ov-bar" style={{
                    height: `${Math.max(h, d.hasData ? 5 : 0)}%`,
                    background: d.hasData ? (met ? '#0a84ff' : 'rgba(10,132,255,0.35)') : 'transparent',
                  }} />
                </div>
              );
            })}
          </div>
          <div className="ov-bar-goal-label" style={{ bottom: `${goalProtPct}%`, color: '#0a84ff' }}>
            <span>Goal</span>
            <span>{Math.round(targets.protein)}g</span>
          </div>
        </div>
      </div>

      {/* Day labels aligned under the chart columns */}
      <div className="ov-bar-days-row">
        {weekData.map((d) => (
          <span key={d.dateKey} className={`ov-bar-day-label${d.isToday ? ' ov-bar-day-label--today' : ''}`}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function HeroRing({ pct, gradId, gradStart, gradEnd, label, value, unit, isOver, mounted, icon }) {
  const offset = mounted ? R_CIRC * (1 - Math.min(pct, 1)) : R_CIRC;
  return (
    <div className="ov-hero-ring">
      <div className="ov-hero-ring-wrap" style={{ '--ring-glow': gradStart }}>
        <svg width={R_SIZE} height={R_SIZE}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradStart} />
              <stop offset="100%" stopColor={gradEnd} />
            </linearGradient>
          </defs>
          <circle cx={R_SIZE / 2} cy={R_SIZE / 2} r={R_RADIUS}
            fill="none" stroke="var(--color-text-secondary)" strokeWidth={R_STROKE} opacity="0.06" />
          <circle cx={R_SIZE / 2} cy={R_SIZE / 2} r={R_RADIUS}
            fill="none" stroke={`url(#${gradId})`} strokeWidth={R_STROKE}
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
  const [waterSplash, setWaterSplash] = useState(false);
  const [lastWaterAmt, setLastWaterAmt] = useState(null);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const handleWaterAdd = useCallback((liters) => {
    dispatch({
      type: 'ADD_WATER',
      payload: {
        id: generateId(),
        amountLiters: liters,
        dateKey: getToday(),
        timestamp: Date.now(),
      },
    });
    setLastWaterAmt(liters);
    setWaterSplash(true);
    setTimeout(() => { setWaterSplash(false); setLastWaterAmt(null); }, 700);
  }, [dispatch]);

  const kcalEaten = Math.round(todayTotals.kcal);
  const isOver = kcalEaten > targets.kcal;
  const waterTarget = targets.waterTargetLiters || 2.5;
  const kcalPct = Math.min(kcalEaten / targets.kcal, 1);

  const proteinEaten = Math.round(todayTotals.protein);
  const proteinTarget = Math.round(targets.protein);
  const proteinPct = Math.min(proteinEaten / proteinTarget, 1);

  // Gradient colors — vibrant, state-aware
  const kcalGradStart = isOver ? '#ff3b30' : kcalPct > 0.85 ? '#ff6b3d' : '#ff9500';
  const kcalGradEnd = isOver ? '#ff2d55' : kcalPct > 0.85 ? '#ff3b30' : '#ff6b3d';
  const protGradStart = proteinPct >= 1 ? '#34c759' : '#0a84ff';
  const protGradEnd = proteinPct >= 1 ? '#30d158' : '#007aff';

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (targets.userName || '').split(' ')[0];

  // Perfect day detection (calories on track + protein hit)
  const todayLogged = kcalEaten > 0;
  const isPerfectDay = todayLogged && !isOver && proteinPct >= 1;

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

  // Weekly summary
  const weekSummary = useMemo(() => {
    const tracked = weekData.filter(d => d.hasData);
    const onTrack = tracked.filter(d => d.kcalPct > 0 && d.kcalPct <= 1.05 && d.proteinPct >= 0.9);
    return { tracked: tracked.length, onTrack: onTrack.length };
  }, [weekData]);

  // Smart greeting sub-line
  const greetingSub = useMemo(() => {
    if (isPerfectDay) return 'All targets hit today!';
    if (streak >= 5) return `${streak}-day streak — unstoppable!`;
    if (streak >= 3) return `${streak}-day streak — keep it going!`;
    if (proteinPct >= 1 && todayLogged) return 'Protein goal hit!';
    if (weekSummary.onTrack >= 5) return 'Strong week so far!';
    if (!todayLogged && streak >= 1) return 'Keep your streak alive today!';
    return null;
  }, [isPerfectDay, streak, proteinPct, todayLogged, weekSummary]);

  // Weight change estimate
  const wc = useMemo(
    () => calcWeightChange(entries, state.exerciseLogs, targets),
    [entries, state.exerciseLogs, targets]
  );

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
    // Weight change insight
    if (wc.daysTracked >= 3 && wc.goal !== 'maintain') {
      const pctNum = Math.round(wc.pct * 100);
      if (wc.goal === 'lose' && wc.deltaKg > 0) {
        if (pctNum >= 100) msgs.push({ tag: 'Weight Goal', text: `You've reached your ${wc.goalKg} kg goal — amazing work!`, level: 'good' });
        else msgs.push({ tag: 'Weight Goal', text: `~${wc.deltaKg.toFixed(1)} kg lost — ${pctNum}% toward your ${wc.goalKg} kg goal.`, level: 'good' });
      } else if (wc.goal === 'gain' && wc.deltaKg < 0) {
        if (pctNum >= 100) msgs.push({ tag: 'Weight Goal', text: `You've reached your ${wc.goalKg} kg gain goal — great work!`, level: 'good' });
        else msgs.push({ tag: 'Weight Goal', text: `~${Math.abs(wc.deltaKg).toFixed(1)} kg gained — ${pctNum}% toward your ${wc.goalKg} kg goal.`, level: 'good' });
      }
    }
    return msgs;
  }, [todayTotals, isOver, kcalEaten, targets, proteinPct, proteinEaten, proteinTarget, todayWaterTotal, waterTarget, hour, caloriesBurned, weekData, wc]);

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

  return (
    <div className="overview">
      {/* Streak badge — top right */}
      <div className={`ov-streak${streak > 0 ? ' ov-streak--active' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={streak > 0 ? 'var(--color-success)' : 'var(--color-text-secondary)'} stroke="none" opacity={streak > 0 ? 1 : 0.35}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <span className="ov-streak-num" style={streak === 0 ? { color: 'var(--color-text-secondary)', opacity: 0.4 } : undefined}>{streak}</span>
      </div>

      {/* 1. Greeting */}
      <div className="ov-greeting-wrap ov-enter ov-enter--1">
        <p className="ov-greeting">
          {timeGreeting}{firstName ? `, ${firstName}` : ''}!
        </p>
        {greetingSub && <p className="ov-greeting-sub">{greetingSub}</p>}
      </div>

      {/* 2. Weekly scorecard */}
      <div className="ov-week ov-enter ov-enter--2">
        <WeekScorecard weekData={weekData} targets={targets} />
      </div>

      {/* 3. Weight change — motivational bridge between week and today */}
      {wc.daysTracked >= 3 && wc.goal !== 'maintain' && (() => {
        const isLose = wc.goal === 'lose';
        const absKg = Math.abs(wc.deltaKg).toFixed(1);
        const pctNum = Math.round(wc.pct * 100);
        let wcMsg = '';
        if (pctNum >= 100) {
          wcMsg = `${absKg} kg ${isLose ? 'lost' : 'gained'} — you did it!`;
        } else if (!todayLogged && pctNum > 0) {
          wcMsg = 'Keep your momentum going!';
        } else if (!todayLogged) {
          wcMsg = 'Log your first meal to start.';
        } else if (isOver && isLose) {
          wcMsg = 'One day doesn\u2019t define you.';
        } else if (pctNum >= 75) {
          wcMsg = 'Almost there — so close!';
        } else if (pctNum >= 25) {
          wcMsg = `${absKg} kg ${isLose ? 'down' : 'up'} — real progress!`;
        } else if (pctNum > 0) {
          wcMsg = 'You\u2019re on your way!';
        } else {
          wcMsg = isLose ? 'Great start!' : 'Keep fueling!';
        }

        const msData = [
          { pct: 25, label: 'Started', color: '#0a84ff' },
          { pct: 50, label: 'Halfway', color: '#007aff' },
          { pct: 75, label: 'Almost', color: '#00b4d8' },
          { pct: 100, label: 'Goal', color: '#34c759', isGoal: true },
        ];
        const nextMs = msData.find(m => pctNum < m.pct);

        return (
          <div className={`ov-wc ov-enter ov-enter--2${pctNum >= 100 ? ' ov-wc--done' : ''}`}>
            <p className="ov-wc-msg">{wcMsg}</p>
            <div className="ov-wc-path">
              <div className="ov-wc-track">
                <div className="ov-wc-track-fill" style={{ width: `${Math.min(pctNum, 100)}%` }} />
              </div>
              {pctNum > 0 && pctNum < 100 && (
                <span className="ov-wc-pct-flag" style={{ left: `${pctNum}%` }}>{pctNum}%</span>
              )}
              {msData.map((ms) => {
                const reached = pctNum >= ms.pct;
                const isNext = ms === nextMs;
                if (ms.isGoal) {
                  return (
                    <div key={ms.pct}
                      className={`ov-wc-ms ov-wc-ms--goal${reached ? ' ov-wc-ms--done' : ''}${isNext ? ' ov-wc-ms--next' : ''}`}
                      style={{ left: `${ms.pct}%` }}>
                      <span className="ov-wc-goal-emoji">{reached ? '\uD83C\uDFC6' : '\uD83C\uDFAF'}</span>
                      <span className="ov-wc-ms-label ov-wc-goal-label">
                        {isLose ? '-' : '+'}{wc.goalKg}kg
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={ms.pct}
                    className={`ov-wc-ms${reached ? ' ov-wc-ms--done' : ''}${isNext ? ' ov-wc-ms--next' : ''}`}
                    style={{ left: `${ms.pct}%` }}>
                    <div className="ov-wc-ms-dot"
                      style={reached ? { background: ms.color, borderColor: ms.color } : undefined}>
                      {reached && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 13 4 4L18 7"/></svg>
                      )}
                    </div>
                    <span className="ov-wc-ms-label" style={reached ? { color: ms.color, opacity: 0.9 } : undefined}>
                      {ms.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 4. Today remaining summary */}
      <div className="ov-today-strip ov-enter ov-enter--3">
        <span className="ov-today-label">Today</span>
        {todayLogged ? (
          <span className="ov-today-remaining">
            {isOver ? 'Over target' : `${(targets.kcal - kcalEaten).toLocaleString()} cal`}
            {' · '}
            {proteinPct >= 1 ? 'Protein hit' : `${proteinTarget - proteinEaten}g protein`}
            <span className="ov-today-suffix"> left</span>
          </span>
        ) : (
          <span className="ov-today-remaining">Start logging to see your day</span>
        )}
      </div>

      {/* 5. Two hero rings + celebration */}
      <div className={`ov-heroes ov-enter ov-enter--3${isPerfectDay ? ' ov-heroes--perfect' : ''}`}>
        <HeroRing
          pct={kcalPct} gradId="kcal-grad" gradStart={kcalGradStart} gradEnd={kcalGradEnd}
          label="Calories" mounted={mounted} isOver={isOver}
          value={`${kcalEaten.toLocaleString()}`}
          unit={`/ ${targets.kcal.toLocaleString()}`}
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill={kcalGradStart} stroke="none"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>}
        />
        <HeroRing
          pct={proteinPct} gradId="prot-grad" gradStart={protGradStart} gradEnd={protGradEnd}
          label="Protein" mounted={mounted} isOver={false}
          value={`${proteinEaten}`}
          unit={`/ ${proteinTarget}g`}
          icon={<svg width="12" height="12" viewBox="0 0 32 32" fill={protGradStart} stroke="none"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>}
        />
      </div>
      {isPerfectDay && (
        <div className="ov-perfect ov-enter ov-enter--4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 13 4 4L18 7"/></svg>
          <span>All targets hit</span>
        </div>
      )}

      {/* 6. Water glass */}
      {(() => {
        const waterPct = Math.min(todayWaterTotal / waterTarget, 1);
        const done = todayWaterTotal >= waterTarget;
        // 4 tiers: low, mid, good, done
        const tier = done ? 'done' : waterPct >= 0.65 ? 'good' : waterPct >= 0.3 ? 'mid' : 'low';

        // Tier-aware colors — grey → light blue → vivid blue → celebratory blue
        const waterColors = {
          low:  { top: '#b0b8c1', bot: '#8e99a4', wave1: 'rgba(176,184,193,0.3)', wave2: 'rgba(142,153,164,0.2)', stroke: '#8e99a4' },
          mid:  { top: '#7ec8e3', bot: '#4ba3d4', wave1: 'rgba(126,200,227,0.3)', wave2: 'rgba(75,163,212,0.2)', stroke: '#4ba3d4' },
          good: { top: '#3db4f2', bot: '#0a84ff', wave1: 'rgba(61,180,242,0.35)', wave2: 'rgba(10,132,255,0.25)', stroke: '#0a84ff' },
          done: { top: '#3db4f2', bot: '#0a84ff', wave1: 'rgba(61,180,242,0.35)', wave2: 'rgba(10,132,255,0.25)', stroke: '#0a84ff' },
        }[tier];

        const hoverMsg = {
          low: 'Don\u2019t forget to drink water!',
          mid: 'Keep sipping, you\u2019re getting there!',
          good: 'Almost there \u2014 great job!',
          done: 'Hydration goal smashed!',
        }[tier];

        return (
          <div className={`ov-water-wrap${waterSplash ? ' ov-water-wrap--splash' : ''}`}>
            <div className={`ov-water-float ov-water-float--${tier}`}>
              {/* Left column: glass + controls */}
              <div className="ov-water-left">
                <svg className="ov-water-glass" width="28" height="38" viewBox="0 0 24 32" fill="none">
                  <defs>
                    <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={waterColors.top}/>
                      <stop offset="100%" stopColor={waterColors.bot}/>
                    </linearGradient>
                    <clipPath id="glass-clip">
                      <path d="M5 4 L5 25 Q5 30 12 30 Q19 30 19 25 L19 4Z"/>
                    </clipPath>
                  </defs>
                  {(() => {
                    const gH = 26;
                    const fH = gH * waterPct;
                    const fY = 4 + (gH - fH);
                    return <>
                      <rect x="4" y={fY} width="16" height={fH + 2}
                        fill="url(#water-grad)" clipPath="url(#glass-clip)" className="ov-water-fill"/>
                      {waterPct > 0 && waterPct < 1 && <>
                        <path
                          d={`M4 ${fY+1} Q8 ${fY-1.5} 12 ${fY+1} Q16 ${fY+3} 20 ${fY+1} L20 ${fY+4} L4 ${fY+4}Z`}
                          fill={waterColors.wave1} clipPath="url(#glass-clip)"
                          className="ov-water-wave ov-water-wave--1"/>
                        <path
                          d={`M4 ${fY+1.5} Q9 ${fY+3} 12 ${fY+1} Q15 ${fY-1} 20 ${fY+1.5} L20 ${fY+4} L4 ${fY+4}Z`}
                          fill={waterColors.wave2} clipPath="url(#glass-clip)"
                          className="ov-water-wave ov-water-wave--2"/>
                      </>}
                    </>;
                  })()}
                  {/* Glass body — straight cylinder, rounded bottom */}
                  <path d="M5 4 L5 25 Q5 30 12 30 Q19 30 19 25 L19 4"
                    stroke={waterColors.stroke} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinejoin="round"/>
                  {/* Rim — straight lip, slightly wider */}
                  <line x1="4" y1="4" x2="20" y2="4"
                    stroke={waterColors.stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                  {/* Glass shine */}
                  <line x1="7.5" y1="7" x2="7.5" y2="25"
                    stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <div className="ov-water-controls">
                  <button className="ov-water-ctrl" aria-label="Add 0.25L"
                    onClick={() => handleWaterAdd(0.25)}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>
                  </button>
                  <button className="ov-water-ctrl" aria-label="Remove 0.25L"
                    disabled={todayWaterTotal <= 0}
                    onClick={() => {
                      const logs = (state.waterLogs || []).filter(l => l.dateKey === getToday());
                      if (logs.length > 0) dispatch({ type: 'DELETE_WATER', payload: logs[logs.length - 1].id });
                    }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="6" y1="12" x2="18" y2="12"/></svg>
                  </button>
                </div>
              </div>
              {/* Right side: hint (top) + amount (bottom) */}
              <div className="ov-water-right">
                <div className={`ov-water-hint ov-water-hint--${tier}`} aria-label={hoverMsg}>
                  {done ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 13 4 4L18 7"/></svg>
                  ) : tier === 'good' ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2c-5.33 8-10 11.33-10 16a10 10 0 0 0 20 0C22 13.33 17.33 8 12 2z"/>
                    </svg>
                  ) : tier === 'mid' ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ba3d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2c-5.33 8-10 11.33-10 16a10 10 0 0 0 20 0C22 13.33 17.33 8 12 2z"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="13"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                  <span className="ov-water-hint-msg">{hoverMsg}</span>
                </div>
                <div className="ov-water-float-info">
                  {done ? (
                    <span className="ov-water-float-amt">{todayWaterTotal.toFixed(1)}L</span>
                  ) : (
                    <span className="ov-water-float-amt">
                      {todayWaterTotal === 0 ? `${waterTarget}` : `${(waterTarget - todayWaterTotal).toFixed(1)}`}L
                    </span>
                  )}
                  <span className="ov-water-float-sub">{done ? 'done!' : 'left'}</span>
                </div>
              </div>
            </div>
            {/* Splash feedback */}
            {waterSplash && <span className="ov-water-splash">+{lastWaterAmt === 1 ? '1L' : `${lastWaterAmt * 1000}ml`}</span>}
          </div>
        );
      })()}

      {/* 7. Swipeable insights */}
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

    </div>
  );
}
