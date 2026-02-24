import { useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import './Auth.css';

export default function PasswordReset() {
  const { changePassword, setRecoveryMode } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(password);
      setSuccess(true);
      setTimeout(() => setRecoveryMode(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth auth--signin">
      <div className="auth-content">
        <img src="./logo.svg" alt="Irada" className="auth-logo" />
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Choose a new password for your account</p>

        <div className="auth-card">
          {success ? (
            <p className="auth-confirm" style={{ padding: '12px 0', textAlign: 'center' }}>
              Password updated! Redirecting...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reset-confirm">Confirm password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
