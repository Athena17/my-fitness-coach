import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase.js';
import { AuthContext } from './authContext.js';

const SITE_URL = import.meta.env.PROD
  ? 'https://athena17.github.io/my-fitness-coach/'
  : window.location.origin + '/';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

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

        // Get the current session with a timeout to avoid hanging on token refresh
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth session timeout')), 8000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
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

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
    if (error) throw error;
  }

  async function changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword, changePassword, recoveryMode, setRecoveryMode }}>
      {children}
    </AuthContext.Provider>
  );
}
