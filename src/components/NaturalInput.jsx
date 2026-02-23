import { useState } from 'react';
import { parseNaturalInput } from '../utils/naturalParse.js';
import { useApp } from '../context/useApp.js';
import { hasMacroTargets } from '../utils/nutritionCalc.js';
import './NaturalInput.css';

export default function NaturalInput({ onAdd, onEdit }) {
  const { state } = useApp();
  const mFlags = hasMacroTargets(state.targets);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);

  function handleEstimate() {
    if (!text.trim()) return;
    const result = parseNaturalInput(text);
    setPreview(result);
  }

  function handleAdd() {
    if (!preview) return;
    onAdd(preview);
    setText('');
    setPreview(null);
  }

  function handleEditPreview() {
    if (!preview) return;
    onEdit(preview);
    setText('');
    setPreview(null);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEstimate();
    }
  }

  return (
    <div className="natural-input">
      <textarea
        className="natural-input-textarea"
        placeholder="Describe what you ate, e.g. pasta with chicken and olive oil"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (preview) setPreview(null);
        }}
        onKeyDown={handleKeyDown}
        rows={2}
      />
      <div className="natural-input-actions">
        <button
          className="natural-input-btn natural-input-btn--primary"
          onClick={handleEstimate}
          disabled={!text.trim()}
        >
          Estimate
        </button>
      </div>

      {preview && (
        <div className="natural-input-preview">
          <div className="preview-header">
            <span className="preview-name">{preview.name}</span>
          </div>
          <div className="preview-macros">
            <span className="preview-kcal">{preview.kcal} cal</span>
            <span className="preview-protein">{preview.protein}g protein</span>
            {mFlags.showCarbs && preview.carbs > 0 && <span className="preview-carbs" style={{ color: 'var(--color-carbs)' }}>{preview.carbs}g carbs</span>}
            {mFlags.showFat && preview.fat > 0 && <span className="preview-fat" style={{ color: 'var(--color-fat)' }}>{preview.fat}g fat</span>}
          </div>
          {preview.matchedFoods.length > 0 && (
            <p className="preview-matched">
              Matched: {preview.matchedFoods.join(', ')}
            </p>
          )}
          <div className="preview-actions">
            <button className="preview-add" onClick={handleAdd}>Add</button>
            <button className="preview-edit" onClick={handleEditPreview}>Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}
