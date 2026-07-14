import React, { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.auth.login(username, password);
      setToken(token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--accent)',
    }}>
      <div className="card" style={{ padding: 32, width: '100%', maxWidth: 360, background: 'var(--surface)' }}>
        <div className="brand-mark" aria-hidden="true" style={{ margin: '0 auto 16px' }}>
          <span></span><span></span><span></span><span></span>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 20, marginBottom: 4 }}>Wonder Solutions</h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 24px' }}>
          Message console
        </p>
        {error && <div className="banner error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
