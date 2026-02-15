import { useState, useMemo } from 'react';
import ingredientsDatabase from '../data/ingredientsDatabase.js';
import { calculateMealTotals, toGrams } from '../utils/ingredientCalc.js';
import { loadCustomMeals, saveCustomMeals } from '../utils/storage.js';
import './MealBuilder.css';

const GRAM_PORTION = { label: 'g', grams: 1 };

function getPortions(ing) {
  return ing?.portions ? [...ing.portions, GRAM_PORTION] : [GRAM_PORTION];
}

function IngredientSearch({ value, onChange, onSelect }) {
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!value || value.length < 2) return [];
    const q = value.toLowerCase();
    return ingredientsDatabase
      .filter((ing) => ing.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value]);

  return (
    <div className="mb-search-wrap">
      <input
        type="text"
        className="mb-input"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search ingredient…"
      />
      {open && results.length > 0 && (
        <div className="mb-dropdown">
          {results.map((ing) => (
            <button
              key={ing.id}
              className="mb-dropdown-item"
              type="button"
              onClick={() => { onSelect(ing); setOpen(false); }}
            >
              <span className="mb-dropdown-name">{ing.name}</span>
              <span className="mb-dropdown-meta">
                {ing.kcalPer100g} cal/{ing.proteinPer100g}g per 100g
                {ing.portions?.[0] && ` · 1 ${ing.portions[0].label} = ${ing.portions[0].grams}g`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyRow = () => ({
  key: Date.now() + Math.random(),
  name: '',
  amount: '',
  portionLabel: 'g',
  portionGrams: 1,
  kcalPer100g: 0,
  proteinPer100g: 0,
  portions: [GRAM_PORTION],
});

function buildRowFromIngredient(ing) {
  // Try to find the ingredient in the database to restore portions
  const q = ing.name.toLowerCase();
  const dbMatch = ingredientsDatabase.find((db) => db.name.toLowerCase() === q);
  const portions = dbMatch ? getPortions(dbMatch) : [GRAM_PORTION];
  const kcalPer100g = dbMatch ? dbMatch.kcalPer100g : (ing.grams > 0 ? Math.round(ing.kcal / ing.grams * 100) : 0);
  const proteinPer100g = dbMatch ? dbMatch.proteinPer100g : (ing.grams > 0 ? Math.round(ing.protein / ing.grams * 1000) / 10 : 0);

  return {
    key: Date.now() + Math.random(),
    name: ing.name,
    amount: String(ing.grams),
    portionLabel: 'g',
    portionGrams: 1,
    kcalPer100g,
    proteinPer100g,
    portions,
  };
}

export default function MealBuilder({ meal, editingEntry, onSave, onCancel }) {
  const isEditing = !!editingEntry;
  const [mealName, setMealName] = useState(editingEntry?.name ?? '');
  const [rows, setRows] = useState(() => {
    if (editingEntry?.ingredients?.length > 0) {
      return editingEntry.ingredients.map(buildRowFromIngredient);
    }
    return [emptyRow()];
  });

  function handleSelect(index, ing) {
    const portions = getPortions(ing);
    const defaultPortion = portions[0];
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              name: ing.name,
              kcalPer100g: ing.kcalPer100g,
              proteinPer100g: ing.proteinPer100g,
              portions,
              portionLabel: defaultPortion.label,
              portionGrams: defaultPortion.grams,
            }
          : r
      )
    );
  }

  function handleNameChange(index, value) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, name: value } : r))
    );
  }

  function handleAmountChange(index, value) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, amount: value } : r))
    );
  }

  function handlePortionChange(index, label) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const portion = r.portions.find((p) => p.label === label) || GRAM_PORTION;
        return { ...r, portionLabel: portion.label, portionGrams: portion.grams };
      })
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const validRows = rows.filter((r) => r.name && Number(r.amount) > 0);
  const totals = calculateMealTotals(validRows);

  function handleSave() {
    if (validRows.length === 0) return;

    const ingredients = validRows.map((r) => {
      const g = toGrams(r.amount, r.portionGrams);
      return {
        name: r.name,
        grams: Math.round(g),
        kcal: Math.round(g * r.kcalPer100g / 100),
        protein: Math.round(g * r.proteinPer100g / 100 * 10) / 10,
      };
    });

    const builtName = mealName.trim() || `${meal} (${validRows.length} ingredients)`;

    // Save as custom meal for future searches
    const customMeals = loadCustomMeals();
    const existing = customMeals.findIndex((m) => m.name.toLowerCase() === builtName.toLowerCase());
    const customMeal = {
      name: builtName,
      kcal: totals.kcal,
      protein: totals.protein,
      ingredients,
    };
    if (existing >= 0) {
      customMeals[existing] = customMeal;
    } else {
      customMeals.unshift(customMeal);
    }
    saveCustomMeals(customMeals);

    onSave({
      name: builtName,
      totalKcal: totals.kcal,
      totalProtein: totals.protein,
      ingredients,
    });
  }

  return (
    <div className="mb">
      {isEditing && (
        <div className="mb-header">
          <span className="mb-title">Edit Meal</span>
          <button type="button" className="mb-cancel" onClick={onCancel}>Cancel</button>
        </div>
      )}

      <input
        type="text"
        className="mb-input mb-meal-name"
        value={mealName}
        onChange={(e) => setMealName(e.target.value)}
        placeholder="Meal name (optional)"
      />

      <div className="mb-rows">
        {rows.map((row, i) => {
          const g = toGrams(row.amount, row.portionGrams);
          const hasAmount = Number(row.amount) > 0 && row.kcalPer100g > 0;
          const rowKcal = hasAmount ? Math.round(g * row.kcalPer100g / 100) : null;
          const rowProtein = hasAmount ? Math.round(g * row.proteinPer100g / 100 * 10) / 10 : null;

          return (
            <div key={row.key} className="mb-row">
              <div className="mb-row-top">
                <IngredientSearch
                  value={row.name}
                  onChange={(v) => handleNameChange(i, v)}
                  onSelect={(ing) => handleSelect(i, ing)}
                />
                {rows.length > 1 && (
                  <button type="button" className="mb-remove" onClick={() => removeRow(i)} aria-label="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mb-row-amount">
                <input
                  type="number"
                  inputMode="decimal"
                  className="mb-input mb-amount"
                  value={row.amount}
                  onChange={(e) => handleAmountChange(i, e.target.value)}
                  placeholder="0"
                />
                <select
                  className="mb-input mb-unit"
                  value={row.portionLabel}
                  onChange={(e) => handlePortionChange(i, e.target.value)}
                >
                  {row.portions.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}{p.grams !== 1 ? ` (${p.grams}g)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {rowKcal !== null && (
                <div className="mb-row-calc">
                  {rowKcal} cal · {rowProtein}g protein
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="mb-add-row" onClick={addRow}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add ingredient
      </button>

      {validRows.length > 0 && (
        <div className="mb-totals">
          <span className="mb-totals-label">Total</span>
          <span className="mb-totals-value">{totals.kcal} cal · {totals.protein}g protein</span>
        </div>
      )}

      <button
        type="button"
        className="btn-primary btn-submit"
        disabled={validRows.length === 0}
        onClick={handleSave}
      >
        {isEditing ? 'Update Meal' : 'Add Meal'}
      </button>
    </div>
  );
}
