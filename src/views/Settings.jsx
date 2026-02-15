import { useState, useRef } from 'react';
import { useApp } from '../context/useApp.js';
import { exportData, importData, clearAllData } from '../utils/storage.js';
import Modal from '../components/Modal.jsx';
import './Settings.css';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { targets } = state;
  const fileInputRef = useRef(null);

  const [userName, setUserName] = useState(targets.userName || '');
  const [weightLossTarget, setWeightLossTarget] = useState(String(targets.weightLossTarget || 5));
  const [kcal, setKcal] = useState(String(targets.kcal));
  const [protein, setProtein] = useState(String(targets.protein));
  const [maintenanceKcal, setMaintenanceKcal] = useState(String(targets.maintenanceKcal || targets.kcal));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  function handleSave(e) {
    e.preventDefault();
    const errs = {};
    const k = Number(kcal);
    const p = Number(protein);
    const m = Number(maintenanceKcal);
    const w = Number(weightLossTarget);
    if (!userName.trim()) errs.userName = 'Enter your name';
    if (!k || k < 500 || k > 10000) errs.kcal = 'Enter a value between 500–10,000';
    if (!p || p < 10 || p > 500) errs.protein = 'Enter a value between 10–500';
    if (!m || m < 500 || m > 10000) errs.maintenanceKcal = 'Enter a value between 500–10,000';
    if (!w || w < 0.5 || w > 100) errs.weightLossTarget = 'Enter a value between 0.5–100';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    dispatch({
      type: 'SET_TARGETS',
      payload: { userName: userName.trim(), kcal: k, protein: p, maintenanceKcal: m, weightLossTarget: w },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myfitnesscoach-export-${new Date().toISOString().slice(0, 10)}.json`;
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
        setUserName(result.targets.userName || '');
        setWeightLossTarget(String(result.targets.weightLossTarget || 5));
        setKcal(String(result.targets.kcal));
        setProtein(String(result.targets.protein));
        setMaintenanceKcal(String(result.targets.maintenanceKcal || result.targets.kcal));
        setImportMessage('Data imported successfully!');
      } catch {
        setImportMessage('Failed to import. Invalid file format.');
      }
      setTimeout(() => setImportMessage(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClearData() {
    clearAllData();
    window.location.reload();
  }

  return (
    <div className="settings">
      <form onSubmit={handleSave}>
        {/* User header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <div className="profile-name-group">
            <input
              className="profile-name-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
            />
            {errors.userName && <span className="form-error">{errors.userName}</span>}
          </div>
        </div>

        {/* Weight loss goal */}
        <div className="settings-section">
          <h2>Weight loss goal</h2>
          <div className="form-group">
            <label htmlFor="settings-weight-loss">Target weight loss (kg)</label>
            <input
              id="settings-weight-loss"
              type="number"
              inputMode="decimal"
              value={weightLossTarget}
              onChange={(e) => setWeightLossTarget(e.target.value)}
              step="0.5"
            />
            {errors.weightLossTarget && <span className="form-error">{errors.weightLossTarget}</span>}
          </div>
        </div>

        {/* Daily targets */}
        <div className="settings-section">
          <h2>Daily targets</h2>
          <div className="form-group">
            <label htmlFor="settings-kcal">Calorie target (kcal)</label>
            <input
              id="settings-kcal"
              type="number"
              inputMode="numeric"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
            {errors.kcal && <span className="form-error">{errors.kcal}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="settings-maintenance">Maintenance calories (kcal)</label>
            <p className="form-hint">Your estimated daily calories to maintain current weight.</p>
            <input
              id="settings-maintenance"
              type="number"
              inputMode="numeric"
              value={maintenanceKcal}
              onChange={(e) => setMaintenanceKcal(e.target.value)}
            />
            {errors.maintenanceKcal && <span className="form-error">{errors.maintenanceKcal}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="settings-protein">Protein target (g)</label>
            <input
              id="settings-protein"
              type="number"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            {errors.protein && <span className="form-error">{errors.protein}</span>}
          </div>
        </div>

        <button type="submit" className="btn-primary settings-save-btn">
          {saved ? 'Saved!' : 'Save'}
        </button>
      </form>

      <div className="settings-section">
        <h2>Data</h2>
        <div className="settings-actions">
          <button type="button" className="btn-secondary" onClick={handleExport}>
            Export (JSON)
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-secondary btn-danger-outline"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear all data
          </button>
        </div>
        {importMessage && <p className="settings-message">{importMessage}</p>}
      </div>

      <div className="settings-section settings-about">
        <p>myfitnesscoach v1.2 — All data stored locally on your device.</p>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data" onClose={() => setShowClearConfirm(false)}>
          <p style={{ marginBottom: 16 }}>
            This will permanently delete all your entries and targets. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              style={{ flex: 1, background: 'var(--color-danger)', padding: '10px' }}
              onClick={handleClearData}
            >
              Clear Everything
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }}
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
