import { useState, useMemo } from 'react';
import { useApp } from '../context/useApp.js';
import { calculateMaintenance } from '../utils/nutritionCalc.js';
import { recommendedWaterLiters } from '../utils/waterCalc.js';
import { loadCustomMeals, saveCustomMeals } from '../utils/storage.js';
import MealBuilder from '../components/MealBuilder.jsx';
import './Onboarding.css';

/* ——— SVG icon helpers ——— */
const sz = (w, h) => ({ width: w, height: h, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' });

const ICONS = {
  // step heroes (24px)
  user:     <svg {...sz(24,24)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  activity: <svg {...sz(24,24)}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  target:   <svg {...sz(24,24)}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  sliders:  <svg {...sz(24,24)}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  utensils: <svg {...sz(24,24)}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,

  // activity options (18px)
  couch:    <svg {...sz(18,18)}><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>,
  walk:     <svg {...sz(18,18)}><circle cx="14" cy="4" r="2"/><path d="M10 22l2-6 4 2v-8l-4-2-4 4 2 4"/></svg>,
  run:      <svg {...sz(18,18)}><circle cx="14" cy="4" r="2"/><path d="M4 17l3-3 2 2 4-6 4 2"/><path d="M14 22l-2-6"/></svg>,
  dumbbell: <svg {...sz(18,18)}><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M2 9.5h4v5H2z"/><path d="M18 9.5h4v5h-4z"/><line x1="6.5" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="17.5" y2="12"/></svg>,
  flame:    <svg {...sz(18,18)}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.5-.5-2-1-3-.5 1-2 2-2 4a2.5 2.5 0 0 0 .5 1.5z"/><path d="M12 22c4-2 8-6 8-12C20 5 15 2 12 2S4 5 4 10c0 6 4 10 8 12z"/></svg>,

  // goal options (18px)
  trendDown: <svg {...sz(18,18)}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  balance:   <svg {...sz(18,18)}><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>,
  trendUp:   <svg {...sz(18,18)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,

  // intensity options (18px)
  feather:  <svg {...sz(18,18)}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>,
  zap:      <svg {...sz(18,18)}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  rocket:   <svg {...sz(18,18)}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,

  // fire for maintenance (18px)
  fireFill: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.5-.5-2-1-3-.5 1-2 2-2 4a2.5 2.5 0 0 0 .5 1.5z"/><path d="M12 22c4-2 8-6 8-12C20 5 15 2 12 2S4 5 4 10c0 6 4 10 8 12z"/></svg>,

  // check for done dots
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const ACTIVITY_OPTIONS = [
  { key: 'sedentary', icon: ICONS.couch,    label: 'Sedentary',        desc: 'Little or no exercise' },
  { key: 'light',     icon: ICONS.walk,     label: 'Lightly active',   desc: '1\u20133 days / week' },
  { key: 'moderate',  icon: ICONS.run,      label: 'Moderately active', desc: '3\u20135 days / week' },
  { key: 'very',      icon: ICONS.dumbbell, label: 'Very active',      desc: '6\u20137 days / week' },
  { key: 'extreme',   icon: ICONS.flame,    label: 'Extremely active', desc: 'Physical job or intense training' },
];

const GOAL_OPTIONS = [
  { key: 'lose',     icon: ICONS.trendDown, label: 'Lose weight',     desc: 'Calorie deficit' },
  { key: 'maintain', icon: ICONS.balance,   label: 'Maintain weight', desc: 'Eat at maintenance' },
  { key: 'gain',     icon: ICONS.trendUp,   label: 'Gain weight',     desc: 'Calorie surplus' },
];

const INTENSITY_OPTIONS = [
  { key: 'slow',       icon: ICONS.feather, label: 'Slow & steady', desc: '~0.25 kg/week', deficit: 250 },
  { key: 'moderate',   icon: ICONS.zap,     label: 'Moderate',      desc: '~0.5 kg/week',  deficit: 500 },
  { key: 'aggressive', icon: ICONS.rocket,  label: 'Aggressive',    desc: '~0.75 kg/week', deficit: 750 },
];

const STEP_META = [
  { icon: ICONS.user,     title: 'Tell us about yourself' },
  { icon: ICONS.activity, title: 'How active are you?' },
  { icon: ICONS.target,   title: "What\u2019s your goal?" },
  { icon: ICONS.sliders,  title: 'Your daily targets' },
  { icon: ICONS.utensils, title: 'Add your go-to meals' },
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
  const [goalWeight, setGoalWeight] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [kcalOverride, setKcalOverride] = useState('');
  const [proteinOverride, setProteinOverride] = useState('');
  const [waterOverride, setWaterOverride] = useState('');

  // Step 5: Quick meals
  const [quickMeals, setQuickMeals] = useState([]);
  const [qmName, setQmName] = useState('');
  const [qmKcal, setQmKcal] = useState('');
  const [qmProtein, setQmProtein] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showMealBuilder, setShowMealBuilder] = useState(false);

  const maintenance = useMemo(() => {
    const w = Number(weight), h = Number(height), a = Number(age);
    if (w > 0 && h > 0 && a > 0) {
      return calculateMaintenance(w, h, a, sex, activityLevel);
    }
    return null;
  }, [weight, height, age, sex, activityLevel]);

  const suggested = useMemo(() => {
    if (maintenance && Number(weight) > 0) {
      const deficit = INTENSITY_OPTIONS.find(o => o.key === intensity)?.deficit || 500;
      let kcal = maintenance;
      if (goal === 'lose') kcal = maintenance - deficit;
      else if (goal === 'gain') kcal = maintenance + deficit;
      const protein = Math.round(1.6 * Number(weight));
      return { kcal: Math.round(kcal), protein };
    }
    return { kcal: 2000, protein: 120 };
  }, [maintenance, weight, goal, intensity]);

  const suggestedWater = useMemo(() => {
    const w = Number(weight);
    return w > 0 ? recommendedWaterLiters(w) : 2.5;
  }, [weight]);

  function validateStep1() {
    const e = {};
    if (!userName.trim()) e.userName = 'Enter your name';
    const a = Number(age);
    if (!a || a < 10 || a > 120) e.age = '10\u2013120';
    const h = Number(height);
    if (!h || h < 100 || h > 250) e.height = '100\u2013250 cm';
    const w = Number(weight);
    if (!w || w < 30 || w > 300) e.weight = '30\u2013300 kg';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep4() {
    const e = {};
    const k = Number(kcalOverride || suggested.kcal);
    const p = Number(proteinOverride || suggested.protein);
    if (k < 500 || k > 10000) e.kcal = '500\u201310,000';
    if (p < 10 || p > 500) e.protein = '10\u2013500';
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
    } else if (step === 3) {
      setErrors({});
      setStep(4);
    } else if (step === 4) {
      if (!validateStep4()) return;
      setErrors({});
      setStep(5);
    }
  }

  function handleBack() {
    setErrors({});
    if (step === 5 && showMealBuilder) {
      setShowMealBuilder(false);
      return;
    }
    setStep(step - 1);
  }

  function handleAddQuickMeal() {
    const k = Number(qmKcal), p = Number(qmProtein);
    if (!qmName.trim() || isNaN(k) || k <= 0) return;
    const meal = { name: qmName.trim(), kcal: k, protein: isNaN(p) ? 0 : p };
    if (editingIndex !== null) {
      setQuickMeals((prev) => prev.map((m, i) => i === editingIndex ? meal : m));
      setEditingIndex(null);
    } else {
      setQuickMeals((prev) => [...prev, meal]);
    }
    setQmName(''); setQmKcal(''); setQmProtein('');
  }

  function handleEditQuickMeal(index) {
    const m = quickMeals[index];
    setQmName(m.name);
    setQmKcal(String(m.kcal));
    setQmProtein(String(m.protein));
    setEditingIndex(index);
  }

  function handleDeleteQuickMeal(index) {
    setQuickMeals((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setQmName(''); setQmKcal(''); setQmProtein('');
    }
  }

  function handleMealBuilderAdd(built) {
    setQuickMeals((prev) => [...prev, {
      name: built.name,
      kcal: built.totalKcal,
      protein: built.totalProtein,
      ingredients: built.ingredients,
    }]);
    setShowMealBuilder(false);
  }

  function handleSubmit() {
    const finalKcal = Number(kcalOverride || suggested.kcal);
    const finalProtein = Number(proteinOverride || suggested.protein);
    const finalWater = Number(waterOverride || suggestedWater);
    const gw = Number(goalWeight);
    const cw = Number(weight);
    const weightLossTarget = goal !== 'maintain' && gw > 0 && cw > 0 ? Math.abs(cw - gw) : 0;

    if (quickMeals.length > 0) {
      const existing = loadCustomMeals();
      saveCustomMeals([...quickMeals, ...existing]);
    }

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

  const meta = STEP_META[step - 1];

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <h1 className="onboarding-title">myfitnesscoach</h1>

        {/* Progress bar */}
        <div className="ob-progress">
          <div className="ob-progress-track">
            <div className="ob-progress-fill" style={{ width: `${((step - 1) / 4) * 100}%` }} />
          </div>
          <div className="ob-progress-dots">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`ob-dot${s === step ? ' ob-dot--active' : ''}${s < step ? ' ob-dot--done' : ''}`}>
                {s < step ? ICONS.check : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step hero */}
        <div className="ob-hero">
          <div className="ob-hero-icon">{meta.icon}</div>
          <p className="ob-hero-title">{meta.title}</p>
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="onboarding-step">
            <div className="ob-card">
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
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={handleNext}>Continue</button>
          </div>
        )}

        {/* Step 2: Activity level */}
        {step === 2 && (
          <div className="onboarding-step">
            <div className="ob-card">
              <div className="option-list">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key} type="button"
                    className={`option-card ${activityLevel === opt.key ? 'option-card--active' : ''}`}
                    onClick={() => setActivityLevel(opt.key)}
                  >
                    <span className="option-icon">{opt.icon}</span>
                    <div className="option-text">
                      <span className="option-label">{opt.label}</span>
                      <span className="option-desc">{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {maintenance && (
              <div className="maintenance-result">
                <div className="maintenance-icon">{ICONS.fireFill}</div>
                <div className="maintenance-text">
                  <span className="maintenance-label">Your maintenance</span>
                  <span className="maintenance-value">{maintenance} cal/day</span>
                </div>
              </div>
            )}

            <div className="form-nav">
              <button type="button" className="btn-back" onClick={handleBack}>Back</button>
              <button type="button" className="btn-primary" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Goal + target weight + intensity */}
        {step === 3 && (
          <div className="onboarding-step">
            <div className="ob-card">
              <div className="onboarding-form">
                <div className="option-list">
                  {GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.key} type="button"
                      className={`option-card ${goal === opt.key ? 'option-card--active' : ''}`}
                      onClick={() => { setGoal(opt.key); setKcalOverride(''); }}
                    >
                      <span className="option-icon">{opt.icon}</span>
                      <div className="option-text">
                        <span className="option-label">{opt.label}</span>
                        <span className="option-desc">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {goal !== 'maintain' && (
                  <>
                    <div className="form-group">
                      <label>Target weight</label>
                      <div className="ob-input-row">
                        <input
                          type="number" inputMode="decimal" step="0.5"
                          value={goalWeight}
                          onChange={(e) => setGoalWeight(e.target.value)}
                          placeholder={goal === 'lose' ? String(Math.round(Number(weight) * 0.9)) : String(Math.round(Number(weight) * 1.1))}
                        />
                        <span className="ob-input-unit">kg</span>
                      </div>
                    </div>

                    <p className="form-hint">How fast do you want to get there?</p>
                    <div className="option-list option-list--compact">
                      {INTENSITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.key} type="button"
                          className={`option-card ${intensity === opt.key ? 'option-card--active' : ''}`}
                          onClick={() => { setIntensity(opt.key); setKcalOverride(''); }}
                        >
                          <span className="option-icon">{opt.icon}</span>
                          <div className="option-text">
                            <span className="option-label">{opt.label}</span>
                            <span className="option-desc">{opt.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="form-nav">
              <button type="button" className="btn-back" onClick={handleBack}>Back</button>
              <button type="button" className="btn-primary" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Daily targets */}
        {step === 4 && (
          <div className="onboarding-step">
            <div className="ob-card">
              <div className="onboarding-form">
                <div className="ob-target-card">
                  <div className="ob-target-icon" style={{ background: 'rgba(255,107,43,0.12)', color: '#ff6b2b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-1.1 0-1.99-.89-1.99-1.99h3.98c0 1.1-.89 1.99-1.99 1.99zm7-3H5v-1l2-2v-5c0-2.8 1.6-5.2 4-6.1V5c0-.6.4-1 1-1s1 .4 1 1v.9c2.4.9 4 3.3 4 6.1v5l2 2v1z"/></svg>
                  </div>
                  <div className="ob-target-info">
                    <span className="ob-target-label">Calories</span>
                  </div>
                  <div className="ob-target-value">
                    <input
                      type="number" inputMode="numeric"
                      value={kcalOverride || suggested.kcal}
                      onChange={(e) => setKcalOverride(e.target.value)}
                    />
                    <span className="ob-target-unit">cal</span>
                  </div>
                </div>
                {errors.kcal && <span className="form-error">{errors.kcal}</span>}

                <div className="ob-target-card">
                  <div className="ob-target-icon" style={{ background: 'rgba(149,117,205,0.12)', color: '#9575cd' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></svg>
                  </div>
                  <div className="ob-target-info">
                    <span className="ob-target-label">Protein</span>
                  </div>
                  <div className="ob-target-value">
                    <input
                      type="number" inputMode="numeric"
                      value={proteinOverride || suggested.protein}
                      onChange={(e) => setProteinOverride(e.target.value)}
                    />
                    <span className="ob-target-unit">g/day</span>
                  </div>
                </div>
                {errors.protein && <span className="form-error">{errors.protein}</span>}

                <div className="ob-target-card">
                  <div className="ob-target-icon" style={{ background: 'rgba(80,191,232,0.12)', color: '#50bfe8' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                  </div>
                  <div className="ob-target-info">
                    <span className="ob-target-label">Water</span>
                  </div>
                  <div className="ob-target-value">
                    <input
                      type="number" inputMode="decimal" step="0.1"
                      value={waterOverride || suggestedWater}
                      onChange={(e) => setWaterOverride(e.target.value)}
                    />
                    <span className="ob-target-unit">L/day</span>
                  </div>
                </div>

                <p className="form-hint">Auto-calculated from your profile. Tap to adjust.</p>
              </div>
            </div>

            <div className="form-nav">
              <button type="button" className="btn-back" onClick={handleBack}>Back</button>
              <button type="button" className="btn-primary" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 5: Quick meals */}
        {step === 5 && (
          <div className="onboarding-step">
            {showMealBuilder ? (
              <>
                <div className="qm-builder-header">
                  <button type="button" className="btn-back qm-builder-back" onClick={() => setShowMealBuilder(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <span className="ob-hero-title" style={{ margin: 0, fontSize: '0.85rem' }}>Build with Ingredients</span>
                </div>
                <MealBuilder meal="Snack" onSave={handleMealBuilderAdd} onCancel={() => setShowMealBuilder(false)} skipCustomMealSave />
              </>
            ) : (
              <>
                <p className="form-hint" style={{ marginBottom: 12, textAlign: 'center' }}>Add meals you eat often for one-tap logging. You can skip this.</p>

                <div className="ob-card">
                  <div className="onboarding-form">
                    <div className="form-group">
                      <label htmlFor="qm-name">Meal name</label>
                      <input
                        id="qm-name" type="text" value={qmName}
                        onChange={(e) => setQmName(e.target.value)}
                        placeholder="e.g. Oatmeal with banana"
                      />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label htmlFor="qm-kcal">Calories</label>
                        <input
                          id="qm-kcal" type="number" inputMode="numeric"
                          value={qmKcal} onChange={(e) => setQmKcal(e.target.value)}
                          placeholder="350"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="qm-protein">Protein (g)</label>
                        <input
                          id="qm-protein" type="number" inputMode="numeric"
                          value={qmProtein} onChange={(e) => setQmProtein(e.target.value)}
                          placeholder="12"
                        />
                      </div>
                    </div>

                    <button
                      type="button" className="btn-primary"
                      onClick={handleAddQuickMeal}
                      disabled={!qmName.trim() || !qmKcal}
                    >
                      {editingIndex !== null ? 'Update Meal' : 'Add Meal'}
                    </button>

                    <button type="button" className="qm-build-link" onClick={() => setShowMealBuilder(true)}>
                      or Build with Ingredients
                    </button>
                  </div>
                </div>

                {quickMeals.length > 0 && (
                  <div className="qm-list">
                    {quickMeals.map((m, i) => (
                      <div key={i} className="qm-card">
                        <div className="qm-card-info">
                          <span className="qm-card-name">{m.name}</span>
                          <span className="qm-card-macros">{m.kcal} cal {'\u00B7'} {m.protein}g</span>
                        </div>
                        <div className="qm-card-actions">
                          <button type="button" className="qm-card-btn" onClick={() => handleEditQuickMeal(i)} aria-label="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button type="button" className="qm-card-btn qm-card-btn--delete" onClick={() => handleDeleteQuickMeal(i)} aria-label="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-nav">
                  <button type="button" className="btn-back" onClick={handleBack}>Back</button>
                  <button type="button" className="btn-primary" onClick={handleSubmit}>
                    {quickMeals.length > 0 ? 'Start Tracking' : 'Skip & Start'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
