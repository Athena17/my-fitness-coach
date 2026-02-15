import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { getDayLabel } from '../utils/dateUtils.js';
import './History.css';

export default function History() {
  const { weekSummary } = useDailyEntries();

  return (
    <div className="history">
      <h1 className="history-title">History</h1>

      <div className="history-section">
        <h2>Last 7 Days</h2>
        <div className="history-grid">
          {weekSummary.map((day) => (
            <div key={day.dateKey} className="history-day">
              <span className="history-day-label">{getDayLabel(day.dateKey)}</span>
              <span className="history-day-kcal">{Math.round(day.kcal)} kcal</span>
              <span className="history-day-protein">{Math.round(day.protein)}g protein</span>
              <span className="history-day-count">{day.entryCount} items</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
