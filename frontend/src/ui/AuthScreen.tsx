import React, { useState } from 'react';
import './AuthScreen.css';

/**
 * AuthScreen — Login / Register screen.
 *
 * Shown before the user enters the whiteboard.
 * On successful auth, calls onAuth with the user info and JWT token.
 * Also supports "Continue as Guest" for development convenience.
 *
 * Design: Centered card with glassmorphism, matching the overall
 * dark theme from DESIGN.md. Two-tab layout (Login / Register).
 */

interface AuthScreenProps {
  onAuth: (user: { id: string; displayName: string; email: string }, token: string) => void;
}

const API_URL = 'http://localhost:3001/api/auth';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const body: Record<string, string> = { email, password };
      if (mode === 'register') body.displayName = displayName;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      // Store token in localStorage for persistence across refreshes
      localStorage.setItem('collab_token', data.token);
      localStorage.setItem('collab_user', JSON.stringify(data.user));

      onAuth(data.user, data.token);
    } catch {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    const guestId = `guest-${Math.floor(Math.random() * 10000)}`;
    const guestUser = { id: guestId, displayName: guestId, email: '' };
    onAuth(guestUser, '');
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">🎨 Collab Whiteboard</h1>
          <p className="auth-subtitle">Real-time collaborative drawing with custom CRDTs</p>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Display Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-guest" onClick={handleGuestAccess}>
          Continue as Guest
        </button>

        <p className="auth-footer">
          Built with CRDTs • WebSockets • Canvas API
        </p>
      </div>
    </div>
  );
};
