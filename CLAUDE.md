# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 single-page application scaffolded with Vite 7. Uses JavaScript (JSX), not TypeScript.

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint across the project

## Architecture

- **Entry point:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **Build tool:** Vite with `@vitejs/plugin-react` (Babel-based)
- **ESLint:** Flat config (`eslint.config.js`) with react-hooks and react-refresh plugins. The `no-unused-vars` rule ignores variables starting with uppercase or underscore.
- **Module system:** ES modules (`"type": "module"` in package.json)
