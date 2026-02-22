import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase.js';
import { AuthContext } from './authContext.js';

const SITE_URL = import.meta.env.PROD
  ? 'https://athena17.github.io/my-fitness-coach/'
  : window.location.origin + '/';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        // Handle PKCE code exchange from email verification redirect
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error('Code exchange failed:', error.message);
          // Clean the URL so the code doesn't linger
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Also handle legacy hash-based tokens (access_token in URL fragment)
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery'))) {
          // Supabase JS auto-detects hash tokens on getSession()
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Get the current session (works after code exchange or from stored session)
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth init error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: SITE_URL },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
