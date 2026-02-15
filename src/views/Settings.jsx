import { useState, useRef } from 'react';
import { useApp } from '../context/useApp.js';
import { exportData, importData, clearAllData } from '../utils/storage.js';
import Modal from '../components/Modal.jsx';
import './Settings.css';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { targets } = state;
  const fileInputRef = useRef(null);

  const [kcal, setKcal] = useState(String(targets.kcal));
  const [protein, setProtein] = useState(String(targets.protein));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  function handleSaveTargets(e) {
    e.preventDefault();
    const errs = {};
    const k = Number(kcal);
    const p = Number(protein);
    if (!k || k < 500 || k > 10000) errs.kcal = 'Enter a value between 500–10,000';
    if (!p || p < 10 || p > 500) errs.protein = 'Enter a value between 10–500';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    dispatch({ type: 'SET_TARGETS', payload: { kcal: k, protein: p } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack-export-${new Date().toISOString().slice(0, 10)}.json`;
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
        setKcal(String(result.targets.kcal));
        setProtein(String(result.targets.protein));
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
      <h1 className="settings-title">Settings</h1>

      <form onSubmit={handleSaveTargets} className="settings-section">
        <h2>Daily Targets</h2>
        <div className="form-group">
          <label htmlFor="settings-kcal">Calories (kcal)</label>
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
          <label htmlFor="settings-protein">Protein (g)</label>
          <input
            id="settings-protein"
            type="number"
            inputMode="numeric"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
          />
          {errors.protein && <span className="form-error">{errors.protein}</span>}
        </div>
        <button type="submit" className="btn-primary">
          {saved ? 'Saved!' : 'Save Targets'}
        </button>
      </form>

      <div className="settings-section">
        <h2>Data Management</h2>
        <div className="settings-actions">
          <button className="btn-secondary" onClick={handleExport}>
            Export Data (JSON)
          </button>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            className="btn-secondary btn-danger-outline"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All Data
          </button>
        </div>
        {importMessage && <p className="settings-message">{importMessage}</p>}
      </div>

      <div className="settings-section settings-about">
        <p>NutriTrack v1.0 — All data stored locally on your device.</p>
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
