import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const METHOD_LABELS = { sms: 'text', call: 'phone call', voice_note: 'voice note' };

export default function Dashboard({ onNavigate }) {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sends, setSends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.contacts.list(), api.groups.list(), api.messages.list(), api.sends.list()])
      .then(([c, g, m, s]) => { setContacts(c); setGroups(g); setMessages(m); setSends(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>;
  if (error) return <div className="banner error">{error}</div>;

  const today = new Date().toDateString();
  const sentToday = sends.filter((s) => s.sent_at && new Date(s.sent_at).toDateString() === today).length;
  const scheduled = sends.filter((s) => s.status === 'scheduled');
  const recentActivity = sends.filter((s) => s.status !== 'scheduled').slice(0, 8);

  const stats = [
    { label: 'Contacts', value: contacts.length, page: 'contacts' },
    { label: 'Groups', value: groups.length, page: 'groups' },
    { label: 'Messages', value: messages.length, page: 'messages' },
    { label: 'Sent today', value: sentToday, page: 'history' },
    { label: 'Scheduled', value: scheduled.length, page: 'history' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of your contacts, messages, and sends</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 28 }}>
        {stats.map((s) => (
          <button key={s.label} className="stat-card" onClick={() => onNavigate && onNavigate(s.page)}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </button>
        ))}
      </div>

      {scheduled.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Upcoming scheduled sends</h3>
          <div className="list" style={{ marginBottom: 28 }}>
            {scheduled.slice(0, 5).map((s) => (
              <div className="row" key={s.id}>
                <div className="row-main">
                  <span className="row-title">{s.message_title || 'Untitled'} → {s.contact_name || s.phone_number}</span>
                  <span className="row-sub">
                    via {METHOD_LABELS[s.effective_method] || s.effective_method} · {new Date(s.scheduled_at).toLocaleString()}
                  </span>
                </div>
                <span className="pill signal">Scheduled</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Recent activity</h3>
      {recentActivity.length === 0 ? (
        <div className="card empty-state">
          <h3>Nothing sent yet</h3>
          <p>Send your first message and it'll show up here.</p>
        </div>
      ) : (
        <div className="list">
          {recentActivity.map((s) => (
            <div className="row" key={s.id}>
              <div className="row-main">
                <span className="row-title">{s.message_title || 'Untitled'} → {s.contact_name || s.phone_number}</span>
                <span className="row-sub">
                  via {METHOD_LABELS[s.effective_method] || s.effective_method}
                  {s.sent_at && ` · ${new Date(s.sent_at).toLocaleString()}`}
                </span>
              </div>
              <span className="pill" style={s.status === 'failed' ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : undefined}>
                {s.status === 'sent' ? 'Sent' : s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
