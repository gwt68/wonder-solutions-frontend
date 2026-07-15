import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_STYLES = {
  sent: { className: 'pill', label: 'Sent' },
  scheduled: { className: 'pill signal', label: 'Scheduled' },
  failed: { className: 'pill', label: 'Failed', style: { background: 'var(--danger-soft)', color: 'var(--danger)' } },
};

const DELIVERY_LABELS = {
  queued: 'Queued', sending: 'Sending', sent: 'Sent', delivered: 'Delivered', undelivered: 'Undelivered', failed: 'Failed',
  initiated: 'Calling', ringing: 'Ringing', 'in-progress': 'In progress', answered: 'Answered',
  completed: 'Completed', busy: 'Busy', 'no-answer': 'No answer', canceled: 'Canceled',
};

const ANSWERED_BY_LABELS = {
  human: 'Answered by a person',
  machine_start: 'Went to voicemail',
  machine_end_beep: 'Went to voicemail',
  machine_end_silence: 'Went to voicemail',
  machine_end_other: 'Went to voicemail',
  fax: 'Answered by a fax machine',
  unknown: 'Unknown',
};

const METHOD_LABELS = { sms: 'text', call: 'phone call', voice_note: 'voice note' };

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function History() {
  const [sends, setSends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      setSends(await api.sends.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this record from history?')) return;
    try {
      await api.sends.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p>What's been sent and scheduled</p>
        </div>
        <button className="btn secondary" onClick={load}><i className="ti ti-refresh" /> Refresh</button>
      </div>

      {error && <div className="banner error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : sends.length === 0 ? (
        <div className="card empty-state">
          <h3>Nothing sent yet</h3>
          <p>Once you send or schedule a message, it'll show up here.</p>
        </div>
      ) : (
        <div className="list">
          {sends.map((s) => {
            const statusInfo = STATUS_STYLES[s.status] || { className: 'pill', label: s.status };
            const duration = formatDuration(s.call_duration);
            return (
              <div className="row" key={s.id}>
                <div className="row-main">
                  <span className="row-title">
                    {s.message_title || 'Untitled message'}
                    <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}> → {s.contact_name || s.phone_number}</span>
                  </span>
                  <span className="row-sub">
                    {s.phone_number} · via {METHOD_LABELS[s.effective_method] || s.effective_method}
                    {s.status === 'scheduled' && s.scheduled_at && ` · scheduled for ${new Date(s.scheduled_at).toLocaleString()}`}
                    {s.sent_at && ` · ${new Date(s.sent_at).toLocaleString()}`}
                  </span>
                  {s.delivery_status && (
                    <span className="row-sub">
                      {DELIVERY_LABELS[s.delivery_status] || s.delivery_status}
                      {duration && ` · ${duration}`}
                      {s.answered_by && ` · ${ANSWERED_BY_LABELS[s.answered_by] || s.answered_by}`}
                    </span>
                  )}
                  {s.error_message && (
                    <span className="row-sub" style={{ color: 'var(--danger)' }}>{s.error_message}</span>
                  )}
                </div>
                <div className="row-actions">
                  <span className={statusInfo.className} style={statusInfo.style}>{statusInfo.label}</span>
                  <button className="icon-btn danger" onClick={() => handleDelete(s.id)} aria-label="Delete record"><i className="ti ti-trash" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
