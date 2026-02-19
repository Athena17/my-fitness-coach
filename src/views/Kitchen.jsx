import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { loadPersonalIngredients, savePersonalIngredients } from '../utils/storage.js';
import IngredientListFlow from '../components/IngredientListFlow.jsx';
import './Kitchen.css';

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: 'Late-night cravings?', emoji: '🌙' };
  if (h < 12) return { text: 'Good morning, chef!', emoji: '🌅' };
  if (h < 17) return { text: 'What are we cooking?', emoji: '☀️' };
  if (h < 21) return { text: 'Dinner time vibes!', emoji: '🌇' };
  return { text: 'Cozy evening snack?', emoji: '🍵' };
}

function MyMealsSection({ onEditMeal, onAddMeal, meals, onDeleteMeal }) {
  function handleDelete(index) {
    const meal = meals[index];
    if (meal?.id) onDeleteMeal(meal.id);
  }

  return (
    <div className="kitchen-section kitchen-section--meals">
      <div className="kitchen-section-header">
        <span className="kitchen-section-emoji">🍽️</span>
        <h2>My Meals</h2>
        <button type="button" className="kitchen-add-btn" onClick={onAddMeal} aria-label="Add meal">
          <PlusIcon />
        </button>
      </div>
      {meals.length === 0 ? (
        <div className="kitchen-empty">
          <span className="kitchen-empty-emoji">👩‍🍳</span>
          <p>No saved meals yet</p>
          <p className="kitchen-empty-hint">Tap + to build your first meal!</p>
        </div>
      ) : (
        <div className="kitchen-list">
          {meals.map((meal, i) => (
            <div key={`${meal.name}-${i}`} className="kitchen-list-item">
              <button type="button" className="kitchen-list-info kitchen-list-info--tap" onClick={() => onEditMeal(i, meal)}>
                <span className="kitchen-list-name">{meal.name}</span>
                <span className="kitchen-list-meta">
                  {meal.kcal} cal · {meal.protein}g protein{meal.ingredients ? ` · ${meal.ingredients.length} ingredient${meal.ingredients.length !== 1 ? 's' : ''}` : ''}
                </span>
              </button>
              <div className="kitchen-list-actions">
                <button type="button" className="kitchen-list-edit" onClick={() => onEditMeal(i, meal)} aria-label="Edit meal">
                  <EditIcon />
                </button>
                <button type="button" className="kitchen-list-delete" onClick={() => handleDelete(i)} aria-label="Delete meal">
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <div className="kitchen-edit-form kitchen-edit-form--add">
      <input
        className="kitchen-edit-input"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Ingredient name"
        autoFocus
      />
      <div className="kitchen-edit-row">
        <div className="kitchen-edit-field">
          <label className="kitchen-edit-label">Amount</label>
          <input
            className="kitchen-edit-input kitchen-edit-input--num"
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="kitchen-edit-field">
          <label className="kitchen-edit-label">Unit</label>
          <select
            className="kitchen-edit-select"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            {UNITS.map((u) => (
              <option key={u.label} value={u.label}>{u.label}</option>
            ))}
          </select>
        </div>
        <div className="kitchen-edit-field">
          <label className="kitchen-edit-label">Calories</label>
          <input
            className="kitchen-edit-input kitchen-edit-input--num"
            type="number"
            inputMode="decimal"
            value={form.kcal}
            onChange={(e) => setForm({ ...form, kcal: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="kitchen-edit-field">
          <label className="kitchen-edit-label">Protein (g)</label>
          <input
            className="kitchen-edit-input kitchen-edit-input--num"
            type="number"
            inputMode="decimal"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
      <div className="kitchen-edit-actions">
        <button type="button" className="kitchen-edit-save" onClick={onSave}>{saveLabel}</button>
        <button type="button" className="kitchen-edit-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function MyIngredientsSection() {
  const [ingredients, setIngredients] = useState(() => loadPersonalIngredients());
  const [editingIndex, setEditingIndex] = useState(null);
  const [adding, setAdding] = useState(false);
  const emptyForm = { name: '', amount: '', unit: 'g', kcal: '', protein: '' };
  const [form, setForm] = useState(emptyForm);

  function handleDelete(index) {
    const updated = ingredients.filter((_, i) => i !== index);
    savePersonalIngredients(updated);
    setIngredients(updated);
    if (editingIndex === index) setEditingIndex(null);
  }

  function startEdit(index) {
    const ing = ingredients[index];
    setForm({
      name: ing.name,
      amount: String(ing.refAmount || 100),
      unit: ing.refUnit || 'g',
      kcal: String(ing.refKcal || 0),
      protein: String(ing.refProtein || 0),
    });
    setEditingIndex(index);
    setAdding(false);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const updated = [...ingredients];
    updated[editingIndex] = {
      name: form.name.trim(),
      refAmount: Number(form.amount) || 0, refUnit: form.unit,
      refKcal: Math.round(Number(form.kcal) || 0), refProtein: Math.round(Number(form.protein) * 10) / 10,
    };
    savePersonalIngredients(updated);
    setIngredients(updated);
    setEditingIndex(null);
  }

  function startAdd() {
    setForm(emptyForm);
    setAdding(true);
    setEditingIndex(null);
  }

  function handleAddSave() {
    if (!form.name.trim()) return;
    const newIng = {
      name: form.name.trim(),
      refAmount: Number(form.amount) || 0, refUnit: form.unit,
      refKcal: Math.round(Number(form.kcal) || 0), refProtein: Math.round(Number(form.protein) * 10) / 10,
    };
    const updated = [newIng, ...ingredients];
    savePersonalIngredients(updated);
    setIngredients(updated);
    setAdding(false);
  }

  return (
    <div className="kitchen-section kitchen-section--ingredients">
      <div className="kitchen-section-header">
        <span className="kitchen-section-emoji">🫙</span>
        <h2>My Ingredients</h2>
        <button type="button" className="kitchen-add-btn" onClick={startAdd} aria-label="Add ingredient">
          <PlusIcon />
        </button>
      </div>
      {adding && (
        <IngredientForm form={form} setForm={setForm} onSave={handleAddSave} onCancel={() => setAdding(false)} saveLabel="Add" />
      )}
      {!adding && ingredients.length === 0 ? (
        <div className="kitchen-empty">
          <span className="kitchen-empty-emoji">🥕</span>
          <p>No custom ingredients yet</p>
          <p className="kitchen-empty-hint">Tap + to add your first ingredient!</p>
        </div>
      ) : (
        <div className="kitchen-list">
          {ingredients.map((ing, i) => (
            <div key={`${ing.name}-${i}`} className="kitchen-list-item">
              {editingIndex === i ? (
                <IngredientForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setEditingIndex(null)} saveLabel="Save" />
              ) : (
                <>
                  <button type="button" className="kitchen-list-info kitchen-list-info--tap" onClick={() => startEdit(i)}>
                    <span className="kitchen-list-name">{ing.name}</span>
                    <span className="kitchen-list-meta">
                      {ing.refAmount ? `${ing.refAmount} ${ing.refUnit}` : '—'} · {ing.refKcal ?? 0} cal · {ing.refProtein ?? 0}g protein
                    </span>
                  </button>
                  <div className="kitchen-list-actions">
                    <button type="button" className="kitchen-list-edit" onClick={() => startEdit(i)} aria-label="Edit ingredient">
                      <EditIcon />
                    </button>
                    <button type="button" className="kitchen-list-delete" onClick={() => handleDelete(i)} aria-label="Delete ingredient">
                      <DeleteIcon />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Kitchen() {
  const { state, dispatch } = useApp();
  const activeLeftovers = (state.leftovers || []).filter((l) => l.remainingServings > 0);
  const [editingMeal, setEditingMeal] = useState(null); // { index, meal } or { index: -1, meal: null } for new
  const [editingLeftover, setEditingLeftover] = useState(null);
  const [leftoverForm, setLeftoverForm] = useState({ name: '', remainingServings: '', kcal: '', protein: '' });
  const greeting = getGreeting();

  function handleEditMeal(index, meal) {
    setEditingMeal({ index, meal });
  }

  function handleMealSave(built) {
    // IngredientListFlow dispatches ADD/UPDATE_CUSTOM_MEAL when toggle is on.
    // For edits where the name changed, clean up the old entry.
    if (editingMeal.index >= 0) {
      const oldName = editingMeal.meal?.name?.toLowerCase();
      const newName = built.name.toLowerCase();
      if (oldName && oldName !== newName) {
        const oldMeal = (state.customMeals || []).find((m) => m.name.toLowerCase() === oldName);
        if (oldMeal?.id) {
          dispatch({ type: 'DELETE_CUSTOM_MEAL', payload: oldMeal.id });
        }
      }
    }
    setEditingMeal(null);
  }

  function startEditLeftover(leftover) {
    setLeftoverForm({
      name: leftover.name,
      remainingServings: String(leftover.remainingServings),
      kcal: String(leftover.perServing.kcal),
      protein: String(leftover.perServing.protein),
    });
    setEditingLeftover(leftover.id);
  }

  function handleSaveLeftover(leftover) {
    if (!leftoverForm.name.trim()) return;
    dispatch({
      type: 'UPDATE_LEFTOVER',
      payload: {
        ...leftover,
        name: leftoverForm.name.trim(),
        remainingServings: Math.max(1, Math.round(Number(leftoverForm.remainingServings) || 1)),
        perServing: {
          kcal: Math.round(Number(leftoverForm.kcal) || 0),
          protein: Math.round(Number(leftoverForm.protein) * 10) / 10,
        },
      },
    });
    setEditingLeftover(null);
  }

  // Full-screen meal builder (new or edit)
  if (editingMeal) {
    return (
      <IngredientListFlow
        initialData={editingMeal.index === -1 ? undefined : editingMeal.meal}
        onSave={handleMealSave}
        onCancel={() => setEditingMeal(null)}
      />
    );
  }

  return (
    <div className="kitchen">
      {/* Hero header */}
      <div className="kitchen-hero">
        <div className="kitchen-hero-glow" />
        <span className="kitchen-hero-emoji">{greeting.emoji}</span>
        <span className="kitchen-hero-title">My Happy Kitchen</span>
        <span className="kitchen-hero-greeting">{greeting.text}</span>
      </div>

      <MyMealsSection
        meals={state.customMeals || []}
        onEditMeal={handleEditMeal}
        onAddMeal={() => setEditingMeal({ index: -1, meal: null })}
        onDeleteMeal={(id) => dispatch({ type: 'DELETE_CUSTOM_MEAL', payload: id })}
      />
      <MyIngredientsSection />

      <div className="kitchen-section kitchen-section--leftovers">
        <div className="kitchen-section-header">
          <span className="kitchen-section-emoji">🍲</span>
          <h2>Leftovers</h2>
        </div>
        {activeLeftovers.length === 0 ? (
          <div className="kitchen-empty">
            <span className="kitchen-empty-emoji">✨</span>
            <p>Nothing in the fridge</p>
            <p className="kitchen-empty-hint">When you prep extra servings, they will be waiting for you here</p>
          </div>
        ) : (
          <div className="kitchen-list">
            {activeLeftovers.map((leftover) => (
              <div key={leftover.id} className="kitchen-list-item">
                {editingLeftover === leftover.id ? (
                  <div className="kitchen-edit-form">
                    <input
                      className="kitchen-edit-input"
                      value={leftoverForm.name}
                      onChange={(e) => setLeftoverForm({ ...leftoverForm, name: e.target.value })}
                      placeholder="Name"
                    />
                    <div className="kitchen-edit-row">
                      <div className="kitchen-edit-field">
                        <label className="kitchen-edit-label">Servings left</label>
                        <input
                          className="kitchen-edit-input kitchen-edit-input--num"
                          type="number"
                          value={leftoverForm.remainingServings}
                          onChange={(e) => setLeftoverForm({ ...leftoverForm, remainingServings: e.target.value })}
                        />
                      </div>
                      <div className="kitchen-edit-field">
                        <label className="kitchen-edit-label">cal / serving</label>
                        <input
                          className="kitchen-edit-input kitchen-edit-input--num"
                          type="number"
                          value={leftoverForm.kcal}
                          onChange={(e) => setLeftoverForm({ ...leftoverForm, kcal: e.target.value })}
                        />
                      </div>
                      <div className="kitchen-edit-field">
                        <label className="kitchen-edit-label">protein / srv</label>
                        <input
                          className="kitchen-edit-input kitchen-edit-input--num"
                          type="number"
                          value={leftoverForm.protein}
                          onChange={(e) => setLeftoverForm({ ...leftoverForm, protein: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="kitchen-edit-actions">
                      <button type="button" className="kitchen-edit-save" onClick={() => handleSaveLeftover(leftover)}>Save</button>
                      <button type="button" className="kitchen-edit-cancel" onClick={() => setEditingLeftover(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button type="button" className="kitchen-list-info kitchen-list-info--tap" onClick={() => startEditLeftover(leftover)}>
                      <span className="kitchen-list-name">{leftover.name}</span>
                      <span className="kitchen-list-meta">
                        {leftover.remainingServings} / {leftover.totalServings} servings · {leftover.perServing.kcal} cal · {leftover.perServing.protein}g per serving
                      </span>
                    </button>
                    <div className="kitchen-list-actions">
                      <button type="button" className="kitchen-list-edit" onClick={() => startEditLeftover(leftover)} aria-label="Edit leftover">
                        <EditIcon />
                      </button>
                      <button type="button" className="kitchen-list-delete" onClick={() => dispatch({ type: 'DELETE_LEFTOVER', payload: leftover.id })} aria-label="Delete leftover">
                        <DeleteIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
