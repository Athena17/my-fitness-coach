import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { calculateMaintenance, suggestTargets } from '../utils/nutritionCalc.js';
import { recommendedWaterLiters } from '../utils/waterCalc.js';
import './Onboarding.css';

const ACTIVITY_OPTIONS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', label: 'Lightly active', desc: '1–3 days / week' },
  { key: 'moderate', label: 'Moderately active', desc: '3–5 days / week' },
  { key: 'very', label: 'Very active', desc: '6–7 days / week' },
  { key: 'extreme', label: 'Extremely active', desc: 'Physical job or intense training' },
];

const GOAL_OPTIONS = [
  { key: 'lose', label: 'Lose weight', desc: 'Calorie deficit (−300 cal)' },
  { key: 'maintain', label: 'Maintain weight', desc: 'Eat at maintenance' },
  { key: 'gain', label: 'Gain weight', desc: 'Calorie surplus (+300 cal)' },
];

export default function Onboarding() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Step 1: Profile
  const [userName, setUserName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Step 2: Activity
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Step 3: Goal + overrides
  const [goal, setGoal] = useState('lose');
  const [kcalOverride, setKcalOverride] = useState('');
  const [proteinOverride, setProteinOverride] = useState('');
  const [waterOverride, setWaterOverride] = useState('');

  const maintenance = useMemo(() => {
    const w = Number(weight), h = Number(height), a = Number(age);
    if (w > 0 && h > 0 && a > 0) {
      return calculateMaintenance(w, h, a, sex, activityLevel);
    }
    return null;
  }, [weight, height, age, sex, activityLevel]);

  const suggested = useMemo(() => {
    if (maintenance && Number(weight) > 0) {
      return suggestTargets(maintenance, Number(weight), goal);
    }
    return { kcal: 2000, protein: 120 };
  }, [maintenance, weight, goal]);

  const suggestedWater = useMemo(() => {
    const w = Number(weight);
    return w > 0 ? recommendedWaterLiters(w) : 2.5;
  }, [weight]);

  function validateStep1() {
    const e = {};
    if (!userName.trim()) e.userName = 'Enter your name';
    const a = Number(age);
    if (!a || a < 10 || a > 120) e.age = '10–120';
    const h = Number(height);
    if (!h || h < 100 || h > 250) e.height = '100–250 cm';
    const w = Number(weight);
    if (!w || w < 30 || w > 300) e.weight = '30–300 kg';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e = {};
    const k = Number(kcalOverride || suggested.kcal);
    const p = Number(proteinOverride || suggested.protein);
    if (k < 500 || k > 10000) e.kcal = '500–10,000';
    if (p < 10 || p > 500) e.protein = '10–500';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) {
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      setErrors({});
      setStep(3);
    }
  }

  function handleBack() {
    setErrors({});
    setStep(step - 1);
  }

  function handleSubmit() {
    if (!validateStep3()) return;
    const finalKcal = Number(kcalOverride || suggested.kcal);
    const finalProtein = Number(proteinOverride || suggested.protein);
    const finalWater = Number(waterOverride || suggestedWater);
    const weightLossTarget = goal === 'lose' ? 5 : 0;

    dispatch({
      type: 'SET_TARGETS',
      payload: {
        userName: userName.trim(),
        age: Number(age),
        sex,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        goal,
        maintenanceKcal: maintenance,
        kcal: finalKcal,
        protein: finalProtein,
        waterTargetLiters: finalWater,
        weightLossTarget,
        onboardingComplete: true,
      },
    });
  }

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <h1 className="onboarding-title">myfitnesscoach</h1>

        <div className="onboarding-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`step-dot ${s === step ? 'step-dot--active' : ''} ${s < step ? 'step-dot--done' : ''}`} />
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="onboarding-step">
            <p className="onboarding-subtitle">Tell us about yourself</p>
            <div className="onboarding-form">
              <div className="form-group">
                <label htmlFor="ob-name">Your name</label>
                <input
                  id="ob-name" type="text" value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex"
                />
                {errors.userName && <span className="form-error">{errors.userName}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="ob-age">Age</label>
                  <input
                    id="ob-age" type="number" inputMode="numeric"
                    value={age} onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                  />
                  {errors.age && <span className="form-error">{errors.age}</span>}
                </div>
                <div className="form-group">
                  <label>Sex</label>
                  <div className="sex-toggle">
                    <button type="button" className={`sex-btn ${sex === 'male' ? 'sex-btn--active' : ''}`} onClick={() => setSex('male')}>Male</button>
                    <button type="button" className={`sex-btn ${sex === 'female' ? 'sex-btn--active' : ''}`} onClick={() => setSex('female')}>Female</button>
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="ob-height">Height (cm)</label>
                  <input
                    id="ob-height" type="number" inputMode="numeric"
                    value={height} onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                  />
                  {errors.height && <span className="form-error">{errors.height}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="ob-weight">Weight (kg)</label>
                  <input
                    id="ob-weight" type="number" inputMode="decimal"
                    value={weight} onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                  />
                  {errors.weight && <span className="form-error">{errors.weight}</span>}
                </div>
              </div>

              <button type="button" className="btn-primary" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 2: Activity level */}
        {step === 2 && (
          <div className="onboarding-step">
            <p className="onboarding-subtitle">How active are you?</p>
            <div className="onboarding-form">
              <div className="option-list">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key} type="button"
                    className={`option-card ${activityLevel === opt.key ? 'option-card--active' : ''}`}
                    onClick={() => setActivityLevel(opt.key)}
                  >
                    <span className="option-label">{opt.label}</span>
                    <span className="option-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {maintenance && (
                <div className="maintenance-result">
                  <span className="maintenance-label">Your maintenance calories</span>
                  <span className="maintenance-value">{maintenance} cal / day</span>
                </div>
              )}

              <div className="form-nav">
                <button type="button" className="btn-back" onClick={handleBack}>Back</button>
                <button type="button" className="btn-primary" onClick={handleNext}>Continue</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goal + targets */}
        {step === 3 && (
          <div className="onboarding-step">
            <p className="onboarding-subtitle">What's your goal?</p>
            <div className="onboarding-form">
              <div className="option-list">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.key} type="button"
                    className={`option-card ${goal === opt.key ? 'option-card--active' : ''}`}
                    onClick={() => { setGoal(opt.key); setKcalOverride(''); }}
                  >
                    <span className="option-label">{opt.label}</span>
                    <span className="option-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="targets-preview">
                <div className="target-preview-row">
                  <span className="target-preview-label">Calorie target</span>
                  <div className="target-preview-input">
                    <input
                      type="number" inputMode="numeric"
                      value={kcalOverride || suggested.kcal}
                      onChange={(e) => setKcalOverride(e.target.value)}
                    />
                    <span className="target-preview-unit">cal</span>
                  </div>
                  {errors.kcal && <span className="form-error">{errors.kcal}</span>}
                </div>
                <div className="target-preview-row">
                  <span className="target-preview-label">Protein target</span>
                  <div className="target-preview-input">
                    <input
                      type="number" inputMode="numeric"
                      value={proteinOverride || suggested.protein}
                      onChange={(e) => setProteinOverride(e.target.value)}
                    />
                    <span className="target-preview-unit">g / day</span>
                  </div>
                  {errors.protein && <span className="form-error">{errors.protein}</span>}
                </div>
                <div className="target-preview-row">
                  <span className="target-preview-label">Daily water intake</span>
                  <div className="target-preview-input">
                    <input
                      type="number" inputMode="decimal" step="0.1"
                      value={waterOverride || suggestedWater}
                      onChange={(e) => setWaterOverride(e.target.value)}
                    />
                    <span className="target-preview-unit">L / day</span>
                  </div>
                </div>
                <p className="form-hint">Auto-calculated. Tap to adjust.</p>
              </div>

              <div className="form-nav">
                <button type="button" className="btn-back" onClick={handleBack}>Back</button>
                <button type="button" className="btn-primary" onClick={handleSubmit}>Start Tracking</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
