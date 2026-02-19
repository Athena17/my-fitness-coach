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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setConfirmMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
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
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setConfirmMessage('');
  }

  return (
    <div className="auth">
      <div className="auth-content">
        <h1 className="auth-title">myfitnesscoach</h1>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
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
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}
            {confirmMessage && <p className="auth-confirm">{confirmMessage}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>

        <button
          type="button"
          className="auth-toggle"
          onClick={toggleMode}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}
