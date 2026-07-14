import React, { useEffect, useState } from 'react';
import Contacts from './pages/Contacts.jsx';
import Groups from './pages/Groups.jsx';
import Texts from './pages/Texts.jsx';
import Messages from './pages/Messages.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import { setToken } from './api.js';

const PAGES = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'groups', label: 'Groups' },
  { key: 'texts', label: 'Texts' },
  { key: 'messages', label: 'Recordings' },
  { key: 'settings', label: 'Settings' },
];

export default function App() {
  const [page, setPage] = useState('contacts');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('wonder_token'));

  useEffect(() => {
    function handleLogout() { setLoggedIn(false); }
    window.addEventListener('wonder-logout', handleLogout);
    return () => window.removeEventListener('wonder-logout', handleLogout);
  }, []);

  function handleLogoutClick() {
    setToken(null);
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="brand-name">
            Wonder Solutions
            <small>MESSAGE CONSOLE</small>
          </div>
        </div>
        <nav className="nav">
          {PAGES.map((p) => (
            <button
              key={p.key}
              className={`nav-item ${page === p.key ? 'active' : ''}`}
              onClick={() => setPage(p.key)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <button
          className="nav-item"
          style={{ marginTop: 'auto' }}
          onClick={handleLogoutClick}
        >
          <i className="ti ti-logout" /> Log out
        </button>
      </aside>
      <main className="main">
        {page === 'contacts' && <Contacts />}
        {page === 'groups' && <Groups />}
        {page === 'texts' && <Texts />}
        {page === 'messages' && <Messages />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
