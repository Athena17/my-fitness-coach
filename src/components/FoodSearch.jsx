import { useState, useRef, useEffect, useMemo } from 'react';
import foodDatabase from '../data/foodDatabase.js';
import { useApp } from '../context/useApp.js';
import { hasMacroTargets } from '../utils/nutritionCalc.js';
import './FoodSearch.css';

export default function FoodSearch({ onSelect }) {
  const { state } = useApp();
  const mFlags = hasMacroTargets(state.targets);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const customMeals = state.customMeals || [];
  const wrapperRef = useRef(null);

  // Build up to 8 unique recent foods from entries, sorted by timestamp desc
  const recentFoods = useMemo(() => {
    const entries = state.entries || [];
    const sorted = [...entries].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const seen = new Set();
    const recent = [];
    for (const e of sorted) {
      const key = e.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recent.push({
        name: e.name,
        category: 'Recent',
        per100g: { kcal: 0, protein: 0 },
        serving: {
          size: e.servingSize || 1,
          unit: e.servingUnit || 'serving',
          label: `${e.servingSize || 1} ${e.servingUnit || 'serving'}`,
          kcal: e.kcal,
          protein: e.protein,
          carbs: e.carbs || 0,
          fat: e.fat || 0,
        },
        ingredients: e.ingredients,
        isRecent: true,
      });
      if (recent.length >= 8) break;
    }
    return recent;
  }, [state.entries]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function showRecentDropdown() {
    if (recentFoods.length > 0) {
      setResults(recentFoods);
      setIsOpen(true);
    }
  }

  function handleSearch(value) {
    setQuery(value);
    if (value.trim().length < 2) {
      if (value.trim().length === 0 && recentFoods.length > 0) {
        showRecentDropdown();
      } else {
        setResults([]);
        setIsOpen(false);
      }
      return;
    }
    const q = value.toLowerCase();

    // Search leftovers from state
    const leftovers = state.leftovers || [];
    const leftoverMatches = leftovers
      .filter((l) => l.remainingServings > 0 && l.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((l) => ({
        name: l.name,
        category: 'Leftovers',
        per100g: { kcal: 0, protein: 0 },
        serving: { size: 1, unit: 'serving', label: `1 serving · ${l.remainingServings} left`, kcal: l.perServing.kcal, protein: l.perServing.protein },
        isLeftover: true,
        leftoverId: l.id,
        recipeId: l.recipeId,
        remainingServings: l.remainingServings,
      }));

    // Search recipes from state
    const recipes = state.recipes || [];
    const recipeMatches = recipes
      .filter((r) => r.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((r) => ({
        name: r.name,
        category: 'Recipes',
        per100g: { kcal: 0, protein: 0 },
        serving: { size: 1, unit: 'serving', label: `1 serving (of ${r.servingsYield})`, kcal: r.perServing.kcal, protein: r.perServing.protein },
        isRecipe: true,
        recipeId: r.id,
      }));

    // Search custom meals (loaded from Supabase)
    const customMatches = customMeals
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((m) => ({
        name: m.name,
        category: 'My Meals',
        per100g: { kcal: 0, protein: 0 },
        serving: { size: 1, unit: 'meal', label: '1 meal', kcal: m.kcal, protein: m.protein },
        ingredients: m.ingredients,
        isCustomMeal: true,
      }));

    // Boost recently-used items to the top
    const recentMatches = recentFoods
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((r) => ({ ...r, isRecent: true }));

    // Search food database
    const usedSlots = leftoverMatches.length + recipeMatches.length + customMatches.length + recentMatches.length;
    const dbMatches = foodDatabase.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    ).slice(0, Math.max(10 - usedSlots, 3));

    const matches = [...recentMatches, ...leftoverMatches, ...recipeMatches, ...customMatches, ...dbMatches];
    setResults(matches);
    setIsOpen(matches.length > 0);
  }

  function handleSelect(food) {
    onSelect(food);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div className="food-search" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Search foods, meals, or leftovers…"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          if (results.length > 0) { setIsOpen(true); }
          else if (!query.trim() && recentFoods.length > 0) { showRecentDropdown(); }
        }}
        className="food-search-input"
      />
      {isOpen && (
        <ul className="food-search-dropdown">
          {!query.trim() && results.length > 0 && results[0].isRecent && (
            <li className="food-search-section-label">Recently Eaten</li>
          )}
          {results.map((food, i) => (
            <li key={i}>
              <button className="food-search-item" onClick={() => handleSelect(food)}>
                <span className="food-search-name">
                  {food.isRecent && <span className="food-search-badge food-search-badge--recent">Recent</span>}
                  {food.isLeftover && <span className="food-search-badge food-search-badge--leftover">Leftover</span>}
                  {food.isRecipe && <span className="food-search-badge food-search-badge--recipe">Recipe</span>}
                  {food.isCustomMeal && <span className="food-search-badge">My Meal</span>}
                  {food.name}
                </span>
                <span className="food-search-meta">
                  {food.serving.kcal} cal · {food.serving.protein}g
                  {mFlags.showCarbs && food.serving.carbs > 0 && ` · C ${food.serving.carbs}g`}
                  {mFlags.showFat && food.serving.fat > 0 && ` · F ${food.serving.fat}g`}
                  {' · '}{food.serving.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
