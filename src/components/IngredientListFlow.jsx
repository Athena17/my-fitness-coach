import { useState, useMemo } from 'react';
import ingredientsDatabase from '../data/ingredientsDatabase.js';
import { loadPersonalIngredients, savePersonalIngredients } from '../utils/storage.js';
import { useApp } from '../context/useApp.js';
import { toGrams } from '../utils/ingredientCalc.js';

const GRAM_PORTION = { label: 'g', grams: 1 };

const COMMON_PORTIONS = [
  { label: 'g', grams: 1 },
  { label: 'tbsp', grams: 15 },
  { label: 'tsp', grams: 5 },
  { label: 'cup', grams: 240 },
  { label: 'piece', grams: 100 },
  { label: 'slice', grams: 30 },
  { label: 'serving', grams: 100 },
];

const SUGGESTED_NAMES = [
  'Egg', 'Chicken breast', 'Rice', 'Bread', 'Oats', 'Banana',
  'Greek yogurt', 'Milk', 'Pasta', 'Salmon', 'Avocado', 'Potato',
];

function getPortions(ing) {
  return ing?.portions ? [...ing.portions, GRAM_PORTION] : [GRAM_PORTION];
}

function toPersonalDbEntry(p, i) {
  // Compute per-100g from ref values (amount * unit → total cal/protein)
  if (p.refAmount && p.refUnit) {
    const unitObj = COMMON_PORTIONS.find((u) => u.label === p.refUnit) || COMMON_PORTIONS[0];
    const grams = p.refAmount * unitObj.grams;
    const kcalPer100g = grams > 0 ? Math.round(p.refKcal / grams * 100) : 0;
    const proteinPer100g = grams > 0 ? Math.round(p.refProtein / grams * 100 * 10) / 10 : 0;
    const portions = unitObj.label !== 'g' ? [{ label: unitObj.label, grams: unitObj.grams }] : [];
    return { ...p, kcalPer100g, proteinPer100g, portions, id: `p_${i}`, isPersonal: true };
  }
  // Backward compat: old format already has kcalPer100g
  return { ...p, id: `p_${i}`, isPersonal: true };
}

function getAllDb() {
  const personal = loadPersonalIngredients();
  return [
    ...ingredientsDatabase,
    ...personal.map(toPersonalDbEntry),
  ];
}

/* --- Edit-distance fuzzy matching --- */

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

function fuzzyMatch(name, db) {
  const q = name.toLowerCase().trim();
  if (!q) return null;
  // Exact
  const exact = db.find((ing) => ing.name.toLowerCase() === q);
  if (exact) return exact;
  // Substring
  const partial = db.find((ing) => ing.name.toLowerCase().includes(q) || q.includes(ing.name.toLowerCase()));
  if (partial) return partial;
  // Edit-distance: find best match within threshold
  let best = null;
  let bestDist = Infinity;
  const qWords = q.split(/\s+/);
  for (const ing of db) {
    const ingWords = ing.name.toLowerCase().split(/\s+/);
    // Check if any word pair is close
    for (const qw of qWords) {
      if (qw.length < 3) continue;
      for (const iw of ingWords) {
        if (iw.length < 3) continue;
        const maxDist = Math.floor(Math.max(qw.length, iw.length) * 0.35);
        const dist = editDistance(qw, iw);
        if (dist <= maxDist && dist < bestDist) {
          bestDist = dist;
          best = ing;
        }
      }
    }
  }
  return best;
}

function searchDb(query, db) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  // Substring matches first
  const substr = db.filter((ing) => ing.name.toLowerCase().includes(q));
  if (substr.length > 0) return substr.slice(0, 6);
  // Fuzzy fallback: score all by best word edit-distance
  const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
  if (qWords.length === 0) return [];
  const scored = [];
  for (const ing of db) {
    const ingWords = ing.name.toLowerCase().split(/\s+/);
    let minDist = Infinity;
    for (const qw of qWords) {
      for (const iw of ingWords) {
        const d = editDistance(qw, iw);
        if (d < minDist) minDist = d;
      }
    }
    const maxDist = Math.floor(q.length * 0.4);
    if (minDist <= maxDist) scored.push({ ing, dist: minDist });
  }
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, 6).map((s) => s.ing);
}

function makeEmptyRow() {
  return {
    key: Date.now() + Math.random(),
    query: '',
    name: '',
    amount: 1,
    portionLabel: 'g',
    portionGrams: 1,
    portions: COMMON_PORTIONS,
    kcalPer100g: 0,
    proteinPer100g: 0,
    totalKcal: 0,
    totalProtein: 0,
    matched: false,
    isNew: false,
    saveToDb: true,
    editing: false,
  };
}

function makeMatchedRow(match) {
  const portions = getPortions(match);
  const defaultPortion = portions[0];
  return {
    key: Date.now() + Math.random(),
    query: match.name,
    name: match.name,
    amount: 1,
    portionLabel: defaultPortion.label,
    portionGrams: defaultPortion.grams,
    portions,
    kcalPer100g: match.kcalPer100g,
    proteinPer100g: match.proteinPer100g,
    matched: true,
    isNew: false,
    isPersonal: !!match.isPersonal,
    saveToDb: false,
    editing: true,
  };
}

/* --- Autocomplete dropdown --- */

function NameInput({ value, onChange, onSelect, onConfirm, allDb, disabled }) {
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchDb(value, allDb), [value, allDb]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(false);
      onConfirm();
    }
  }

  return (
    <div className="ilf-name-wrap">
      <input
        type="text"
        className="ilf-field ilf-field-name"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Ingredient name"
        disabled={disabled}
      />
      {open && value.trim().length >= 2 && (
        <div className="ilf-dropdown">
          {results.slice(0, 3).map((ing) => (
            <button
              key={ing.id}
              type="button"
              className="ilf-dropdown-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(ing); setOpen(false); }}
            >
              <span className="ilf-dropdown-name">{ing.name}</span>
              <span className="ilf-dropdown-meta">
                {ing.kcalPer100g} cal · {ing.proteinPer100g}g per 100g
              </span>
            </button>
          ))}
          <button
            type="button"
            className="ilf-dropdown-item ilf-dropdown-new"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setOpen(false); onConfirm(true); }}
          >
            <span className="ilf-dropdown-name">Add &ldquo;{value.trim()}&rdquo; as new</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* --- Compact line for confirmed rows --- */

function CompactRow({ row, rowKcal, rowProtein, onEdit, onRemove, disabled }) {
  return (
    <div className={`ilf-compact${disabled ? ' ilf-compact--locked' : ''}`}>
      <span className="ilf-compact-name">{row.name}</span>
      <span className="ilf-compact-detail">
        {row.amount} {row.portionLabel}
        {rowKcal !== null && <> · {rowKcal} cal · {rowProtein}g</>}
      </span>
      <button type="button" className="ilf-compact-edit" onClick={onEdit} disabled={disabled} aria-label="Edit">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </svg>
      </button>
      <button type="button" className="ilf-compact-remove" onClick={onRemove} aria-label="Remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function IngredientListFlow({ onSave, onCancel, initialData }) {
  const { state, dispatch } = useApp();
  const [rows, setRows] = useState(() => {
    if (initialData?.ingredients?.length > 0) {
      const prefilled = initialData.ingredients.map((ing) => ({
        key: Date.now() + Math.random(),
        query: ing.name,
        name: ing.name,
        amount: ing.grams,
        portionLabel: 'g',
        portionGrams: 1,
        portions: COMMON_PORTIONS,
        kcalPer100g: ing.grams > 0 ? (ing.kcal / ing.grams) * 100 : 0,
        proteinPer100g: ing.grams > 0 ? (ing.protein / ing.grams) * 100 : 0,
        totalKcal: 0,
        totalProtein: 0,
        matched: true,
        isNew: false,
        saveToDb: false,
        editing: true,
      }));
      return [...prefilled, makeEmptyRow()];
    }
    return [makeEmptyRow()];
  });
  const [mealName, setMealName] = useState(initialData?.name || '');
  const [nameError, setNameError] = useState(false);
  const [saveToMyMeals, setSaveToMyMeals] = useState(true);
  const allDb = useMemo(() => getAllDb(), []);

  // True when any confirmed row is expanded — locks all other interactions
  const editingRowIndex = rows.findIndex((r) => (r.matched || r.isNew) && r.editing);
  const locked = editingRowIndex >= 0;

  function updateRow(index, updates) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  }

  function handleNameChange(index, value) {
    updateRow(index, { query: value, name: value, matched: false, isNew: false });
  }

  function handleSelect(index, ing) {
    const portions = getPortions(ing);
    const defaultPortion = portions[0];
    setRows((prev) => {
      const updated = prev.map((r, i) =>
        i === index ? {
          ...r,
          query: ing.name, name: ing.name, amount: 1,
          portionLabel: defaultPortion.label, portionGrams: defaultPortion.grams,
          portions, kcalPer100g: ing.kcalPer100g, proteinPer100g: ing.proteinPer100g,
          matched: true, isNew: false, isPersonal: !!ing.isPersonal, saveToDb: false, editing: true,
        } : r,
      );
      const last = updated[updated.length - 1];
      if (last && (last.matched || last.isNew)) return [...updated, makeEmptyRow()];
      return updated;
    });
  }

  function handleConfirmName(index, forceNew) {
    setRows((prev) => {
      const updated = prev.map((r, i) => {
        if (i !== index || r.matched || !r.query.trim()) return r;
        const match = forceNew ? null : fuzzyMatch(r.query, allDb);
        if (match) {
          const portions = getPortions(match);
          const defaultPortion = portions[0];
          return {
            ...r, name: match.name, query: match.name,
            portionLabel: defaultPortion.label, portionGrams: defaultPortion.grams,
            portions, kcalPer100g: match.kcalPer100g, proteinPer100g: match.proteinPer100g,
            matched: true, isNew: false, isPersonal: !!match.isPersonal, saveToDb: false, editing: true,
          };
        }
        const trimmed = r.query.trim();
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        return { ...r, name: capitalized, query: capitalized, isNew: true, matched: false, saveToDb: true, portions: COMMON_PORTIONS, editing: true };
      });
      const last = updated[updated.length - 1];
      if (last && (last.matched || last.isNew)) return [...updated, makeEmptyRow()];
      return updated;
    });
  }

  function handlePortionChange(index, label) {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      const portion = r.portions.find((p) => p.label === label) || GRAM_PORTION;
      return { ...r, portionLabel: portion.label, portionGrams: portion.grams };
    }));
  }

  function removeRow(index) {
    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length === 0 ? [makeEmptyRow()] : filtered;
    });
  }

  function addChip(chipName) {
    if (locked) return;
    const match = allDb.find((ing) => ing.name.toLowerCase().includes(chipName.toLowerCase()));
    if (match) {
      setRows((prev) => {
        const last = prev[prev.length - 1];
        if (last && !last.matched && !last.isNew && !last.query.trim()) {
          return [...prev.slice(0, -1), makeMatchedRow(match), makeEmptyRow()];
        }
        return [...prev, makeMatchedRow(match), makeEmptyRow()];
      });
    }
  }

  /* --- Totals --- */

  const validRows = rows.filter((r) => r.name.trim() && Number(r.amount) > 0 && (r.matched || r.isNew));
  const totals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    for (const r of validRows) {
      if (r.isNew) {
        kcal += r.totalKcal || 0;
        protein += r.totalProtein || 0;
      } else {
        const g = toGrams(r.amount, r.portionGrams);
        kcal += g * (r.kcalPer100g || 0) / 100;
        protein += g * (r.proteinPer100g || 0) / 100;
      }
    }
    return { kcal: Math.round(kcal), protein: Math.round(protein * 10) / 10 };
  }, [validRows]);

  /* --- Save --- */

  function handleSave() {
    if (validRows.length === 0) return;
    const personal = loadPersonalIngredients();
    for (const r of rows) {
      if (r.isNew && r.saveToDb && (r.totalKcal > 0)) {
        const exists = personal.find((p) => p.name.toLowerCase() === r.name.toLowerCase());
        if (!exists) {
          personal.push({
            name: r.name,
            refAmount: Number(r.amount) || 0,
            refUnit: r.portionLabel,
            refKcal: Math.round(r.totalKcal),
            refProtein: Math.round(r.totalProtein * 10) / 10,
          });
        }
      }
    }
    savePersonalIngredients(personal);

    const ingredients = validRows.map((r) => {
      if (r.isNew) {
        const g = toGrams(r.amount, r.portionGrams);
        return {
          name: r.name, grams: Math.round(g),
          kcal: Math.round(r.totalKcal),
          protein: Math.round(r.totalProtein * 10) / 10,
        };
      }
      const g = toGrams(r.amount, r.portionGrams);
      return {
        name: r.name, grams: Math.round(g),
        kcal: Math.round(g * r.kcalPer100g / 100),
        protein: Math.round(g * r.proteinPer100g / 100 * 10) / 10,
      };
    });

    const finalName = mealName.trim();
    if (!finalName) {
      setNameError(true);
      return;
    }

    // Save to My Meals via dispatch (persists to Supabase through dispatch wrapper)
    if (saveToMyMeals && finalName) {
      const existing = (state.customMeals || []).find((m) => m.name.toLowerCase() === finalName.toLowerCase());
      const customMeal = {
        ...(existing ? { id: existing.id } : { id: crypto.randomUUID() }),
        name: finalName, kcal: totals.kcal, protein: totals.protein, ingredients,
      };
      dispatch({ type: existing ? 'UPDATE_CUSTOM_MEAL' : 'ADD_CUSTOM_MEAL', payload: customMeal });
    }

    onSave({ name: finalName, kcal: totals.kcal, protein: totals.protein, ingredients });
  }

  return (
    <div className="add-mode-view">
      <div className="add-mode-header">
        <button className="add-mode-back" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="add-mode-title">New Meal</span>
      </div>

      <div className="ilf-meal-card">

        <div className="ilf-meal-name-group">
          <span className="ilf-meal-name-label">What are we having?</span>
          <input
            type="text"
            className={`ilf-meal-title${nameError ? ' ilf-meal-title--error' : ''}`}
            value={mealName}
            onChange={(e) => { setMealName(e.target.value); setNameError(false); }}
            placeholder="e.g. Morning Omelette"
          />
          {nameError && <span className="ilf-name-error">Give your meal a name first!</span>}
        </div>

        <div className="ilf-ingredients-section">
          <div className="ilf-ingredients-header">
            <span className="ilf-ingredients-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              Ingredients
            </span>
            <span className="ilf-ingredients-hint">Tap or type your own</span>
          </div>

          <div className={`ilf-chips${locked ? ' ilf-chips--locked' : ''}`}>
            {SUGGESTED_NAMES.map((name) => (
              <button key={name} type="button" className="ilf-chip" disabled={locked} onClick={() => addChip(name)}>{name}</button>
            ))}
          </div>

          <div className="ilf-rows">
            {rows.map((row, i) => {
              const g = toGrams(row.amount, row.portionGrams);
              let rowKcal = null;
              let rowProtein = null;
              if (row.isNew && (row.totalKcal > 0 || row.totalProtein > 0)) {
                rowKcal = Math.round(row.totalKcal);
                rowProtein = Math.round(row.totalProtein * 10) / 10;
              } else if (row.kcalPer100g > 0 && Number(row.amount) > 0) {
                rowKcal = Math.round(g * row.kcalPer100g / 100);
                rowProtein = Math.round(g * row.proteinPer100g / 100 * 10) / 10;
              }
              const confirmed = row.matched || row.isNew;

              if (confirmed && !row.editing) {
                return (
                  <CompactRow
                    key={row.key}
                    row={row}
                    rowKcal={rowKcal}
                    rowProtein={rowProtein}
                    onEdit={() => updateRow(i, { editing: true })}
                    onRemove={() => removeRow(i)}
                    disabled={locked}
                  />
                );
              }

              return (
                <div key={row.key} className={`ilf-row ${row.isNew ? 'ilf-row--new' : ''}`}>
                  <div className="ilf-row-top">
                    <NameInput
                      value={row.query}
                      onChange={(v) => handleNameChange(i, v)}
                      onSelect={(ing) => handleSelect(i, ing)}
                      onConfirm={(forceNew) => handleConfirmName(i, forceNew)}
                      allDb={allDb}
                      disabled={locked && editingRowIndex !== i}
                    />
                    {confirmed && (
                      <button type="button" className="ilf-row-action ilf-row-action--remove" onClick={() => removeRow(i)} aria-label="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {confirmed && (
                    <div className="ilf-row-fields">
                      <input
                        type="number" inputMode="decimal" className="ilf-field ilf-field-amount"
                        value={row.amount} onChange={(e) => updateRow(i, { amount: e.target.value })} placeholder="0"
                      />
                      <select
                        className="ilf-field ilf-field-unit" value={row.portionLabel}
                        onChange={(e) => handlePortionChange(i, e.target.value)}
                      >
                        {row.portions.map((p) => (
                          <option key={p.label} value={p.label}>{p.label}</option>
                        ))}
                      </select>
                      {rowKcal !== null && (
                        <span className="ilf-row-calc">{rowKcal} cal · {rowProtein}g</span>
                      )}
                      {row.matched && row.editing && (
                        <button type="button" className="ilf-done-btn" onClick={() => updateRow(i, { editing: false })}>Done</button>
                      )}
                    </div>
                  )}

                  {row.isNew && row.editing && (() => {
                    return (
                      <div className="ilf-new-fields">
                        <p className="ilf-new-hint">New ingredient — enter total nutrition</p>
                        <div className="ilf-new-row">
                          <label className="ilf-new-label">cal</label>
                          <input type="number" inputMode="decimal" className="ilf-field ilf-field-sm"
                            value={row.totalKcal || ''}
                            onChange={(e) => updateRow(i, { totalKcal: Number(e.target.value) || 0 })}
                            placeholder="0" />
                        </div>
                        <div className="ilf-new-row">
                          <label className="ilf-new-label">protein (g)</label>
                          <input type="number" inputMode="decimal" className="ilf-field ilf-field-sm"
                            value={row.totalProtein || ''}
                            onChange={(e) => updateRow(i, { totalProtein: Number(e.target.value) || 0 })}
                            placeholder="0" />
                        </div>
                        <label className="ilf-save-toggle">
                          <input type="checkbox" checked={row.saveToDb} onChange={(e) => updateRow(i, { saveToDb: e.target.checked })} />
                          <span>Save to my ingredients</span>
                        </label>
                        <button type="button" className="ilf-done-btn" onClick={() => updateRow(i, { editing: false })}>
                          Done
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {validRows.length > 0 && (
          <div className="ilf-totals">
            <span className="ilf-totals-label">Total</span>
            <span className="ilf-totals-value">
              <svg className="ilf-totals-icon" width="11" height="11" viewBox="0 0 16 16" fill="#ff6b2b"><path d="M8 16c-3.3 0-6-1.8-6-4 0-2.3 2.1-5 4-7 .3-.3.7-.4 1-.1.2.2.2.5.1.8-.2.6-.1 1.2.1 1.7.3.6.9 1 1.6 1 .9 0 1.5-.6 1.5-1.5 0-.9-.4-1.7-.8-2.3-.2-.3-.1-.7.2-.9.2-.1.5-.1.7.1C12.3 5.5 14 8 14 10.5c0 2.7-2.7 5.5-6 5.5z"/></svg>
              {totals.kcal} cal
              <span className="ilf-totals-sep" />
              <svg className="ilf-totals-icon" width="11" height="11" viewBox="0 0 24 24" fill="#9575cd" stroke="#9575cd" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.54,11.53a15.59,15.59,0,0,1-5.49,3.35,10.06,10.06,0,0,1-3,.87L8.25,12.93a10.06,10.06,0,0,1,.87-3,15.59,15.59,0,0,1,3.35-5.49,5,5,0,0,1,7.07,7.07Z"/><path d="M8.34,18.49l2.74-2.74h0L8.25,12.93h0L5.51,15.66A2,2,0,0,0,3.59,19a1.94,1.94,0,0,0,.9.51,1.94,1.94,0,0,0,.51.9,2,2,0,0,0,3.34-1.92Z"/></svg>
              {totals.protein}g
            </span>
          </div>
        )}

        <div className="ilf-footer">
          <div className="ilf-my-meals-wrap">
            <button
              type="button"
              className={`ilf-my-meals-toggle ${saveToMyMeals ? 'ilf-my-meals-toggle--on' : ''}`}
              onClick={() => setSaveToMyMeals(!saveToMyMeals)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={saveToMyMeals ? '#fff' : 'none'} stroke={saveToMyMeals ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>{saveToMyMeals ? 'Saved to My Meals' : 'Save to My Meals'}</span>
            </button>
            {saveToMyMeals && <span className="ilf-my-meals-hint">One tap to log next time</span>}
          </div>
          <button type="button" className="ilf-meal-save-btn" disabled={validRows.length === 0} onClick={handleSave}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
