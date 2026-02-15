import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import './Onboarding.css';

export default function Onboarding() {
  const { dispatch } = useApp();
  const [kcal, setKcal] = useState('2000');
  const [protein, setProtein] = useState('120');
  const [maintenanceKcal, setMaintenanceKcal] = useState('2500');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    const k = Number(kcal);
    const p = Number(protein);
    const m = Number(maintenanceKcal);
    if (!k || k < 500 || k > 10000) e.kcal = 'Enter a value between 500–10,000';
    if (!p || p < 10 || p > 500) e.protein = 'Enter a value between 10–500';
    if (!m || m < 500 || m > 10000) e.maintenanceKcal = 'Enter a value between 500–10,000';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    dispatch({
      type: 'SET_TARGETS',
      payload: {
        kcal: Number(kcal),
        protein: Number(protein),
        maintenanceKcal: Number(maintenanceKcal),
        onboardingComplete: true,
      },
    });
  }

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <h1 className="onboarding-title">myfitnesscoach</h1>
        <p className="onboarding-subtitle">Set your daily nutrition targets to get started.</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="kcal">Daily Calorie Target (kcal)</label>
            <input
              id="kcal"
              type="number"
              inputMode="numeric"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              placeholder="2000"
            />
            {errors.kcal && <span className="form-error">{errors.kcal}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="protein">Daily Protein Target (g)</label>
            <input
              id="protein"
              type="number"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="120"
            />
            {errors.protein && <span className="form-error">{errors.protein}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="maintenance">Maintenance Calories (kcal)</label>
            <p className="form-hint">Your estimated daily calories to maintain current weight.</p>
            <input
              id="maintenance"
              type="number"
              inputMode="numeric"
              value={maintenanceKcal}
              onChange={(e) => setMaintenanceKcal(e.target.value)}
              placeholder="2500"
            />
            {errors.maintenanceKcal && <span className="form-error">{errors.maintenanceKcal}</span>}
          </div>

          <button type="submit" className="btn-primary">Start Tracking</button>
        </form>
      </div>
    </div>
  );
}
