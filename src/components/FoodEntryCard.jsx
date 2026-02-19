import { useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/useApp.js';
import { getEmoji } from '../utils/foodEmoji.js';
import './FoodEntryCard.css';

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

export default function FoodEntryCard({ entry, onDelete, dragEntryId, setDragEntryId, setDragOverMeal, onEntryDrop }) {
  const { dispatch } = useApp();
  const dragRef = useRef(null);
  const docRef = useRef(null);
  const isDragging = dragEntryId === entry.id;

  // --- Ghost helpers ---

  const removeGhost = useCallback(() => {
    const el = document.querySelector('.fec-ghost');
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

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.fec-delete')) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const cardEl = e.currentTarget;

    const timerId = setTimeout(() => {
      if (!dragRef.current) return;
      dragRef.current.isDragging = true;
      setDragEntryId(entry.id);
      if (navigator.vibrate) navigator.vibrate(30);

      // Create ghost
      const ghost = cardEl.cloneNode(true);
      ghost.className = 'fec-ghost';
      const rect = cardEl.getBoundingClientRect();
      ghost.style.width = rect.width + 'px';
      ghost.style.left = (startX - rect.width / 2) + 'px';
      ghost.style.top = (startY - rect.height / 2) + 'px';
      document.body.appendChild(ghost);
      dragRef.current.ghost = ghost;

      // Document-level listeners for reliable tracking in all directions
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
        const meal = detectMeal(ev.clientX, ev.clientY);
        cleanupAll();
        if (meal && meal !== entry.meal) {
          onEntryDrop(entry, meal);
        }
        setDragEntryId(null);
        setDragOverMeal(null);
      };

      const docCancel = () => {
        cleanupAll();
        setDragEntryId(null);
        setDragOverMeal(null);
      };

      docRef.current = { move: docMove, up: docUp, cancel: docCancel };
      document.addEventListener('pointermove', docMove);
      document.addEventListener('pointerup', docUp);
      document.addEventListener('pointercancel', docCancel);
      document.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }, LONG_PRESS_MS);

    dragRef.current = { startX, startY, timerId, isDragging: false, ghost: null };
  }, [entry, setDragEntryId, setDragOverMeal, onEntryDrop, cleanupAll]);

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
    dragRef.current = null;
    if (Math.abs(dx) < TAP_THRESHOLD_PX && Math.abs(dy) < TAP_THRESHOLD_PX) {
      dispatch({ type: 'SET_EDITING_ENTRY', payload: entry });
    }
  }, [dispatch, entry]);

  const handlePointerCancel = useCallback(() => {
    const d = dragRef.current;
    if (!d || d.isDragging) return;
    clearTimeout(d.timerId);
    dragRef.current = null;
  }, []);

  return (
    <button
      className={`fec-card ${isDragging ? 'fec-card--dragging' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'pan-x' }}
    >
      <span
        className="fec-delete"
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(entry); } }}
      >
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
      </span>
      <span className="fec-emoji">{getEmoji(entry.name)}</span>
      <span className="fec-name">{entry.name}</span>
      <span className="fec-macros">{Math.round(entry.kcal)} cal · {Math.round(entry.protein)}g</span>
    </button>
  );
}
