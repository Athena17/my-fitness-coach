import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/useApp.js';
import { formatDateKey, getToday } from '../utils/dateUtils.js';
import { sumNutrition, calcWeightChange } from '../utils/nutritionCalc.js';
import { exportData, importData, clearAllData } from '../utils/storage.js';
import Modal from '../components/Modal.jsx';
import './Profile.css';

/* ——— Monthly scorecard helpers ——— */
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMonthWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ——— Settings icons ——— */
function TargetIcon({ type }) {
  if (type === 'weight') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" /><path d="m8 7 4-4 4 4" /><path d="m8 17 4 4 4-4" />
    </svg>
  );
  if (type === 'calories') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
  if (type === 'protein') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 7 4.2 7 7c0 2 1.2 3.8 3 4.6V20a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2v-8.4c1.8-.8 3-2.6 3-4.6 0-2.8-2-5-5-5z" />
    </svg>
  );
  if (type === 'water') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
    </svg>
  );
  return null;
}

export default function Profile() {
  const { state, dispatch } = useApp();
  const { entries, targets } = state;
  const today = getToday();
  const fileInputRef = useRef(null);

  /* ——— Month navigation ——— */
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
      if (targets.kcal > 0 && (totals.kcal - burn) <= targets.kcal) calOkDays++;
      if (targets.protein > 0 && totals.protein >= targets.protein) protOkDays++;
    }
    return { tracked, calOkDays, protOkDays };
  }, [viewYear, viewMonth, dayMap, burnByDay, targets]);

  /* ——— Weight change ——— */
  const wc = useMemo(
    () => calcWeightChange(entries, state.exerciseLogs, targets),
    [entries, state.exerciseLogs, targets]
  );

  /* ——— Settings state ——— */
  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(targets.userName || '');
  const [weightLossTarget, setWeightLossTarget] = useState(String(targets.weightLossTarget || 5));
  const [kcal, setKcal] = useState(String(targets.kcal));
  const [protein, setProtein] = useState(String(targets.protein));
  const [water, setWater] = useState(String(targets.waterTargetLiters || 2.5));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  function startEditing() {
    setUserName(targets.userName || '');
    setWeightLossTarget(String(targets.weightLossTarget || 5));
    setKcal(String(targets.kcal));
    setProtein(String(targets.protein));
    setWater(String(targets.waterTargetLiters || 2.5));
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() { setEditing(false); setErrors({}); }

  function handleSave(e) {
    e.preventDefault();
    const errs = {};
    const k = Number(kcal), p = Number(protein), w = Number(weightLossTarget), wt = Number(water);
    if (!userName.trim()) errs.userName = 'Enter your name';
    if (!k || k < 500 || k > 10000) errs.kcal = '500–10,000';
    if (!p || p < 10 || p > 500) errs.protein = '10–500';
    if (!w || w < 0.5 || w > 100) errs.weightLossTarget = '0.5–100';
    if (!wt || wt < 0.5 || wt > 15) errs.water = '0.5–15';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    dispatch({
      type: 'SET_TARGETS',
      payload: {
        userName: userName.trim(), kcal: k, protein: p, waterTargetLiters: wt,
        maintenanceKcal: targets.maintenanceKcal || targets.kcal, weightLossTarget: w,
      },
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myfitnesscoach-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = importData(ev.target.result);
        dispatch({ type: 'IMPORT_DATA', payload: result });
        setImportMessage('Data imported successfully!');
        setEditing(false);
      } catch {
        setImportMessage('Failed to import. Invalid file format.');
      }
      setTimeout(() => setImportMessage(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClearData() { clearAllData(); window.location.reload(); }

  const maintenanceKcal = targets.maintenanceKcal || targets.kcal;

  return (
    <div className="profile">
      {/* ——— User header ——— */}
      <div className="profile-header">
        <div className="profile-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        </div>
        {editing ? (
          <div className="profile-name-group">
            <input
              className="profile-name-input"
              type="text" value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name" autoFocus
            />
            {errors.userName && <span className="form-error">{errors.userName}</span>}
          </div>
        ) : (
          <span className="profile-name-display">{targets.userName || 'Your name'}</span>
        )}
      </div>

      {/* ——— Monthly Progress ——— */}
      <div className="settings-section">
        <div className="progress-header">
          <button className="progress-nav-btn" onClick={prevMonth} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span className="progress-month-label">{formatMonthLabel(viewYear, viewMonth)}</span>
          <button className="progress-nav-btn" onClick={nextMonth} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        {monthStats.tracked > 0 && (
          <div className="progress-summary">
            <span className="progress-stat"><span className="progress-stat-value">{monthStats.tracked}</span> tracked</span>
            <span className="progress-stat-sep" />
            <span className="progress-stat">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-success)" stroke="none"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
              <span className="progress-stat-value">{monthStats.calOkDays}</span>
            </span>
            <span className="progress-stat-sep" />
            <span className="progress-stat">
              <svg width="10" height="10" viewBox="0 0 32 32" fill="var(--color-success)" stroke="none"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>
              <span className="progress-stat-value">{monthStats.protOkDays}</span>
            </span>
          </div>
        )}

        <div className="progress-grid">
          <div className="progress-week-row progress-weekday-row">
            {WEEKDAYS.map((w, i) => <div key={i} className="progress-weekday">{w}</div>)}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="progress-week-row">
              {week.map((dayNum, di) => {
                if (dayNum === null) return <div key={`pad-${di}`} className="progress-card progress-card--pad" />;

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
                      <svg width="11" height="11" viewBox="0 0 16 16" fill={calColor} opacity={calOk ? 0.85 : 0.45}>
                        <path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/>
                      </svg>
                      <span className="progress-card-divider" />
                      <svg width="12" height="12" viewBox="0 0 32 32" fill={protColor} opacity={protOk ? 0.85 : 0.45}>
                        <path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/>
                        <circle cx="5.5" cy="27" r="2" fill={protColor}/>
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
                <svg width="10" height="10" viewBox="0 0 32 32" fill="var(--color-success)" stroke="none"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>
                <span>Goal met</span>
              </div>
              <div className="progress-legend-item">
                <svg width="10" height="10" viewBox="0 0 32 32" fill="var(--color-danger)" stroke="none" opacity="0.45"><path d="M20 2c-5 0-9 4-9 9 0 1.2.2 2.3.7 3.3L5.3 20.7c-.8.8-1.3 2-1.3 3 0 .8.3 1.4.8 1.8l.7.7c.4.4 1 .8 1.8.8 1 0 2.2-.5 3-1.3l6.4-6.4c1 .5 2.1.7 3.3.7 5 0 9-4 9-9s-4-9-9-9z"/><circle cx="5.5" cy="27" r="2"/></svg>
                <span>Under target</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ——— Weight Change Journey ——— */}
      {wc.daysTracked > 0 && (() => {
        const isLose = wc.goal === 'lose';
        const isGain = wc.goal === 'gain';
        const hasGoal = isLose || isGain;
        const sign = wc.deltaKg > 0 ? '\u2212' : '+';
        const abs = Math.abs(wc.deltaKg).toFixed(1);
        const since = wc.firstDate ? new Date(wc.firstDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const pctNum = Math.round(wc.pct * 100);

        // Dynamic celebration messages
        let message = '';
        if (!hasGoal) {
          message = `${wc.daysTracked} days of tracking. Keep it going!`;
        } else if (pctNum >= 100) {
          message = isLose ? 'Goal reached! Incredible discipline.' : 'Goal reached! Amazing commitment.';
        } else if (pctNum >= 75) {
          message = 'So close! The finish line is within reach.';
        } else if (pctNum >= 50) {
          message = 'Halfway there! Your consistency is paying off.';
        } else if (pctNum >= 25) {
          message = 'Great progress — real momentum building!';
        } else if (wc.daysTracked >= 7) {
          message = 'Every day counts. Keep showing up!';
        } else {
          message = 'Just getting started. You\'ve got this!';
        }

        const ringSize = 120;
        const ringStroke = 7;
        const ringR = (ringSize - ringStroke) / 2;
        const ringCirc = 2 * Math.PI * ringR;
        const ringOffset = hasGoal ? ringCirc * (1 - Math.min(wc.pct, 1)) : ringCirc;
        const milestones = [25, 50, 75, 100];
        const gradStart = isLose ? '#34c759' : '#007aff';
        const gradEnd = isLose ? '#30d158' : '#5856d6';

        return (
          <div className="wc-card" style={{ '--wc-accent': gradStart, '--wc-accent-end': gradEnd }}>
            {/* Hero ring */}
            <div className="wc-hero">
              {hasGoal ? (
                <div className="wc-ring-wrap">
                  <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                    <defs>
                      <linearGradient id="wc-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={gradStart} />
                        <stop offset="100%" stopColor={gradEnd} />
                      </linearGradient>
                    </defs>
                    <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={ringStroke} />
                    <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="url(#wc-grad)" strokeWidth={ringStroke}
                      strokeDasharray={ringCirc} strokeDashoffset={ringOffset} strokeLinecap="round"
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                      className="wc-ring-anim" />
                  </svg>
                  <div className="wc-ring-center">
                    <span className="wc-delta">{sign}{abs}</span>
                    <span className="wc-delta-unit">kg</span>
                  </div>
                </div>
              ) : (
                <div className="wc-num-only">
                  <span className="wc-delta">{sign}{abs}</span>
                  <span className="wc-delta-unit">kg estimated change</span>
                </div>
              )}
            </div>

            {/* Milestone track */}
            {hasGoal && (
              <div className="wc-milestones">
                <div className="wc-milestone-track">
                  <div className="wc-milestone-fill" style={{ width: `${Math.min(pctNum, 100)}%` }} />
                </div>
                <div className="wc-milestone-labels">
                  {milestones.map((m) => (
                    <div key={m} className={`wc-milestone${pctNum >= m ? ' wc-milestone--reached' : ''}`}>
                      <div className="wc-milestone-dot" />
                      <span className="wc-milestone-text">{m}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Celebration message */}
            <p className="wc-message">{message}</p>

            {/* Stats row */}
            <div className="wc-stats">
              <div className="wc-stat">
                <span className="wc-stat-num">{wc.daysTracked}</span>
                <span className="wc-stat-label">days tracked</span>
              </div>
              <div className="wc-stat-sep" />
              {hasGoal && (
                <>
                  <div className="wc-stat">
                    <span className="wc-stat-num">{pctNum}%</span>
                    <span className="wc-stat-label">of goal</span>
                  </div>
                  <div className="wc-stat-sep" />
                  <div className="wc-stat">
                    <span className="wc-stat-num">{wc.goalKg}</span>
                    <span className="wc-stat-label">kg {isLose ? 'to lose' : 'to gain'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footnote */}
            <span className="wc-footnote">Estimated from food log · since {since}</span>
          </div>
        );
      })()}

      {/* ——— Targets ——— */}
      <div className="settings-section">
        <div className="section-header">
          <h2>Targets</h2>
          {!editing && (
            <button type="button" className="edit-btn" onClick={startEditing}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="targets-form">
            <div className="form-group">
              <label htmlFor="settings-weight-loss">Weight loss goal (kg)</label>
              <input id="settings-weight-loss" type="number" inputMode="decimal" value={weightLossTarget} onChange={(e) => setWeightLossTarget(e.target.value)} step="0.5" />
              {errors.weightLossTarget && <span className="form-error">{errors.weightLossTarget}</span>}
            </div>
            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="settings-kcal">Calorie target (cal)</label>
                <span className="form-annotation">Maintenance: {maintenanceKcal}</span>
              </div>
              <input id="settings-kcal" type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="e.g. 1500" />
              {errors.kcal && <span className="form-error">{errors.kcal}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="settings-protein">Protein target (g / day)</label>
              <input id="settings-protein" type="number" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="e.g. 120" />
              {errors.protein && <span className="form-error">{errors.protein}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="settings-water">Water target (L / day)</label>
              <input id="settings-water" type="number" inputMode="decimal" step="0.1" value={water} onChange={(e) => setWater(e.target.value)} placeholder="e.g. 2.5" />
              {errors.water && <span className="form-error">{errors.water}</span>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary settings-save-btn">Save</button>
              <button type="button" className="btn-cancel" onClick={cancelEditing}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="targets-display">
            <div className="target-row">
              <div className="target-row-left"><span className="target-icon"><TargetIcon type="weight" /></span><span className="target-label">Weight loss goal</span></div>
              <span className="target-value">{targets.weightLossTarget || 5} kg</span>
            </div>
            <div className="target-divider" />
            <div className="target-row">
              <div className="target-row-left"><span className="target-icon"><TargetIcon type="calories" /></span><div className="target-label-group"><span className="target-label">Calorie target</span><span className="target-sub">Maintenance: {maintenanceKcal} cal</span></div></div>
              <span className="target-value">{targets.kcal} cal</span>
            </div>
            <div className="target-divider" />
            <div className="target-row">
              <div className="target-row-left"><span className="target-icon"><TargetIcon type="protein" /></span><span className="target-label">Protein target</span></div>
              <span className="target-value">{targets.protein} g / day</span>
            </div>
            <div className="target-divider" />
            <div className="target-row">
              <div className="target-row-left"><span className="target-icon"><TargetIcon type="water" /></span><span className="target-label">Water target</span></div>
              <span className="target-value">{targets.waterTargetLiters || 2.5} L / day</span>
            </div>
          </div>
        )}
        {saved && <p className="settings-message">Saved!</p>}
      </div>

      {/* ——— Data ——— */}
      <div className="settings-section">
        <h2>Data</h2>
        <div className="settings-actions">
          <button type="button" className="btn-secondary" onClick={handleExport}>Export (JSON)</button>
          <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Import</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <button type="button" className="btn-secondary btn-danger-outline" onClick={() => setShowClearConfirm(true)}>Clear all data</button>
        </div>
        {importMessage && <p className="settings-message">{importMessage}</p>}
      </div>

      {/* ——— Recipe Book ——— */}
      <div className="settings-section">
        <h2>Recipe Book</h2>
        {state.recipes.length === 0 ? (
          <p className="settings-empty">No recipes yet. Use the Cook flow to create one.</p>
        ) : (
          <div className="settings-list">
            {state.recipes.map((recipe) => (
              <div key={recipe.id} className="settings-list-item">
                <div className="settings-list-info">
                  <span className="settings-list-name">{recipe.name}</span>
                  <span className="settings-list-meta">{recipe.servingsYield} servings · {recipe.perServing.kcal} cal / {recipe.perServing.protein}g per serving</span>
                </div>
                <button type="button" className="settings-list-delete" onClick={() => dispatch({ type: 'DELETE_RECIPE', payload: recipe.id })} aria-label="Delete recipe">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ——— Active Leftovers ——— */}
      <div className="settings-section">
        <h2>Active Leftovers</h2>
        {state.leftovers.filter((l) => l.remainingServings > 0).length === 0 ? (
          <p className="settings-empty">No active leftovers.</p>
        ) : (
          <div className="settings-list">
            {state.leftovers.filter((l) => l.remainingServings > 0).map((leftover) => (
              <div key={leftover.id} className="settings-list-item">
                <div className="settings-list-info">
                  <span className="settings-list-name">{leftover.name}</span>
                  <span className="settings-list-meta">{leftover.remainingServings} / {leftover.totalServings} servings left · cooked {leftover.dateCooked}</span>
                </div>
                <button type="button" className="settings-list-delete" onClick={() => dispatch({ type: 'DELETE_LEFTOVER', payload: leftover.id })} aria-label="Delete leftover">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="settings-section settings-about">
        <p>myfitnesscoach v1.2 — All data stored locally on your device.</p>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data" onClose={() => setShowClearConfirm(false)}>
          <p style={{ marginBottom: 16 }}>This will permanently delete all your entries and targets. This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-danger)', padding: '10px' }} onClick={handleClearData}>Clear Everything</button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }} onClick={() => setShowClearConfirm(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
