import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import './Onboarding.css';

export default function Onboarding() {
  const { dispatch } = useApp();
  const [userName, setUserName] = useState('');
  const [kcal, setKcal] = useState('2000');
  const [protein, setProtein] = useState('120');
  const [maintenanceKcal, setMaintenanceKcal] = useState('2500');
  const [weightLossTarget, setWeightLossTarget] = useState('5');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!userName.trim()) e.userName = 'Enter your name';
    const k = Number(kcal);
    const p = Number(protein);
    const m = Number(maintenanceKcal);
    const w = Number(weightLossTarget);
    if (!k || k < 500 || k > 10000) e.kcal = 'Enter a value between 500–10,000';
    if (!p || p < 10 || p > 500) e.protein = 'Enter a value between 10–500';
    if (!m || m < 500 || m > 10000) e.maintenanceKcal = 'Enter a value between 500–10,000';
    if (!w || w < 0.5 || w > 100) e.weightLossTarget = 'Enter a value between 0.5–100';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    dispatch({
      type: 'SET_TARGETS',
      payload: {
        userName: userName.trim(),
        kcal: Number(kcal),
        protein: Number(protein),
        maintenanceKcal: Number(maintenanceKcal),
        weightLossTarget: Number(weightLossTarget),
        onboardingComplete: true,
      },
    });
  }

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <h1 className="onboarding-title">myfitnesscoach</h1>
        <p className="onboarding-subtitle">Set up your profile and goals to get started.</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="userName">Your name</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex"
            />
            {errors.userName && <span className="form-error">{errors.userName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="weightLoss">Weight loss goal (kg)</label>
            <p className="form-hint">How much weight do you want to lose in total?</p>
            <input
              id="weightLoss"
              type="number"
              inputMode="decimal"
              value={weightLossTarget}
              onChange={(e) => setWeightLossTarget(e.target.value)}
              placeholder="5"
              step="0.5"
            />
            {errors.weightLossTarget && <span className="form-error">{errors.weightLossTarget}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="kcal">Daily calorie target (kcal)</label>
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
            <label htmlFor="maintenance">Maintenance calories (kcal)</label>
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

          <div className="form-group">
            <label htmlFor="protein">Daily protein target (g)</label>
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

          <button type="submit" className="btn-primary">Start Tracking</button>
        </form>
      </div>
    </div>
  );
}
