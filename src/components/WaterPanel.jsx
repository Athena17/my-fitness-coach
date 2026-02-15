import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import { computeWaterProgress } from '../utils/waterCalc.js';
import './WaterPanel.css';

const QUICK_AMOUNTS = [0.25, 0.5, 1];

function WaterGlass({ percent, pouring, overflowing }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const fillHeight = (clamped / 100) * 100;
  const fillY = 110 - fillHeight;
  const done = clamped >= 100;
  const color = done ? 'var(--color-success)' : 'var(--color-water)';

  return (
    <svg viewBox="0 0 80 140" className="water-glass-svg">
      <defs>
        <clipPath id="glass-clip">
          <path d="M15 8 Q15 4 19 4 L61 4 Q65 4 65 8 L62 112 Q62 118 56 118 L24 118 Q18 118 18 112 Z" />
        </clipPath>
        <linearGradient id="water-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Pour stream from top */}
      {pouring && (
        <rect
          x="37" y="0" width="6" height={fillY > 10 ? fillY : 10}
          rx="3"
          fill={color}
          opacity="0.6"
          className="water-pour-stream"
        />
      )}

      {/* Glass outline */}
      <path
        d="M15 8 Q15 4 19 4 L61 4 Q65 4 65 8 L62 112 Q62 118 56 118 L24 118 Q18 118 18 112 Z"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1.5"
      />

      {/* Water fill */}
      <g clipPath="url(#glass-clip)">
        {clamped > 0 && (
          <>
            <path
              d={`M10 ${fillY} Q20 ${fillY - 4} 30 ${fillY} Q40 ${fillY + 4} 50 ${fillY} Q60 ${fillY - 4} 70 ${fillY} L70 120 L10 120 Z`}
              fill="url(#water-gradient)"
              className={`water-glass-fill ${pouring ? 'water-glass-fill--waving' : ''}`}
            />
            <ellipse
              cx="40" cy={fillY + 2}
              rx="22" ry="1.5"
              fill="rgba(255,255,255,0.3)"
            />
          </>
        )}
      </g>

      {/* Overflow drops when full and still adding */}
      {overflowing && (
        <>
          <circle cx="22" cy="120" r="3" fill={color} opacity="0.7" className="water-drop water-drop--1" />
          <circle cx="40" cy="118" r="2.5" fill={color} opacity="0.6" className="water-drop water-drop--2" />
          <circle cx="56" cy="121" r="2" fill={color} opacity="0.5" className="water-drop water-drop--3" />
        </>
      )}

      {/* Splash ripples when pouring */}
      {pouring && clamped > 0 && (
        <>
          <ellipse cx="40" cy={fillY} rx="8" ry="2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" className="water-ripple water-ripple--1" />
          <ellipse cx="40" cy={fillY} rx="14" ry="3" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" className="water-ripple water-ripple--2" />
        </>
      )}

      {/* Glass shine */}
      <path
        d="M22 10 L20 80"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WaterPanel() {
  const { state, dispatch } = useApp();
  const { todayWaterLogs, todayWaterTotal } = useDailyEntries();
  const [manualAmount, setManualAmount] = useState('');
  const [pouring, setPouring] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const pourTimer = useRef(null);
  const overflowTimer = useRef(null);

  const target = state.targets.waterTargetLiters || 2.5;
  const progress = computeWaterProgress(todayWaterTotal, target);

  const hour = new Date().getHours();
  const isBehind = hour >= 18 && progress < 50;

  const triggerPour = useCallback(() => {
    clearTimeout(pourTimer.current);
    clearTimeout(overflowTimer.current);
    setPouring(true);
    pourTimer.current = setTimeout(() => setPouring(false), 800);
  }, []);

  const triggerOverflow = useCallback(() => {
    clearTimeout(overflowTimer.current);
    setOverflowing(true);
    overflowTimer.current = setTimeout(() => setOverflowing(false), 1200);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(pourTimer.current);
      clearTimeout(overflowTimer.current);
    };
  }, []);

  function handleAddWater(liters) {
    return () => {
      const newTotal = todayWaterTotal + liters;
      const willOverflow = newTotal / target >= 1;

      dispatch({
        type: 'ADD_WATER',
        payload: {
          id: generateId(),
          amountLiters: liters,
          dateKey: getToday(),
          timestamp: Date.now(),
        },
      });

      triggerPour();
      if (willOverflow && progress >= 100) {
        triggerOverflow();
      }
    };
  }

  function handleManualAdd(e) {
    e.preventDefault();
    const amt = Number(manualAmount);
    if (!amt || amt <= 0) return;
    handleAddWater(amt)();
    setManualAmount('');
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_WATER', payload: id });
  }

  return (
    <div className="water-panel">
      {/* Visual glass */}
      <div className="water-glass-card">
        <div className="water-glass-wrap">
          <WaterGlass percent={progress} pouring={pouring} overflowing={overflowing} />
        </div>
        <div className="water-glass-info">
          <span className={`water-glass-amount ${progress >= 100 ? 'water-glass-amount--done' : ''}`}>
            {todayWaterTotal.toFixed(1)} L
          </span>
          <span className="water-glass-target">of {target} L</span>
          <span className={`water-glass-pct ${progress >= 100 ? 'water-glass-pct--done' : ''}`}>
            {Math.min(progress, 999)}%
          </span>
          {progress >= 100 && (
            <span className="water-status water-status--done">Target reached!</span>
          )}
          {isBehind && (
            <span className="water-status water-status--behind">Behind on hydration</span>
          )}
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="water-quick-add">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            className="water-quick-btn"
            onClick={handleAddWater(amt)}
          >
            +{amt} L
          </button>
        ))}
      </div>

      {/* Manual input */}
      <form className="water-manual" onSubmit={handleManualAdd}>
        <input
          type="number"
          className="water-manual-input"
          placeholder="Custom (L)"
          step="0.1"
          min="0.1"
          max="10"
          value={manualAmount}
          onChange={(e) => setManualAmount(e.target.value)}
        />
        <button
          type="submit"
          className="water-manual-btn"
          disabled={!manualAmount || Number(manualAmount) <= 0}
        >
          Add
        </button>
      </form>

      {/* Today's log */}
      {todayWaterLogs.length > 0 && (
        <div className="water-log-section">
          <span className="water-log-title">Today's log</span>
          <div className="water-log-list">
            {todayWaterLogs.map((log) => (
              <div key={log.id} className="water-log-item">
                <span className="water-log-amount">{log.amountLiters} L</span>
                <span className="water-log-time">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  className="water-log-delete"
                  onClick={() => handleDelete(log.id)}
                  aria-label="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
