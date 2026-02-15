import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { useDailyEntries } from '../hooks/useDailyEntries.js';
import { generateId } from '../utils/idGenerator.js';
import { getToday } from '../utils/dateUtils.js';
import { EXERCISES, INTENSITY_MODIFIERS } from '../utils/metValues.js';
import { calculateCaloriesBurned } from '../utils/exerciseCalc.js';
import Modal from './Modal.jsx';
import './ExercisePanel.css';

export default function ExercisePanel() {
  const { state, dispatch } = useApp();
  const { todayExerciseLogs, caloriesBurned } = useDailyEntries();
  const [showForm, setShowForm] = useState(false);
  const [exerciseKey, setExerciseKey] = useState(EXERCISES[0].key);
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [deleteId, setDeleteId] = useState(null);

  const weightKg = state.targets.weight || 70;

  function handleSubmit(e) {
    e.preventDefault();
    const mins = Number(duration);
    if (!mins || mins <= 0) return;

    const cal = calculateCaloriesBurned(exerciseKey, mins, weightKg, intensity);
    const exercise = EXERCISES.find((ex) => ex.key === exerciseKey);

    dispatch({
      type: 'ADD_EXERCISE',
      payload: {
        id: generateId(),
        type: exerciseKey,
        label: exercise?.label || exerciseKey,
        durationMinutes: mins,
        intensity,
        weightUsed: weightKg,
        caloriesBurned: cal,
        dateKey: getToday(),
        timestamp: Date.now(),
      },
    });

    setDuration('');
    setShowForm(false);
  }

  function confirmDelete() {
    dispatch({ type: 'DELETE_EXERCISE', payload: deleteId });
    setDeleteId(null);
  }

  const preview = duration > 0
    ? calculateCaloriesBurned(exerciseKey, Number(duration), weightKg, intensity)
    : null;

  return (
    <div className="exercise-panel">
      <button
        className={`exercise-add-btn ${showForm ? 'exercise-add-btn--active' : ''}`}
        onClick={() => setShowForm(!showForm)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {showForm
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
          }
        </svg>
        {showForm ? 'Cancel' : 'Add Workout'}
      </button>

      {showForm && (
        <form className="exercise-form" onSubmit={handleSubmit}>
          <div className="exercise-form-row">
            <div className="exercise-field">
              <label className="exercise-label">Exercise</label>
              <select
                className="exercise-select"
                value={exerciseKey}
                onChange={(e) => setExerciseKey(e.target.value)}
              >
                {EXERCISES.map((ex) => (
                  <option key={ex.key} value={ex.key}>{ex.label}</option>
                ))}
              </select>
            </div>
            <div className="exercise-field exercise-field--duration">
              <label className="exercise-label">Minutes</label>
              <input
                type="number"
                className="exercise-input"
                placeholder="30"
                min="1"
                max="600"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="exercise-intensity">
            {Object.entries(INTENSITY_MODIFIERS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                className={`exercise-intensity-btn ${intensity === key ? 'exercise-intensity-btn--active' : ''}`}
                onClick={() => setIntensity(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {preview !== null && (
            <div className="exercise-preview">
              ~{preview} cal burn
            </div>
          )}

          <button type="submit" className="btn-primary exercise-submit" disabled={!duration || Number(duration) <= 0}>
            Log Exercise
          </button>
        </form>
      )}

      {todayExerciseLogs.length > 0 && (
        <div className="exercise-log-section">
          <div className="exercise-log-header">
            <span className="exercise-log-title">Today's Exercise</span>
            <span className="exercise-log-total">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              {caloriesBurned} cal burned
            </span>
          </div>
          <div className="exercise-log-list">
            {todayExerciseLogs.map((log) => (
              <div key={log.id} className="exercise-log-item">
                <div className="exercise-log-info">
                  <span className="exercise-log-name">{log.label}</span>
                  <span className="exercise-log-detail">
                    {log.durationMinutes} min
                    <span className="exercise-log-dot" />
                    {log.intensity}
                    <span className="exercise-log-dot" />
                    {log.caloriesBurned} cal
                  </span>
                </div>
                <button
                  className="exercise-log-delete"
                  onClick={() => setDeleteId(log.id)}
                  aria-label="Delete exercise"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteId && (
        <Modal title="Delete Exercise" onClose={() => setDeleteId(null)}>
          <p style={{ marginBottom: 16 }}>Delete this exercise entry?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              style={{ flex: 1, background: 'var(--color-danger)', padding: '10px' }}
              onClick={confirmDelete}
            >
              Delete
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, background: 'var(--color-text-secondary)', padding: '10px' }}
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
