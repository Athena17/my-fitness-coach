import { calcPercentage } from '../utils/nutritionCalc.js';
import './ProgressBar.css';

export default function ProgressBar({ label, current, target, unit, colorVar }) {
  const pct = calcPercentage(current, target);
  const isOver = current > target;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className={`progress-bar-values ${isOver ? 'over' : ''}`}>
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${isOver ? 'over' : ''}`}
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: isOver ? 'var(--color-danger)' : `var(${colorVar})`,
          }}
        />
      </div>
      <span className="progress-bar-pct">{pct}%</span>
    </div>
  );
}
