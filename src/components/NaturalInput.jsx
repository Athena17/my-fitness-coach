import { useState } from 'react';
import { parseNaturalInput } from '../utils/naturalParse.js';
import './NaturalInput.css';

export default function NaturalInput({ onAdd, onEdit, onSearchDb }) {
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
        <button
          className="natural-input-btn natural-input-btn--secondary"
          onClick={onSearchDb}
        >
          Search database
        </button>
      </div>

      {preview && (
        <div className="natural-input-preview">
          <div className="preview-header">
            <span className="preview-name">{preview.name}</span>
          </div>
          <div className="preview-macros">
            <span className="preview-kcal">{preview.kcal} kcal</span>
            <span className="preview-protein">{preview.protein}g protein</span>
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
