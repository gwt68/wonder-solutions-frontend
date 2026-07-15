import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const METHOD_LABELS = { sms: 'text', call: 'phone call', voice_note: 'voice note' };

export default function SendForm({ message, onSent }) {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'preview'
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [groupLoading, setGroupLoading] = useState(null);

  useEffect(() => {
    Promise.all([api.contacts.list(), api.groups.list()])
      .then(([c, g]) => { setContacts(c); setGroups(g); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleContact(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(contacts.map((c) => c.id)));
  }

  function unselectAll() {
    setSelected(new Set());
  }

  async function handleAddGroup(group) {
    setGroupLoading(group.id);
    setError('');
    try {
      const members = await api.groups.contacts(group.id);
      setSelected((prev) => {
        const next = new Set(prev);
        members.forEach((c) => next.add(c.id));
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGroupLoading(null);
    }
  }

  function goToPreview() {
    if (!selected.size) { setError('Select at least one contact'); return; }
    if (scheduleEnabled && !scheduledAt) { setError('Choose a date and time to schedule for'); return; }
    setError('');
    setStep('preview');
  }

  async function handleConfirmSend() {
    setSending(true);
    setError('');
    try {
      const res = await api.sends.create({
        message_id: message.id,
        contact_ids: [...selected],
        scheduled_at: scheduleEnabled ? new Date(scheduledAt).toISOString() : null,
      });
      setResult(res);
      if (onSent) onSent(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--ink-soft)' }}>Loading contacts...</p>;

  if (result) {
    return (
      <div className="banner ok">
        {result.scheduled
          ? `Scheduled for ${result.count} recipient${result.count !== 1 ? 's' : ''}.`
          : `Sent to ${result.count} recipient${result.count !== 1 ? 's' : ''}.`}
      </div>
    );
  }

  if (step === 'preview') {
    const selectedContacts = contacts.filter((c) => selected.has(c.id));
    const methodCounts = selectedContacts.reduce((acc, c) => {
      acc[c.preferred_method] = (acc[c.preferred_method] || 0) + 1;
      return acc;
    }, {});

    return (
      <div>
        {error && <div className="banner error">{error}</div>}
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--bg)' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>Sending</p>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>{message.title || 'Untitled message'}</p>

          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>To {selectedContacts.length} recipient{selectedContacts.length !== 1 ? 's' : ''}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(methodCounts).map(([method, count]) => (
              <span className="pill" key={method}>{count} by {METHOD_LABELS[method] || method}</span>
            ))}
          </div>

          <div style={{ maxHeight: 140, overflowY: 'auto', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
            {selectedContacts.map((c) => (
              <div key={c.id}>{c.name || c.phone_number} — {METHOD_LABELS[c.preferred_method]}</div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            {scheduleEnabled
              ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}`
              : 'Sending immediately'}
          </p>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn secondary" onClick={() => setStep('select')} disabled={sending}>Back</button>
          <button type="button" className="btn" onClick={handleConfirmSend} disabled={sending}>
            {sending ? 'Working...' : scheduleEnabled ? 'Confirm & schedule' : 'Confirm & send'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="banner error">{error}</div>}

      {groups.length > 0 && (
        <div className="field">
          <label>Add a whole group</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className="btn secondary"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => handleAddGroup(g)}
                disabled={groupLoading === g.id}
              >
                {groupLoading === g.id ? 'Adding...' : `+ ${g.name} (${g.member_count})`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ margin: 0 }}>Contacts ({selected.size} selected)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={selectAll} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer' }}>Select all</button>
            <button type="button" onClick={unselectAll} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer' }}>Unselect all</button>
          </div>
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 7 }}>
          {contacts.length === 0 ? (
            <p style={{ padding: 12, fontSize: 13, color: 'var(--ink-soft)' }}>No contacts yet.</p>
          ) : (
            contacts.map((c) => (
              <label
                key={c.id}
                className="checkbox-row"
                style={{ padding: '9px 12px', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}
              >
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleContact(c.id)} />
                <span style={{ flex: 1 }}>{c.name || c.phone_number}</span>
                <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{METHOD_LABELS[c.preferred_method]}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="checkbox-row" style={{ margin: '14px 0' }}>
        <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} />
        Schedule for later instead of sending now
      </div>

      {scheduleEnabled && (
        <div className="field">
          <label>Send at</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
      )}

      <button type="button" className="btn" onClick={goToPreview} style={{ width: '100%' }}>
        Review & continue
      </button>
    </div>
  );
}
