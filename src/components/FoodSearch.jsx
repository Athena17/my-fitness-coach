import { useState, useRef, useEffect } from 'react';
import foodDatabase from '../data/foodDatabase.js';
import './FoodSearch.css';

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(value) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const q = value.toLowerCase();
    const matches = foodDatabase.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    ).slice(0, 10);
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
        placeholder="Search foods (e.g. chicken, rice)..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="food-search-input"
      />
      {isOpen && (
        <ul className="food-search-dropdown">
          {results.map((food, i) => (
            <li key={i}>
              <button className="food-search-item" onClick={() => handleSelect(food)}>
                <span className="food-search-name">{food.name}</span>
                <span className="food-search-meta">
                  {food.serving.kcal} kcal · {food.serving.protein}g · {food.serving.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
