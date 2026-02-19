import { useApp } from '../context/useApp.js';
import { getEmoji } from '../utils/foodEmoji.js';
import ScrollStrip from './ScrollStrip.jsx';
import './QuickAddRow.css';

export default function QuickAddRow({ onSelect }) {
  const { state } = useApp();
  const customMeals = state.customMeals || [];

  const kitchenItems = (state.leftovers || [])
    .filter((l) => l.remainingServings > 0)
    .map((l) => ({
      type: 'leftover',
      id: l.id,
      name: l.name,
      kcal: l.perServing.kcal,
      protein: l.perServing.protein,
      remaining: l.remainingServings,
      leftover: l,
    }));

  const mealItems = customMeals.map((m, i) => ({
    type: 'meal',
    id: m.id || `meal-${i}`,
    name: m.name,
    kcal: m.kcal,
    protein: m.protein,
    ingredients: m.ingredients,
  }));

  const items = [...kitchenItems, ...mealItems];

  if (items.length === 0) return null;

  return (
    <div className="qmr">
      <span className="qmr-label">Quick Add</span>
      <ScrollStrip className="qmr-scroll">
        {items.map((item) => (
          <button
            key={item.id}
            className={`qmr-card ${item.type === 'leftover' ? 'qmr-card--kitchen' : 'qmr-card--meal'}`}
            onClick={() => onSelect(item)}
          >
            <span className="qmr-add-btn" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
            </span>
            <span className="qmr-card-emoji">{getEmoji(item.name)}</span>
            <span className="qmr-card-name">{item.name}</span>
            {item.type === 'leftover' ? (
              <span className="qmr-card-tag">In Kitchen · {item.remaining} left</span>
            ) : (
              <span className="qmr-card-macros">{Math.round(item.kcal)} cal · {Math.round(item.protein)}g</span>
            )}
          </button>
        ))}
      </ScrollStrip>
    </div>
  );
}
