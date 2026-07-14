import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import SendModal from '../components/SendModal.jsx';

export default function Texts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const all = await api.messages.list();
      setMessages(all.filter((m) => m.type === 'sms'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setTitle('');
    setBody('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.messages.create({ type: 'sms', title: title || null, text_content: body });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this text?')) return;
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
          <h1>Texts</h1>
          <p>Text messages ready to send</p>
        </div>
        <button className="btn" onClick={openNew}><i className="ti ti-plus" /> New text</button>
      </div>

      {error && <div className="banner error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : messages.length === 0 ? (
        <div className="card empty-state">
          <h3>No texts yet</h3>
          <p>Write your first text message to have it ready to send.</p>
        </div>
      ) : (
        <div className="list">
          {messages.map((m) => (
            <div className="row" key={m.id}>
              <div className="row-main">
                <span className="row-title">{m.title || 'Untitled text'}</span>
                <span className="row-sub">{new Date(m.created_at).toLocaleString()}</span>
                {m.text_content && <p style={{ margin: '6px 0 0', fontSize: 14 }}>{m.text_content}</p>}
              </div>
              <div className="row-actions">
                <button className="icon-btn" onClick={() => setSendingMessage(m)} aria-label="Send text"><i className="ti ti-send" /></button>
                <button className="icon-btn danger" onClick={() => handleDelete(m.id)} aria-label="Delete text"><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New text</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Title (for your reference only)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
              </div>
              <div className="field">
                <label>Message</label>
                <textarea
                  required
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What should this text say?"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save text'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {sendingMessage && (
        <SendModal message={sendingMessage} onClose={() => setSendingMessage(null)} />
      )}
    </div>
  );
}
