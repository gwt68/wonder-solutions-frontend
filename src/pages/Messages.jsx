import React, { useEffect, useRef, useState } from 'react';
import { api, audioUrl } from '../api.js';

const TYPE_LABELS = { sms: 'Text', call: 'Phone call', voice_note: 'Voice note' };

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const all = await api.messages.list();
      setMessages(all.filter((m) => m.type !== 'sms'));
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

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await api.messages.uploadAudio(file, file.name.replace(/\.[^/.]+$/, ''));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recordings</h1>
          <p>Voice notes and calls made by phone or uploaded here</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
          <button className="btn" onClick={handleUploadClick} disabled={uploading}>
            <i className="ti ti-upload" /> {uploading ? 'Uploading...' : 'Upload audio'}
          </button>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : messages.length === 0 ? (
        <div className="card empty-state">
          <h3>No messages yet</h3>
          <p>Call your Wonder Solutions line and press 1 to record one, or upload an audio file here.</p>
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
                {(m.audio_url || m.has_uploaded_audio) && (
                  <audio controls src={audioUrl(m.id)} style={{ marginTop: 6 }} />
                )}
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
