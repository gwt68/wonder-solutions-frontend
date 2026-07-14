import React, { useState } from 'react';
import Contacts from './pages/Contacts.jsx';
import Groups from './pages/Groups.jsx';
import Messages from './pages/Messages.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = [
  { key: 'contacts', label: 'Contacts', icon: <i className="ti ti-users" /> },
  { key: 'groups', label: 'Groups', icon: <i className="ti ti-folder" /> },
  { key: 'messages', label: 'Messages', icon: <i className="ti ti-mail" /> },
  { key: 'settings', label: 'Settings', icon: <i className="ti ti-settings" /> },
];

export default function App() {
  const [page, setPage] = useState('contacts');

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
      </aside>
      <main className="main">
        {page === 'contacts' && <Contacts />}
        {page === 'groups' && <Groups />}
        {page === 'messages' && <Messages />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
