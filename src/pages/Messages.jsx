import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const TYPE_LABELS = { sms: 'Text', call: 'Phone call', voice_note: 'Voice note' };

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      setMessages(await api.messages.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await api.messages.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p>Recordings made by calling in, ready to send</p>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : messages.length === 0 ? (
        <div className="card empty-state">
          <h3>No messages yet</h3>
          <p>Call your Wonder Solutions line and press 1 to record one.</p>
        </div>
      ) : (
        <div className="list">
          {messages.map((m) => (
            <div className="row" key={m.id}>
              <div className="row-main">
                <span className="row-title">{m.title || 'Untitled message'}</span>
                <span className="row-sub">
                  {new Date(m.created_at).toLocaleString()} · <span className="pill">{TYPE_LABELS[m.type] || m.type}</span>
                </span>
                {m.audio_url && <audio controls src={m.audio_url} style={{ marginTop: 6 }} />}
                {m.text_content && <p style={{ margin: '6px 0 0', fontSize: 14 }}>{m.text_content}</p>}
              </div>
              <div className="row-actions">
                <button className="icon-btn danger" onClick={() => handleDelete(m.id)} aria-label="Delete message"><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
