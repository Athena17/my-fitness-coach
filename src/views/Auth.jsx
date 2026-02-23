import { useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import './Auth.css';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const isSignUp = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setConfirmMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setConfirmMessage('Check your email for a confirmation link!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(isSignUp ? 'signin' : 'signup');
    setError('');
    setConfirmMessage('');
  }

  return (
    <div className={`auth ${isSignUp ? 'auth--signup' : 'auth--signin'}`}>
      <div className="auth-content" key={mode}>
        <img src="./logo.svg" alt="Irada" className="auth-logo" />
        <h1 className="auth-title">Irada</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Start your journey' : 'Welcome back'}
        </p>

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}
            {confirmMessage && <p className="auth-confirm">{confirmMessage}</p>}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

        <button
          type="button"
          className="auth-toggle"
          onClick={toggleMode}
        >
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
