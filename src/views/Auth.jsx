import { useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import './Auth.css';

function friendlyAuthError(message) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials'))
    return 'Incorrect email or password.';
  if (msg.includes('user already registered'))
    return 'An account with this email already exists.';
  if (msg.includes('email not confirmed'))
    return 'Please confirm your email first.';
  if (msg.includes('password') && (msg.includes('short') || msg.includes('at least')))
    return 'Password must be at least 6 characters.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Please wait a moment.';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch'))
    return 'Connection error. Check your internet.';
  return message || 'Something went wrong. Please try again.';
}

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
      setError(friendlyAuthError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(isSignUp ? 'signin' : 'signup');
    setError('');
    setConfirmMessage('');
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setError('');
    setConfirmMessage('');
    setForgotLoading(true);
    try {
      await resetPassword(email.trim());
      setConfirmMessage('Password reset link sent! Check your email.');
    } catch (err) {
      setError(friendlyAuthError(err.message));
    } finally {
      setForgotLoading(false);
    }
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

            {!isSignUp && (
              <button
                type="button"
                className="auth-forgot"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Forgot password?'}
              </button>
            )}

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
