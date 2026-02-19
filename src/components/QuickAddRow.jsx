import { useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/useApp.js';
import { getEmoji } from '../utils/foodEmoji.js';
import ScrollStrip from './ScrollStrip.jsx';
import './QuickAddRow.css';

const LONG_PRESS_MS = 300;
const TAP_THRESHOLD_PX = 8;

function preventTouchScroll(e) { e.preventDefault(); }

function detectMeal(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    const row = el.closest('[data-meal]');
    if (row) return row.dataset.meal;
  }
  return null;
}

export default function QuickAddRow({ onSelect, dragItem, setDragItem, setDragOverMeal, onDrop }) {
  const { state } = useApp();
  const customMeals = state.customMeals || [];
  const dragRef = useRef(null);
  const docRef = useRef(null);

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

  // --- Cleanup ---

  const removeGhost = useCallback(() => {
    const el = document.querySelector('.qmr-ghost');
    if (el) el.remove();
  }, []);

  const cleanupAll = useCallback(() => {
    if (dragRef.current?.timerId) clearTimeout(dragRef.current.timerId);
    dragRef.current = null;
    removeGhost();
    if (docRef.current) {
      document.removeEventListener('pointermove', docRef.current.move);
      document.removeEventListener('pointerup', docRef.current.up);
      document.removeEventListener('pointercancel', docRef.current.cancel);
      document.removeEventListener('touchmove', preventTouchScroll);
      docRef.current = null;
    }
  }, [removeGhost]);

  useEffect(() => cleanupAll, [cleanupAll]);

  // --- Pointer handlers ---

  const handlePointerDown = useCallback((e, item, cardEl) => {
    if (e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;

    const timerId = setTimeout(() => {
      if (!dragRef.current) return;
      dragRef.current.isDragging = true;
      dragRef.current.item = item;
      setDragItem(item);
      if (navigator.vibrate) navigator.vibrate(30);

      // Create ghost
      const ghost = cardEl.cloneNode(true);
      ghost.className = 'qmr-ghost';
      const rect = cardEl.getBoundingClientRect();
      ghost.style.width = rect.width + 'px';
      ghost.style.left = (startX - rect.width / 2) + 'px';
      ghost.style.top = (startY - rect.height / 2) + 'px';
      document.body.appendChild(ghost);
      dragRef.current.ghost = ghost;

      // Document-level listeners for reliable tracking
      const docMove = (ev) => {
        ev.preventDefault();
        const d = dragRef.current;
        if (!d?.ghost) return;
        const w = parseFloat(d.ghost.style.width);
        const h = d.ghost.getBoundingClientRect().height;
        d.ghost.style.left = (ev.clientX - w / 2) + 'px';
        d.ghost.style.top = (ev.clientY - h / 2) + 'px';
        setDragOverMeal(detectMeal(ev.clientX, ev.clientY));
      };

      const docUp = (ev) => {
        const droppedItem = dragRef.current?.item;
        const meal = detectMeal(ev.clientX, ev.clientY);
        cleanupAll();
        if (meal && droppedItem) {
          onDrop(droppedItem, meal);
        } else {
          setDragItem(null);
          setDragOverMeal(null);
        }
      };

      const docCancel = () => {
        cleanupAll();
        setDragItem(null);
        setDragOverMeal(null);
      };

      docRef.current = { move: docMove, up: docUp, cancel: docCancel };
      document.addEventListener('pointermove', docMove);
      document.addEventListener('pointerup', docUp);
      document.addEventListener('pointercancel', docCancel);
      document.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }, LONG_PRESS_MS);

    dragRef.current = { startX, startY, timerId, isDragging: false, ghost: null, item };
  }, [setDragItem, setDragOverMeal, onDrop, cleanupAll]);

  const handlePointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > TAP_THRESHOLD_PX || Math.abs(dy) > TAP_THRESHOLD_PX) {
      clearTimeout(d.timerId);
      dragRef.current = null;
    }
  }, []);

  const handlePointerUp = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    clearTimeout(d.timerId);
    const item = d.item;
    dragRef.current = null;
    if (Math.abs(dx) < TAP_THRESHOLD_PX && Math.abs(dy) < TAP_THRESHOLD_PX) {
      onSelect(item);
    }
  }, [onSelect]);

  const handlePointerCancel = useCallback(() => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    clearTimeout(d.timerId);
    dragRef.current = null;
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="qmr">
      <span className="qmr-label">Quick Add</span>
      {dragItem && <span className="qmr-drag-hint">Drop on a meal below</span>}
      <ScrollStrip className="qmr-scroll">
        {items.map((item) => (
          <button
            key={item.id}
            className={[
              'qmr-card',
              item.type === 'leftover' ? 'qmr-card--kitchen' : 'qmr-card--meal',
              dragItem?.id === item.id && 'qmr-card--dragging',
            ].filter(Boolean).join(' ')}
            onPointerDown={(e) => handlePointerDown(e, item, e.currentTarget)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{ touchAction: 'pan-x' }}
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
