import { useState, useRef } from 'react';
import { useApp } from '../context/useApp.js';
import { exportData, importData, clearAllData } from '../utils/storage.js';
import Modal from '../components/Modal.jsx';
import './Settings.css';

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
  return null;
}

export default function Settings() {
  const { state, dispatch } = useApp();
  const { targets } = state;
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(targets.userName || '');
  const [weightLossTarget, setWeightLossTarget] = useState(String(targets.weightLossTarget || 5));
  const [kcal, setKcal] = useState(String(targets.kcal));
  const [protein, setProtein] = useState(String(targets.protein));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  function startEditing() {
    setUserName(targets.userName || '');
    setWeightLossTarget(String(targets.weightLossTarget || 5));
    setKcal(String(targets.kcal));
    setProtein(String(targets.protein));
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setErrors({});
  }

  function handleSave(e) {
    e.preventDefault();
    const errs = {};
    const k = Number(kcal);
    const p = Number(protein);
    const w = Number(weightLossTarget);
    if (!userName.trim()) errs.userName = 'Enter your name';
    if (!k || k < 500 || k > 10000) errs.kcal = '500–10,000';
    if (!p || p < 10 || p > 500) errs.protein = '10–500';
    if (!w || w < 0.5 || w > 100) errs.weightLossTarget = '0.5–100';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    dispatch({
      type: 'SET_TARGETS',
      payload: {
        userName: userName.trim(),
        kcal: k,
        protein: p,
        maintenanceKcal: targets.maintenanceKcal || targets.kcal,
        weightLossTarget: w,
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

  function handleClearData() {
    clearAllData();
    window.location.reload();
  }

  const maintenanceKcal = targets.maintenanceKcal || targets.kcal;

  return (
    <div className="settings">
      {/* User header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        </div>
        {editing ? (
          <div className="profile-name-group">
            <input
              className="profile-name-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              autoFocus
            />
            {errors.userName && <span className="form-error">{errors.userName}</span>}
          </div>
        ) : (
          <span className="profile-name-display">
            {targets.userName || 'Your name'}
          </span>
        )}
      </div>

      {/* Targets section */}
      <div className="settings-section">
        <div className="section-header">
          <h2>Targets</h2>
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

            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="settings-kcal">Calorie target (kcal)</label>
                <span className="form-annotation">Maintenance: {maintenanceKcal}</span>
              </div>
              <input
                id="settings-kcal"
                type="number"
                inputMode="numeric"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="e.g. 1500"
              />
              {errors.kcal && <span className="form-error">{errors.kcal}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="settings-protein">Protein target (g / day)</label>
              <input
                id="settings-protein"
                type="number"
                inputMode="numeric"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="e.g. 120"
              />
              {errors.protein && <span className="form-error">{errors.protein}</span>}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary settings-save-btn">Save</button>
              <button type="button" className="btn-cancel" onClick={cancelEditing}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="targets-display">
            <div className="target-row">
              <div className="target-row-left">
                <span className="target-icon"><TargetIcon type="weight" /></span>
                <span className="target-label">Weight loss goal</span>
              </div>
              <span className="target-value">{targets.weightLossTarget || 5} kg</span>
            </div>

            <div className="target-divider" />

            <div className="target-row">
              <div className="target-row-left">
                <span className="target-icon"><TargetIcon type="calories" /></span>
                <div className="target-label-group">
                  <span className="target-label">Calorie target</span>
                  <span className="target-sub">Maintenance: {maintenanceKcal} kcal</span>
                </div>
              </div>
              <span className="target-value">{targets.kcal} kcal</span>
            </div>

            <div className="target-divider" />

            <div className="target-row">
              <div className="target-row-left">
                <span className="target-icon"><TargetIcon type="protein" /></span>
                <span className="target-label">Protein target</span>
              </div>
              <span className="target-value">{targets.protein} g / day</span>
            </div>
          </div>
        )}

        {saved && <p className="settings-message">Saved!</p>}
      </div>

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
