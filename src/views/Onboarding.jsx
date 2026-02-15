import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import './Onboarding.css';

export default function Onboarding() {
  const { dispatch } = useApp();
  const [kcal, setKcal] = useState('2000');
  const [protein, setProtein] = useState('120');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    const k = Number(kcal);
    const p = Number(protein);
    if (!k || k < 500 || k > 10000) e.kcal = 'Enter a value between 500–10,000';
    if (!p || p < 10 || p > 500) e.protein = 'Enter a value between 10–500';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    dispatch({
      type: 'SET_TARGETS',
      payload: { kcal: Number(kcal), protein: Number(protein), onboardingComplete: true },
    });
  }

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <h1 className="onboarding-title">NutriTrack</h1>
        <p className="onboarding-subtitle">Set your daily nutrition targets to get started.</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="kcal">Daily Calories (kcal)</label>
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
            <label htmlFor="protein">Daily Protein (g)</label>
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
