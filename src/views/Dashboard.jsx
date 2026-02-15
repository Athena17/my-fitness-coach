import { useApp } from '../context/useApp.js';
import { VIEWS } from '../context/constants.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { getDayLabel } from '../utils/dateUtils.js';
import ProgressBar from '../components/ProgressBar.jsx';
import MealGroup from '../components/MealGroup.jsx';
import './Dashboard.css';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { todayEntries, todayTotals, weekSummary } = useDailyEntries();
  const { targets } = state;

  const groupedEntries = MEALS.map((meal) => ({
    meal,
    entries: todayEntries.filter((e) => e.meal === meal),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Today</h1>

      <div className="progress-section">
        <ProgressBar
          label="Calories"
          current={todayTotals.kcal}
          target={targets.kcal}
          unit="kcal"
          colorVar="--color-kcal"
        />
        <ProgressBar
          label="Protein"
          current={todayTotals.protein}
          target={targets.protein}
          unit="g"
          colorVar="--color-protein"
        />
      </div>

      <div className="meals-section">
        <div className="section-header">
          <h2>Meals</h2>
          <button
            className="btn-add-meal"
            onClick={() => dispatch({ type: 'SET_VIEW', payload: VIEWS.FOOD_LOG })}
          >
            + Add Food
          </button>
        </div>

        {groupedEntries.length === 0 ? (
          <div className="empty-state">
            <p>No food logged today.</p>
            <button
              className="btn-primary"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: VIEWS.FOOD_LOG })}
            >
              Log Your First Meal
            </button>
          </div>
        ) : (
          groupedEntries.map((group) => (
            <MealGroup key={group.meal} meal={group.meal} entries={group.entries} />
          ))
        )}
      </div>

      <div className="week-section">
        <h2>Last 7 Days</h2>
        <div className="week-grid">
          {weekSummary.map((day) => (
            <div key={day.dateKey} className="week-day">
              <span className="week-day-label">{getDayLabel(day.dateKey)}</span>
              <span className="week-day-kcal">{Math.round(day.kcal)} kcal</span>
              <span className="week-day-protein">{Math.round(day.protein)}g protein</span>
              <span className="week-day-count">{day.entryCount} items</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
