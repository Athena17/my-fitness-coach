import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/useApp.js';
import { useAuth } from '../context/useAuth.js';
import { useCyclingConfig } from '../hooks/useCyclingConfig.js';
import { formatDateKey, getToday } from '../utils/dateUtils.js';
import { sumNutrition, calcWeightChange } from '../utils/nutritionCalc.js';
import { exportData, importData } from '../utils/storage.js';
import { clearUserData, deleteAccountData } from '../utils/api.js';
import { generateId } from '../utils/idGenerator.js';
import { useTheme } from '../hooks/useTheme.js';
import Modal from '../components/Modal.jsx';
import SourcesSection from '../components/SourcesSection.jsx';
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

/* ——— My Ingredients ——— */
const UNITS = [
  { label: 'g', grams: 1 },
  { label: 'tbsp', grams: 15 },
  { label: 'tsp', grams: 5 },
  { label: 'cup', grams: 240 },
  { label: 'piece', grams: 100 },
  { label: 'slice', grams: 30 },
  { label: 'serving', grams: 100 },
];

function IngredientForm({ form, setForm, onSave, onCancel, saveLabel }) {
  return (
    <div className="ing-form ing-form--add">
      <input
        className="ing-input"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Ingredient name"
        autoFocus
      />
      <div className="ing-row">
        <div className="ing-field">
          <label className="ing-label">Amount</label>
          <input
            className="ing-input ing-input--num"
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="ing-field">
          <label className="ing-label">Unit</label>
          <select
            className="ing-select"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            {UNITS.map((u) => (
              <option key={u.label} value={u.label}>{u.label}</option>
            ))}
          </select>
        </div>
        <div className="ing-field">
          <label className="ing-label">Calories</label>
          <input
            className="ing-input ing-input--num"
            type="number"
            inputMode="decimal"
            value={form.kcal}
            onChange={(e) => setForm({ ...form, kcal: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="ing-field">
          <label className="ing-label">Protein (g)</label>
          <input
            className="ing-input ing-input--num"
            type="number"
            inputMode="decimal"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="ing-field">
          <label className="ing-label">Carbs (g)</label>
          <input
            className="ing-input ing-input--num"
            type="number"
            inputMode="decimal"
            value={form.carbs}
            onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="ing-field">
          <label className="ing-label">Fat (g)</label>
          <input
            className="ing-input ing-input--num"
            type="number"
            inputMode="decimal"
            value={form.fat}
            onChange={(e) => setForm({ ...form, fat: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
      <div className="ing-actions">
        <button type="button" className="ing-save" onClick={onSave}>{saveLabel}</button>
        <button type="button" className="ing-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function MyIngredientsSection() {
  const { state, dispatch } = useApp();
  const ingredients = state.personalIngredients || [];
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const emptyForm = { name: '', amount: '', unit: 'g', kcal: '', protein: '', carbs: '', fat: '' };
  const [form, setForm] = useState(emptyForm);

  function handleDelete(ing) {
    dispatch({ type: 'DELETE_PERSONAL_INGREDIENT', payload: ing.id });
    if (editingId === ing.id) setEditingId(null);
  }

  function startEdit(ing) {
    setForm({
      name: ing.name,
      amount: String(ing.refAmount || 100),
      unit: ing.refUnit || 'g',
      kcal: String(ing.refKcal || 0),
      protein: String(ing.refProtein || 0),
      carbs: String(ing.refCarbs || 0),
      fat: String(ing.refFat || 0),
    });
    setEditingId(ing.id);
    setAdding(false);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    dispatch({
      type: 'UPDATE_PERSONAL_INGREDIENT',
      payload: {
        id: editingId,
        name: form.name.trim(),
        refAmount: Number(form.amount) || 0, refUnit: form.unit,
        refKcal: Math.round(Number(form.kcal) || 0), refProtein: Math.round(Number(form.protein) || 0),
        refCarbs: Math.round(Number(form.carbs) || 0), refFat: Math.round(Number(form.fat) || 0),
      },
    });
    setEditingId(null);
  }

  function startAdd() {
    setForm(emptyForm);
    setAdding(true);
    setEditingId(null);
  }

  function handleAddSave() {
    if (!form.name.trim()) return;
    dispatch({
      type: 'ADD_PERSONAL_INGREDIENT',
      payload: {
        id: generateId(),
        name: form.name.trim(),
        refAmount: Number(form.amount) || 0, refUnit: form.unit,
        refKcal: Math.round(Number(form.kcal) || 0), refProtein: Math.round(Number(form.protein) || 0),
        refCarbs: Math.round(Number(form.carbs) || 0), refFat: Math.round(Number(form.fat) || 0),
      },
    });
    setAdding(false);
  }

  return (
    <>
      <div className="section-header" style={{ marginTop: 4 }}>
        <span style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 600 }}>Ingredients List</span>
        <button type="button" className="ing-add-btn" onClick={startAdd} aria-label="Add ingredient">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      {adding && (
        <IngredientForm form={form} setForm={setForm} onSave={handleAddSave} onCancel={() => setAdding(false)} saveLabel="Add" />
      )}
      {!adding && ingredients.length === 0 ? (
        <p className="settings-empty">No custom ingredients yet — tap + to add one</p>
      ) : (
        <div className="settings-list">
          {ingredients.map((ing) => (
            <div key={ing.id} className="settings-list-item">
              {editingId === ing.id ? (
                <IngredientForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setEditingId(null)} saveLabel="Save" />
              ) : (
                <>
                  <button type="button" className="settings-list-info settings-list-info--tap" onClick={() => startEdit(ing)}>
                    <span className="settings-list-name">{ing.name}</span>
                    <span className="settings-list-meta">
                      {ing.refAmount ? `${ing.refAmount} ${ing.refUnit}` : '—'} · {ing.refKcal ?? 0} cal · {ing.refProtein ?? 0}g protein
                    </span>
                  </button>
                  <div className="settings-list-actions">
                    <button type="button" className="settings-list-consume" onClick={() => startEdit(ing)} aria-label="Edit ingredient">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button type="button" className="settings-list-delete" onClick={() => handleDelete(ing)} aria-label="Delete ingredient">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Profile() {
  const { state, dispatch } = useApp();
  const { user, signOut, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [cyclingConfig, setCyclingConfig] = useCyclingConfig();
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

  const dayTypes = state.dayTypes;

  function getTargetsForDay(dateKey) {
    if (!cyclingConfig.enabled) return { kcal: targets.kcal, protein: targets.protein };
    const dt = (dayTypes && dayTypes[dateKey]) || 'rest';
    return {
      kcal: dt === 'training' ? cyclingConfig.trainingKcal : cyclingConfig.restKcal,
      protein: dt === 'training' ? cyclingConfig.trainingProtein : cyclingConfig.restProtein,
    };
  }

  function getDayData(dayNum) {
    if (!dayNum) return null;
    const dateKey = formatDateKey(new Date(viewYear, viewMonth, dayNum));
    const dayEntries = dayMap[dateKey];
    if (!dayEntries || dayEntries.length === 0) return { dateKey, hasData: false };
    const totals = sumNutrition(dayEntries);
    if (totals.kcal <= 0 && totals.protein <= 0) return { dateKey, hasData: false };
    const burn = burnByDay[dateKey] || 0;
    const net = totals.kcal - burn;
    const dayTargets = getTargetsForDay(dateKey);
    return {
      dateKey,
      hasData: true,
      kcalPct: dayTargets.kcal > 0 ? net / dayTargets.kcal : 0,
      proteinPct: dayTargets.protein > 0 ? totals.protein / dayTargets.protein : 0,
    };
  }

  const monthStats = useMemo(() => {
    let tracked = 0, calOkDays = 0, protOkDays = 0;
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const dateKey = formatDateKey(new Date(viewYear, viewMonth, d));
      const dayEntries = dayMap[dateKey];
      if (!dayEntries || dayEntries.length === 0) continue;
      const totals = sumNutrition(dayEntries);
      if (totals.kcal <= 0 && totals.protein <= 0) continue;
      tracked++;
      const burn = burnByDay[dateKey] || 0;
      const dt = (dayTypes && dayTypes[dateKey]) || 'rest';
      const dayTargets = cyclingConfig.enabled
        ? { kcal: dt === 'training' ? cyclingConfig.trainingKcal : cyclingConfig.restKcal,
            protein: dt === 'training' ? cyclingConfig.trainingProtein : cyclingConfig.restProtein }
        : targets;
      if (dayTargets.kcal > 0 && (totals.kcal - burn) <= dayTargets.kcal) calOkDays++;
      if (dayTargets.protein > 0 && totals.protein >= dayTargets.protein) protOkDays++;
    }
    return { tracked, calOkDays, protOkDays };
  }, [viewYear, viewMonth, dayMap, burnByDay, targets, cyclingConfig, dayTypes]);

  /* ——— Weight change ——— */
  const wc = useMemo(
    () => calcWeightChange(entries, state.exerciseLogs, targets),
    [entries, state.exerciseLogs, targets]
  );

  /* ——— Settings state ——— */
  const [editing, setEditing] = useState(false);
  const [weightLossTarget, setWeightLossTarget] = useState(String(targets.weightLossTarget || 5));
  const [kcal, setKcal] = useState(String(targets.kcal));
  const [protein, setProtein] = useState(String(targets.protein));
  const [water, setWater] = useState(String(targets.waterTargetLiters || 2.5));
  const [macrosEnabled, setMacrosEnabled] = useState((targets.carbs || 0) > 0 || (targets.fat || 0) > 0);
  const [carbsTarget, setCarbsTarget] = useState(targets.carbs ? String(targets.carbs) : '');
  const [fatTarget, setFatTarget] = useState(targets.fat ? String(targets.fat) : '');
  const [cyclingEnabled, setCyclingEnabled] = useState(cyclingConfig.enabled);
  const [trainingKcal, setTrainingKcal] = useState(String(cyclingConfig.trainingKcal || ''));
  const [trainingProtein, setTrainingProtein] = useState(String(cyclingConfig.trainingProtein || ''));
  const [trainingCarbs, setTrainingCarbs] = useState(String(cyclingConfig.trainingCarbs || ''));
  const [trainingFat, setTrainingFat] = useState(String(cyclingConfig.trainingFat || ''));
  const [restKcal, setRestKcal] = useState(String(cyclingConfig.restKcal || ''));
  const [restProtein, setRestProtein] = useState(String(cyclingConfig.restProtein || ''));
  const [restCarbs, setRestCarbs] = useState(String(cyclingConfig.restCarbs || ''));
  const [restFat, setRestFat] = useState(String(cyclingConfig.restFat || ''));
  const [macroEditing, setMacroEditing] = useState(!macrosEnabled);
  const [cyclingEditing, setCyclingEditing] = useState(!cyclingEnabled);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'clear' | 'delete' | null
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalText, setHistoricalText] = useState('');
  const [historicalMsg, setHistoricalMsg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  function handleMacroToggle(enabled) {
    setMacrosEnabled(enabled);
    if (enabled) {
      setCarbsTarget(targets.carbs ? String(targets.carbs) : '');
      setFatTarget(targets.fat ? String(targets.fat) : '');
      setMacroEditing(true);
    } else {
      setCarbsTarget('');
      setFatTarget('');
      setMacroEditing(false);
      dispatch({
        type: 'SET_TARGETS',
        payload: { ...targets, carbs: 0, fat: 0 },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleMacroSave() {
    const c = Number(carbsTarget) || 0;
    const f = Number(fatTarget) || 0;
    if (c < 0 || c > 1000) { setErrors((prev) => ({ ...prev, carbs: '0–1000' })); return; }
    if (f < 0 || f > 500) { setErrors((prev) => ({ ...prev, fat: '0–500' })); return; }
    dispatch({
      type: 'SET_TARGETS',
      payload: { ...targets, carbs: c, fat: f },
    });
    setErrors({});
    setMacroEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCyclingToggle(enabled) {
    setCyclingEnabled(enabled);
    if (enabled) {
      setTrainingKcal(String(cyclingConfig.trainingKcal || targets.kcal));
      setTrainingProtein(String(cyclingConfig.trainingProtein || targets.protein));
      setTrainingCarbs(String(cyclingConfig.trainingCarbs || ''));
      setTrainingFat(String(cyclingConfig.trainingFat || ''));
      setRestKcal(String(cyclingConfig.restKcal || targets.kcal));
      setRestProtein(String(cyclingConfig.restProtein || targets.protein));
      setRestCarbs(String(cyclingConfig.restCarbs || ''));
      setRestFat(String(cyclingConfig.restFat || ''));
      setCyclingEditing(true);
    } else {
      setCyclingEditing(false);
      setCyclingConfig({ ...cyclingConfig, enabled: false });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleCyclingSave() {
    const errs = {};
    const tk = Number(trainingKcal), tp = Number(trainingProtein);
    const rk = Number(restKcal), rp = Number(restProtein);
    if (!tk || tk < 500 || tk > 10000) errs.trainingKcal = '500–10,000';
    if (!tp || tp < 10 || tp > 500) errs.trainingProtein = '10–500';
    if (!rk || rk < 500 || rk > 10000) errs.restKcal = '500–10,000';
    if (!rp || rp < 10 || rp > 500) errs.restProtein = '10–500';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setCyclingConfig({
      enabled: true,
      trainingKcal: tk, trainingProtein: tp,
      trainingCarbs: macrosEnabled ? (Number(trainingCarbs) || 0) : 0,
      trainingFat: macrosEnabled ? (Number(trainingFat) || 0) : 0,
      restKcal: rk, restProtein: rp,
      restCarbs: macrosEnabled ? (Number(restCarbs) || 0) : 0,
      restFat: macrosEnabled ? (Number(restFat) || 0) : 0,
    });
    setCyclingEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function startEditing() {
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
    if (!k || k < 500 || k > 10000) errs.kcal = '500–10,000';
    if (!p || p < 10 || p > 500) errs.protein = '10–500';
    if (!w || w < 0.5 || w > 100) errs.weightLossTarget = '0.5–100';
    if (!wt || wt < 0.5 || wt > 15) errs.water = '0.5–15';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    dispatch({
      type: 'SET_TARGETS',
      payload: {
        userName: targets.userName || '', kcal: k, protein: p,
        carbs: targets.carbs || 0, fat: targets.fat || 0,
        waterTargetLiters: wt,
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
    a.download = `irada-export-${new Date().toISOString().slice(0, 10)}.json`;
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

  async function handleClearData() {
    setClearLoading(true);
    setClearError('');
    try {
      await clearUserData(user.id);
      try { localStorage.removeItem(`nt_data_cache_${user.id}`); } catch { /* ignore */ }
      dispatch({ type: 'CLEAR_DATA' });
      setConfirmAction(null);
    } catch (err) {
      console.error('Clear data failed:', err);
      setClearError('Failed to clear data. Please try again.');
    } finally {
      setClearLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setClearLoading(true);
    setClearError('');
    try {
      await deleteAccountData(user.id);
      try { localStorage.removeItem(`nt_data_cache_${user.id}`); } catch { /* ignore */ }
      dispatch({ type: 'DELETE_ACCOUNT_DATA' });
      setConfirmAction(null);
      await signOut();
    } catch (err) {
      console.error('Delete account failed:', err);
      setClearError('Failed to delete account data. Please try again.');
    } finally {
      setClearLoading(false);
    }
  }

  function handleHistoricalImport() {
    const lines = historicalText.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      setHistoricalMsg('No data found');
      return;
    }
    const newEntries = [];
    let skipped = 0;
    for (const line of lines) {
      // Split by tab, comma, pipe, or 2+ spaces
      const parts = line.trim().split(/[\t,|]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      if (parts.length < 3) { skipped++; continue; }

      // Find the date part (try each part)
      let dateKey = null;
      let numParts = [];
      for (const p of parts) {
        // Try parsing as date
        if (!dateKey) {
          // Handle formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, "Jan 20", "20 Jan", etc.
          const isoMatch = p.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (isoMatch) {
            dateKey = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
            continue;
          }
          const slashMatch = p.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/);
          if (slashMatch) {
            const yr = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
            dateKey = `${yr}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
            continue;
          }
          // Try native Date parsing as last resort
          const parsed = new Date(p);
          if (!isNaN(parsed.getTime()) && p.length > 4) {
            dateKey = formatDateKey(parsed);
            continue;
          }
        }
        // Otherwise collect as number candidate
        const num = parseFloat(p.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) numParts.push(num);
      }

      if (!dateKey || numParts.length < 2) { skipped++; continue; }

      const kcalVal = Math.round(numParts[0]);
      const proteinVal = Math.round(numParts[1]);
      if (kcalVal <= 0) { skipped++; continue; }

      newEntries.push({
        id: generateId(),
        name: 'Daily Total',
        kcal: kcalVal,
        protein: proteinVal,
        meal: 'Breakfast',
        servingSize: 1,
        servingUnit: 'serving',
        timestamp: new Date(dateKey + 'T12:00:00').getTime(),
        dateKey,
      });
    }

    if (newEntries.length === 0) {
      setHistoricalMsg(`Could not parse any rows.${skipped > 0 ? ` ${skipped} skipped.` : ''} Check the format.`);
      return;
    }

    // Remove existing "Daily Total" entries for imported dates to prevent duplicates
    const importedDates = new Set(newEntries.map((e) => e.dateKey));
    for (const existing of entries) {
      if (existing.name === 'Daily Total' && importedDates.has(existing.dateKey)) {
        dispatch({ type: 'DELETE_ENTRY', payload: existing.id });
      }
    }

    for (const entry of newEntries) {
      dispatch({ type: 'ADD_ENTRY', payload: entry });
    }
    setHistoricalMsg(`Imported ${newEntries.length} day${newEntries.length !== 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} skipped` : ''}`);
    setHistoricalText('');
    setTimeout(() => { setHistoricalMsg(''); setShowHistorical(false); }, 3000);
  }

  function handleHistoricalExport() {
    const dayMap = {};
    for (const e of entries) {
      if (!dayMap[e.dateKey]) dayMap[e.dateKey] = { kcal: 0, protein: 0 };
      dayMap[e.dateKey].kcal += e.kcal || 0;
      dayMap[e.dateKey].protein += e.protein || 0;
    }
    const lines = Object.keys(dayMap)
      .sort()
      .map((dk) => `${dk}, ${Math.round(dayMap[dk].kcal)}, ${Math.round(dayMap[dk].protein)}`)
      .join('\n');
    setExportText(lines || 'No data to export.');
    setShowExport(true);
    setShowHistorical(false);
  }

  function handleCopyExport() {
    navigator.clipboard.writeText(exportText).then(() => {
      setExportMsg('Copied!');
      setTimeout(() => setExportMsg(''), 2000);
    });
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(newPassword);
      setPasswordSuccess('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordSuccess(''); setShowPasswordForm(false); }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  const maintenanceKcal = targets.maintenanceKcal || targets.kcal;

  /* ——— Collapsible accordion ——— */
  const [openSection, setOpenSection] = useState(null);
  const toggle = (key) => setOpenSection((prev) => (prev === key ? null : key));

  const ingredientCount = (state.personalIngredients || []).length;

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
        <span className="profile-name-display">{targets.userName || 'Your name'}</span>
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
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-success)" stroke="var(--color-success)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={protColor} stroke={protColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={protOk ? 0.85 : 0.45}>
                        <path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/>
                        <path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/>
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
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-success)" stroke="var(--color-success)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
                <span>Goal met</span>
              </div>
              <div className="progress-legend-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-danger)" stroke="var(--color-danger)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
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
            <span className="wc-footnote">Estimated from food log · 7,700 kcal/kg · since {since}</span>
          </div>
        );
      })()}

      {/* ——— Nutrition Targets (merged: targets + macros + cycling) ——— */}
      <div className="settings-section">
        <button type="button" className="section-toggle" onClick={() => toggle('nutrition')}>
          <div className="section-toggle-left">
            <h2>Nutrition Targets</h2>
          </div>
          <div className="section-toggle-right">
            <span className="section-toggle-summary">
              {targets.kcal} cal · {targets.protein}g P
            </span>
            {cyclingEnabled && <span className="section-toggle-badge">Cycling</span>}
            <svg className={`section-chevron${openSection === 'nutrition' ? ' section-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </button>

        {openSection === 'nutrition' && (
          <div className="section-collapse-body">
            {/* Base targets */}
            <div className="section-header" style={{ marginTop: 4 }}>
              <h2 style={{ fontSize: '0.72rem', opacity: 0.6 }}>Base Targets</h2>
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

            {/* Track Carbs & Fat */}
            <div className="target-divider" style={{ margin: '8px 0' }} />
            <div className="cycling-toggle-row" style={{ marginBottom: macrosEnabled ? 12 : 0 }}>
              <span className="cycling-toggle-label">Track carbs &amp; fat</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="cycling-toggle-pills">
                  <button type="button" className={`cycling-pill${!macrosEnabled ? ' cycling-pill--active' : ''}`} onClick={() => handleMacroToggle(false)}>Off</button>
                  <button type="button" className={`cycling-pill${macrosEnabled ? ' cycling-pill--active' : ''}`} onClick={() => handleMacroToggle(true)}>On</button>
                </div>
                {macrosEnabled && !macroEditing && (
                  <button type="button" className="edit-btn" onClick={() => { setCarbsTarget(targets.carbs ? String(targets.carbs) : ''); setFatTarget(targets.fat ? String(targets.fat) : ''); setMacroEditing(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>
            </div>
            {macrosEnabled && macroEditing && (
              <div className="targets-form">
                <div className="form-group">
                  <label htmlFor="settings-carbs">Carbs target (g / day)</label>
                  <input id="settings-carbs" type="number" inputMode="numeric" value={carbsTarget} onChange={(e) => setCarbsTarget(e.target.value)} placeholder="e.g. 200" />
                  {errors.carbs && <span className="form-error">{errors.carbs}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="settings-fat">Fat target (g / day)</label>
                  <input id="settings-fat" type="number" inputMode="numeric" value={fatTarget} onChange={(e) => setFatTarget(e.target.value)} placeholder="e.g. 65" />
                  {errors.fat && <span className="form-error">{errors.fat}</span>}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary settings-save-btn" onClick={handleMacroSave}>Save</button>
                </div>
              </div>
            )}
            {macrosEnabled && !macroEditing && (
              <div className="targets-display">
                <div className="target-row">
                  <div className="target-row-left"><span className="target-icon" style={{ color: 'var(--color-carbs)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg></span><span className="target-label">Carbs</span></div>
                  <span className="target-value">{targets.carbs || 0} g / day</span>
                </div>
                <div className="target-divider" />
                <div className="target-row">
                  <div className="target-row-left"><span className="target-icon" style={{ color: 'var(--color-fat)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg></span><span className="target-label">Fat</span></div>
                  <span className="target-value">{targets.fat || 0} g / day</span>
                </div>
              </div>
            )}

            {/* Calorie Cycling */}
            <div className="target-divider" style={{ margin: '8px 0' }} />
            <div className="cycling-toggle-row" style={{ marginBottom: cyclingEnabled ? 12 : 0 }}>
              <span className="cycling-toggle-label">Calorie cycling</span>
              <div className="cycling-toggle-pills">
                <button type="button" className={`cycling-pill${!cyclingEnabled ? ' cycling-pill--active' : ''}`} onClick={() => handleCyclingToggle(false)}>Off</button>
                <button type="button" className={`cycling-pill${cyclingEnabled ? ' cycling-pill--active' : ''}`} onClick={() => handleCyclingToggle(true)}>On</button>
              </div>
            </div>
            {cyclingEnabled && cyclingEditing && (
              <div className="cycling-fields">
                <div className="cycling-day-group">
                  <span className="cycling-day-label">Training day</span>
                  <div className="cycling-day-inputs">
                    <div className="form-group">
                      <label htmlFor="settings-training-kcal">Calories</label>
                      <input id="settings-training-kcal" type="number" inputMode="numeric" value={trainingKcal} onChange={(e) => setTrainingKcal(e.target.value)} placeholder="e.g. 2500" />
                      {errors.trainingKcal && <span className="form-error">{errors.trainingKcal}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="settings-training-protein">Protein (g)</label>
                      <input id="settings-training-protein" type="number" inputMode="numeric" value={trainingProtein} onChange={(e) => setTrainingProtein(e.target.value)} placeholder="e.g. 180" />
                      {errors.trainingProtein && <span className="form-error">{errors.trainingProtein}</span>}
                    </div>
                    {macrosEnabled && (
                      <div className="form-group">
                        <label htmlFor="settings-training-carbs">Carbs (g)</label>
                        <input id="settings-training-carbs" type="number" inputMode="numeric" value={trainingCarbs} onChange={(e) => setTrainingCarbs(e.target.value)} placeholder="Optional" />
                      </div>
                    )}
                    {macrosEnabled && (
                      <div className="form-group">
                        <label htmlFor="settings-training-fat">Fat (g)</label>
                        <input id="settings-training-fat" type="number" inputMode="numeric" value={trainingFat} onChange={(e) => setTrainingFat(e.target.value)} placeholder="Optional" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="cycling-day-group">
                  <span className="cycling-day-label">Rest day</span>
                  <div className="cycling-day-inputs">
                    <div className="form-group">
                      <label htmlFor="settings-rest-kcal">Calories</label>
                      <input id="settings-rest-kcal" type="number" inputMode="numeric" value={restKcal} onChange={(e) => setRestKcal(e.target.value)} placeholder="e.g. 1800" />
                      {errors.restKcal && <span className="form-error">{errors.restKcal}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="settings-rest-protein">Protein (g)</label>
                      <input id="settings-rest-protein" type="number" inputMode="numeric" value={restProtein} onChange={(e) => setRestProtein(e.target.value)} placeholder="e.g. 120" />
                      {errors.restProtein && <span className="form-error">{errors.restProtein}</span>}
                    </div>
                    {macrosEnabled && (
                      <div className="form-group">
                        <label htmlFor="settings-rest-carbs">Carbs (g)</label>
                        <input id="settings-rest-carbs" type="number" inputMode="numeric" value={restCarbs} onChange={(e) => setRestCarbs(e.target.value)} placeholder="Optional" />
                      </div>
                    )}
                    {macrosEnabled && (
                      <div className="form-group">
                        <label htmlFor="settings-rest-fat">Fat (g)</label>
                        <input id="settings-rest-fat" type="number" inputMode="numeric" value={restFat} onChange={(e) => setRestFat(e.target.value)} placeholder="Optional" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary settings-save-btn" onClick={handleCyclingSave}>Save</button>
                </div>
              </div>
            )}
            {cyclingEnabled && !cyclingEditing && (
              <div className="cycling-display" onClick={() => { setCyclingEditing(true); }} style={{ cursor: 'pointer' }}>
                <div className="cycling-display-row">
                  <span className="cycling-display-label">Training day</span>
                  <span className="cycling-display-value">
                    {cyclingConfig.trainingKcal} cal · {cyclingConfig.trainingProtein}g
                    {cyclingConfig.trainingCarbs > 0 && <> · <span style={{ color: 'var(--color-carbs)' }}>C {cyclingConfig.trainingCarbs}g</span></>}
                    {cyclingConfig.trainingFat > 0 && <> · <span style={{ color: 'var(--color-fat)' }}>F {cyclingConfig.trainingFat}g</span></>}
                  </span>
                </div>
                <div className="cycling-display-row">
                  <span className="cycling-display-label">Rest day</span>
                  <span className="cycling-display-value">
                    {cyclingConfig.restKcal} cal · {cyclingConfig.restProtein}g
                    {cyclingConfig.restCarbs > 0 && <> · <span style={{ color: 'var(--color-carbs)' }}>C {cyclingConfig.restCarbs}g</span></>}
                    {cyclingConfig.restFat > 0 && <> · <span style={{ color: 'var(--color-fat)' }}>F {cyclingConfig.restFat}g</span></>}
                  </span>
                </div>
              </div>
            )}

            {saved && <p className="settings-message">Saved!</p>}
          </div>
        )}
      </div>

      {/* ——— My Ingredients ——— */}
      <div className="settings-section">
        <button type="button" className="section-toggle" onClick={() => toggle('ingredients')}>
          <div className="section-toggle-left">
            <span className="ing-section-emoji">🫙</span>
            <h2>My Ingredients</h2>
          </div>
          <div className="section-toggle-right">
            {ingredientCount > 0 && <span className="section-toggle-summary">{ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}</span>}
            <svg className={`section-chevron${openSection === 'ingredients' ? ' section-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </button>
        {openSection === 'ingredients' && (
          <div className="section-collapse-body">
            <MyIngredientsSection />
          </div>
        )}
      </div>

      {/* ——— Appearance ——— */}
      <div className="settings-section">
        <button type="button" className="section-toggle" onClick={() => toggle('appearance')}>
          <div className="section-toggle-left">
            <h2>Appearance</h2>
          </div>
          <div className="section-toggle-right">
            <span className="section-toggle-summary">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <svg className={`section-chevron${openSection === 'appearance' ? ' section-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </button>
        {openSection === 'appearance' && (
          <div className="section-collapse-body">
            <div className="cycling-toggle-row" style={{ marginBottom: 0 }}>
              <span className="cycling-toggle-label">Dark mode</span>
              <div className="cycling-toggle-pills">
                <button type="button" className={`cycling-pill${theme === 'light' ? ' cycling-pill--active' : ''}`} onClick={() => setTheme('light')}>Light</button>
                <button type="button" className={`cycling-pill${theme === 'dark' ? ' cycling-pill--active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ——— Data ——— */}
      <div className="settings-section">
        <button type="button" className="section-toggle" onClick={() => toggle('data')}>
          <div className="section-toggle-left">
            <h2>Data</h2>
          </div>
          <div className="section-toggle-right">
            <svg className={`section-chevron${openSection === 'data' ? ' section-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </button>
        {openSection === 'data' && (
          <div className="section-collapse-body">
            <div className="historical-cards">
              <button
                className={`historical-card${showHistorical ? ' historical-card--active' : ''}`}
                onClick={() => { setShowHistorical(!showHistorical); setShowExport(false); }}
              >
                <span className="historical-card-icon historical-card-icon--import">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </span>
                <span className="historical-card-title">Import Logs</span>
                <span className="historical-card-desc">Paste day-by-day data</span>
              </button>
              <button
                className={`historical-card${showExport ? ' historical-card--active' : ''}`}
                onClick={handleHistoricalExport}
              >
                <span className="historical-card-icon historical-card-icon--export">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                <span className="historical-card-title">Export Logs</span>
                <span className="historical-card-desc">Copy your daily totals</span>
              </button>
            </div>

            {showHistorical && (
              <div className="historical-import">
                <p className="historical-hint">Paste your data below — one line per day.<br />Format: <strong>date, calories, protein</strong></p>
                <p className="historical-example">2025-01-20, 1500, 120<br />2025-01-21, 1800, 95<br />Jan 22 2025, 1650, 110</p>
                <textarea
                  className="historical-textarea"
                  rows={6}
                  value={historicalText}
                  onChange={(e) => setHistoricalText(e.target.value)}
                  placeholder="2025-01-20, 1500, 120&#10;2025-01-21, 1800, 95"
                />
                <div className="form-actions">
                  <button type="button" className="btn-primary settings-save-btn" onClick={handleHistoricalImport} disabled={!historicalText.trim()}>
                    Import
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowHistorical(false); setHistoricalMsg(''); }}>Cancel</button>
                </div>
                {historicalMsg && <p className="settings-message">{historicalMsg}</p>}
              </div>
            )}

            {showExport && (
              <div className="historical-import">
                <p className="historical-hint">Your daily totals — <strong>date, calories, protein</strong></p>
                <textarea
                  className="historical-textarea"
                  rows={6}
                  value={exportText}
                  readOnly
                />
                <div className="form-actions">
                  <button type="button" className="btn-primary settings-save-btn" onClick={handleCopyExport}>
                    Copy to clipboard
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowExport(false); setExportMsg(''); }}>Close</button>
                </div>
                {exportMsg && <p className="settings-message">{exportMsg}</p>}
              </div>
            )}

            <div className="settings-actions">
              <button type="button" className="btn-secondary" onClick={handleExport}>Export (JSON)</button>
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Import (JSON)</button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              <button type="button" className="btn-secondary btn-danger-outline" onClick={() => { setConfirmAction('clear'); setClearError(''); }}>Clear all data</button>
            </div>
            {importMessage && <p className="settings-message">{importMessage}</p>}
          </div>
        )}
      </div>

      {/* ——— Account (merged: security + sign out + delete) ——— */}
      <div className="settings-section">
        <button type="button" className="section-toggle" onClick={() => toggle('account')}>
          <div className="section-toggle-left">
            <h2>Account</h2>
          </div>
          <div className="section-toggle-right">
            {user?.email && <span className="section-toggle-summary">{user.email}</span>}
            <svg className={`section-chevron${openSection === 'account' ? ' section-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </button>
        {openSection === 'account' && (
          <div className="section-collapse-body">
            {/* Change password */}
            <div className="section-header">
              <h2 style={{ fontSize: '0.72rem', opacity: 0.6 }}>Security</h2>
              {!showPasswordForm && (
                <button type="button" className="edit-btn" onClick={() => { setShowPasswordForm(true); setPasswordError(''); setPasswordSuccess(''); setNewPassword(''); setConfirmPassword(''); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Change Password
                </button>
              )}
            </div>
            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="targets-form">
                <div className="form-group">
                  <label htmlFor="profile-new-password">New password</label>
                  <input
                    id="profile-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-confirm-password">Confirm password</label>
                  <input
                    id="profile-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                {passwordError && <span className="form-error">{passwordError}</span>}
                {passwordSuccess && <p className="settings-message">{passwordSuccess}</p>}
                <div className="form-actions">
                  <button type="submit" className="btn-primary settings-save-btn" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="target-divider" style={{ margin: '8px 0' }} />
            <div className="settings-actions">
              <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={signOut}>
                Sign Out
              </button>
              <button type="button" className="btn-secondary btn-danger-outline" style={{ width: '100%' }} onClick={() => { setConfirmAction('delete'); setClearError(''); }}>
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      <SourcesSection />

      <div className="settings-section settings-about">
        <p>Irada v1.0 — Data synced to cloud.</p>
        <button type="button" className="privacy-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
      </div>

      {showPrivacy && (
        <Modal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <div className="privacy-content">
            <p className="privacy-updated">Last updated: February 2026</p>

            <h3>What Irada Collects</h3>
            <p>Irada collects only the data you provide: your email address (for authentication), nutrition targets, food log entries, exercise logs, water logs, and custom meals/recipes.</p>

            <h3>How Your Data Is Stored</h3>
            <p>Your data is stored locally on your device using browser storage and synced to a secure cloud database (Supabase) so you can access it across devices. Your data is associated with your account and is not shared with third parties.</p>

            <h3>No Tracking or Analytics</h3>
            <p>Irada does not use any analytics services, advertising trackers, cookies for tracking, or third-party scripts that collect your personal information.</p>

            <h3>Third-Party Services</h3>
            <p>Irada uses Supabase for authentication and data storage. Google Fonts are loaded for typography. No other third-party services have access to your data.</p>

            <h3>Data You Control</h3>
            <p>You can export all your data at any time from the Profile page. You can also clear all your data or delete your account entirely — both actions are irreversible and will remove your data from our servers.</p>

            <h3>Children</h3>
            <p>Irada is not intended for children under 13. We do not knowingly collect data from children.</p>

            <h3>Changes</h3>
            <p>If this policy changes, the updated version will be available here with a new date.</p>

            <h3>Contact</h3>
            <p>Questions about your data? Reach out via the app&apos;s GitHub repository.</p>
          </div>
        </Modal>
      )}

      {confirmAction === 'clear' && (
        <Modal title="Clear Data" onClose={() => !clearLoading && setConfirmAction(null)}>
          <p style={{ marginBottom: 16 }}>This will delete all your food entries, exercises, water logs, recipes, and custom meals. Your account and targets will be kept.</p>
          {clearError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: 12 }}>{clearError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-danger)', padding: '10px', opacity: clearLoading ? 0.6 : 1 }} onClick={handleClearData} disabled={clearLoading}>
              {clearLoading ? 'Clearing...' : 'Clear Data'}
            </button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }} onClick={() => setConfirmAction(null)} disabled={clearLoading}>Cancel</button>
          </div>
        </Modal>
      )}

      {confirmAction === 'delete' && (
        <Modal title="Delete Account" onClose={() => !clearLoading && setConfirmAction(null)}>
          <p style={{ marginBottom: 16 }}>This will permanently delete all your data and reset your account. You will be signed out. This cannot be undone.</p>
          {clearError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: 12 }}>{clearError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-danger)', padding: '10px', opacity: clearLoading ? 0.6 : 1 }} onClick={handleDeleteAccount} disabled={clearLoading}>
              {clearLoading ? 'Deleting...' : 'Delete Everything'}
            </button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }} onClick={() => setConfirmAction(null)} disabled={clearLoading}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
