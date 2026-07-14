import React, { useEffect, useRef, useState } from 'react';
import { api, audioUrl } from '../api.js';
import { trimAudioToWav } from '../audioTrim.js';

const TYPE_LABELS = { sms: 'Text', call: 'Phone call', voice_note: 'Voice note' };

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // the message object being edited
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
          <h3>No recordings yet</h3>
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
              </div>
              <div className="row-actions">
                <button className="icon-btn" onClick={() => setEditing(m)} aria-label="Edit recording"><i className="ti ti-edit" /></button>
                <button className="icon-btn danger" onClick={() => handleDelete(m.id)} aria-label="Delete message"><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditRecordingModal
          message={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function EditRecordingModal({ message, onClose, onSaved }) {
  const [title, setTitle] = useState(message.title || '');
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);
  const src = audioUrl(message.id);

  function handleLoadedMetadata() {
    const d = audioRef.current.duration;
    setDuration(d);
    setEnd(d);
  }

  function handlePreviewTrim() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = start;
    audioRef.current.play();
    const stopAt = () => {
      if (audioRef.current.currentTime >= end) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', stopAt);
      }
    };
    audioRef.current.addEventListener('timeupdate', stopAt);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (title !== (message.title || '')) {
        await api.messages.rename(message.id, title);
      }
      const isTrimmed = duration > 0 && (start > 0.05 || end < duration - 0.05);
      if (isTrimmed) {
        const wavBlob = await trimAudioToWav(src, start, end);
        await api.messages.replaceAudio(message.id, wavBlob);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit recording</h2>
        {error && <div className="banner error">{error}</div>}

        <div className="field">
          <label>Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled message" />
        </div>

        <div className="field">
          <label>Preview</label>
          <audio
            ref={audioRef}
            controls
            src={src}
            style={{ width: '100%' }}
            onLoadedMetadata={handleLoadedMetadata}
          />
        </div>

        {duration > 0 && (
          <>
            <div className="field">
              <label>Trim start: {start.toFixed(1)}s</label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={start}
                onChange={(e) => setStart(Math.min(parseFloat(e.target.value), end - 0.1))}
                style={{ width: '100%' }}
              />
            </div>
            <div className="field">
              <label>Trim end: {end.toFixed(1)}s (full length: {duration.toFixed(1)}s)</label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={end}
                onChange={(e) => setEnd(Math.max(parseFloat(e.target.value), start + 0.1))}
                style={{ width: '100%' }}
              />
            </div>
            <button type="button" className="btn secondary" onClick={handlePreviewTrim} style={{ marginBottom: 8 }}>
              <i className="ti ti-player-play" /> Preview trimmed section
            </button>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
