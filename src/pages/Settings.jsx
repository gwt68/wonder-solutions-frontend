import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Settings() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.getPin()
      .then((r) => setCurrentPin(r.pin))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.settings.setPin(newPin);
      setCurrentPin(newPin);
      setNewPin('');
      setSuccess('PIN updated. Use the new PIN next time you call in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage access to your call-in line</p>
        </div>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 420 }}>
        <h3 style={{ marginBottom: 4 }}>Call-in PIN</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 16px' }}>
          Required to access the phone menu when you call in.
        </p>
        {error && <div className="banner error">{error}</div>}
        {success && <div className="banner ok">{success}</div>}
        {!loading && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginBottom: 18 }}>
            Current PIN: {currentPin}
          </p>
        )}
        <form onSubmit={handleSave}>
          <div className="field">
            <label>New PIN (4-8 digits)</label>
            <input
              required
              inputMode="numeric"
              pattern="\d{4,8}"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="e.g. 4471"
            />
          </div>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving...' : 'Update PIN'}</button>
        </form>
      </div>
    </div>
  );
}
