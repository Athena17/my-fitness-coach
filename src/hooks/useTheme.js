import { useState, useCallback, useEffect } from 'react';

function getInitial() {
  const saved = localStorage.getItem('nt_theme');
  if (saved) return saved;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitial);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('nt_theme', t);
  }, []);

  // Sync on mount (in case HTML script and React disagree)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for system preference changes when no saved preference
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    function onChange(e) {
      if (!localStorage.getItem('nt_theme')) {
        const next = e.matches ? 'dark' : 'light';
        setThemeState(next);
        document.documentElement.setAttribute('data-theme', next);
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return { theme, setTheme };
}
