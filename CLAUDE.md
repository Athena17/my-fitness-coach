# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Irada** (Arabic for "willpower") — a mobile-first calorie & macro tracking PWA. React 19 + Vite 7, JavaScript (JSX), no TypeScript. Deployed to GitHub Pages via `gh-pages`.

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint across the project
- `npx gh-pages -d dist` — Deploy to GitHub Pages (run `npm run build` first)

## Architecture

- **Entry point:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **Build tool:** Vite with `@vitejs/plugin-react` (Babel-based)
- **ESLint:** Flat config (`eslint.config.js`) with react-hooks and react-refresh plugins. `no-unused-vars` ignores variables starting with uppercase or underscore.
- **Module system:** ES modules (`"type": "module"` in package.json)

### State Management

`useReducer` + React Context (`src/context/AppContext.jsx`, consumed via `src/context/useApp.js`).

**State shape:**
```
{ targets, entries, exerciseLogs, waterLogs, currentView, editingEntry }
```

**Action types:** `SET_TARGETS`, `ADD_ENTRY`, `UPDATE_ENTRY`, `DELETE_ENTRY`, `SET_VIEW`, `SET_EDITING_ENTRY`, `ADD_EXERCISE`, `DELETE_EXERCISE`, `ADD_WATER`, `DELETE_WATER`, `IMPORT_DATA`

### Persistence

All data stored in localStorage via `src/utils/storage.js`. Keys prefixed with `nt_`:
- `nt_targets`, `nt_entries`, `nt_exercise_logs`, `nt_water_logs`, `nt_custom_meals`, `nt_schema_version`

### Views

| View | File | Purpose |
|------|------|---------|
| Today | `src/views/Today.jsx` | Main dashboard — rings, meal groups, food adding flow, exercise, water |
| History | `src/views/History.jsx` | Monthly calendar with heat-map + water drops, daily detail |
| Settings | `src/views/Settings.jsx` | User targets, data export/import, clear data |
| Onboarding | `src/views/Onboarding.jsx` | First-run wizard for calorie/protein targets |
| FoodLog | `src/views/FoodLog.jsx` | Food entry form (used for search-selected and editing flows) |

### Key Components

- **MealBuilder** (`src/components/MealBuilder.jsx`) — ingredient-based meal builder with portion units. Saves custom meals to localStorage.
- **FoodSearch** (`src/components/FoodSearch.jsx`) — searches `foodDatabase.js` + saved custom meals (shown with "My Meal" badge).
- **NaturalInput** (`src/components/NaturalInput.jsx`) — natural language food input ("2 eggs and toast").
- **FoodEntryCard** — swipeable food entry with edit/delete. Entries with `ingredients` array open MealBuilder on edit.
- **ExercisePanel** / **WaterPanel** — logging panels for exercise and water intake.
- **GoalBar** / **ProgressBar** — visual progress indicators.
- **InsightCard** — collapsible weekly insights with rule-based analysis.

### Data Flow for Adding Food (Today.jsx)

The add-meal flow in Today.jsx uses an `addMode` state (`null` | `'describe'` | `'manual'` | `'build'`):
1. **Default (null):** Inline FoodSearch + three alternative pill buttons (Describe, Enter Manually, Build Meal)
2. **Describe:** NaturalInput component for natural language
3. **Manual:** Inline form (name, calories, protein)
4. **Build:** MealBuilder with ingredient database

All sub-views share a consistent `add-mode-header` (back arrow + title). Back returns to search view; X closes the meal row.

### Food Entry Structure

```js
{ id, name, kcal, protein, meal, servingSize, servingUnit, timestamp, dateKey, ingredients? }
```

The optional `ingredients` array (from MealBuilder) stores `{ name, grams, kcal, protein }` per ingredient, enabling edit-with-ingredients.

### Design System

Glass morphism with CSS custom properties defined in `src/App.css`. Apple Watch-style progress rings on the dashboard. Mobile-first layout.
