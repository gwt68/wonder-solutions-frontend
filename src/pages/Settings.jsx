import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Settings() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(true);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [userSaving, setUserSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [recoveryKey, setRecoveryKey] = useState('');
  const [rkError, setRkError] = useState('');
  const [rkSuccess, setRkSuccess] = useState('');
  const [rkSaving, setRkSaving] = useState(false);

  useEffect(() => {
    api.settings.getPin()
      .then((r) => setCurrentPin(r.pin))
      .catch((e) => setPinError(e.message))
      .finally(() => setPinLoading(false));

    api.settings.getPortalUsername()
      .then((r) => setCurrentUsername(r.username))
      .catch((e) => setUserError(e.message))
      .finally(() => setUserLoading(false));
  }, []);

  async function handleSavePin(e) {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    setPinSaving(true);
    try {
      await api.settings.setPin(newPin);
      setCurrentPin(newPin);
      setNewPin('');
      setPinSuccess('PIN updated. Use the new PIN next time you call in.');
    } catch (err) {
      setPinError(err.message);
    } finally {
      setPinSaving(false);
    }
  }

  async function handleSaveUsername(e) {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setUserSaving(true);
    try {
      await api.settings.setPortalUsername(newUsername);
      setCurrentUsername(newUsername);
      setNewUsername('');
      setUserSuccess('Username updated. Use it next time you log in.');
    } catch (err) {
      setUserError(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwSaving(true);
    try {
      await api.settings.setPortalPassword(newPassword);
      setNewPassword('');
      setPwSuccess('Password updated. Use it next time you log in.');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSaveRecoveryKey(e) {
    e.preventDefault();
    setRkError('');
    setRkSuccess('');
    setRkSaving(true);
    try {
      await api.settings.setRecoveryKey(recoveryKey);
      setRecoveryKey('');
      setRkSuccess('Recovery key set. Keep it somewhere safe — you\'ll need it if you ever forget your login.');
    } catch (err) {
      setRkError(err.message);
    } finally {
      setRkSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage access to your call-in line and the web portal</p>
        </div>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 420, marginBottom: 18 }}>
        <h3 style={{ marginBottom: 4 }}>Call-in PIN</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 16px' }}>
          Required to access the phone menu when you call in.
        </p>
        {pinError && <div className="banner error">{pinError}</div>}
        {pinSuccess && <div className="banner ok">{pinSuccess}</div>}
        {!pinLoading && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginBottom: 18 }}>
            Current PIN: {currentPin}
          </p>
        )}
        <form onSubmit={handleSavePin}>
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
          <button type="submit" className="btn" disabled={pinSaving}>{pinSaving ? 'Saving...' : 'Update PIN'}</button>
        </form>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 420, marginBottom: 18 }}>
        <h3 style={{ marginBottom: 4 }}>Web portal username</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 16px' }}>
          Used together with your password to log in to this website.
        </p>
        {userError && <div className="banner error">{userError}</div>}
        {userSuccess && <div className="banner ok">{userSuccess}</div>}
        {!userLoading && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginBottom: 18 }}>
            Current username: {currentUsername}
          </p>
        )}
        <form onSubmit={handleSaveUsername}>
          <div className="field">
            <label>New username</label>
            <input
              required
              minLength={2}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. moishe"
            />
          </div>
          <button type="submit" className="btn" disabled={userSaving}>{userSaving ? 'Saving...' : 'Update username'}</button>
        </form>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 420, marginBottom: 18 }}>
        <h3 style={{ marginBottom: 4 }}>Account recovery key</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 16px' }}>
          Lets you reset your username and password if you ever forget them, from the "Forgot username or password?"
          link on the login screen. Set this up now, before you need it — for security, the current key isn't shown here.
        </p>
        {rkError && <div className="banner error">{rkError}</div>}
        {rkSuccess && <div className="banner ok">{rkSuccess}</div>}
        <form onSubmit={handleSaveRecoveryKey}>
          <div className="field">
            <label>New recovery key (at least 4 characters)</label>
            <input
              required
              minLength={4}
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              placeholder="A phrase or code only you know"
            />
          </div>
          <button type="submit" className="btn" disabled={rkSaving}>{rkSaving ? 'Saving...' : 'Set recovery key'}</button>
        </form>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 420 }}>
        <h3 style={{ marginBottom: 4 }}>Web portal password</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 16px' }}>
          Required to log in to this website. For security, the current password isn't shown here.
        </p>
        {pwError && <div className="banner error">{pwError}</div>}
        {pwSuccess && <div className="banner ok">{pwSuccess}</div>}
        <form onSubmit={handleSavePassword}>
          <div className="field">
            <label>New password (at least 4 characters)</label>
            <input
              required
              type="password"
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={pwSaving}>{pwSaving ? 'Saving...' : 'Update password'}</button>
        </form>
      </div>
    </div>
  );
}
