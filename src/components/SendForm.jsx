import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const METHOD_LABELS = { sms: 'text', call: 'phone call', voice_note: 'voice note' };

export default function SendForm({ messageId, onSent }) {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [targetType, setTargetType] = useState('contact');
  const [targetId, setTargetId] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([api.contacts.list(), api.groups.list()])
      .then(([c, g]) => { setContacts(c); setGroups(g); })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSend() {
    setError('');
    setResult(null);

    if (targetType !== 'all' && !targetId) {
      setError('Choose a recipient first');
      return;
    }
    if (scheduleEnabled && !scheduledAt) {
      setError('Choose a date and time to schedule for');
      return;
    }

    setSending(true);
    try {
      const target = targetType === 'all' ? { type: 'all' } : { type: targetType, id: parseInt(targetId, 10) };
      const res = await api.sends.create({
        message_id: messageId,
        target,
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

  return (
    <div>
      {error && <div className="banner error">{error}</div>}
      {result && (
        <div className="banner ok">
          {result.scheduled
            ? `Scheduled for ${result.count} recipient${result.count !== 1 ? 's' : ''}.`
            : `Sent to ${result.count} recipient${result.count !== 1 ? 's' : ''}.`}
        </div>
      )}

      <div className="field">
        <label>Send to</label>
        <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }}>
          <option value="contact">One contact</option>
          <option value="group">A group</option>
          <option value="all">Everyone</option>
        </select>
      </div>

      {targetType === 'contact' && (
        <div className="field">
          <label>Contact</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Choose a contact...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.phone_number} — sent as {METHOD_LABELS[c.preferred_method]}
              </option>
            ))}
          </select>
        </div>
      )}

      {targetType === 'group' && (
        <div className="field">
          <label>Group</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Choose a group...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.member_count} member{g.member_count !== 1 ? 's' : ''})</option>
            ))}
          </select>
        </div>
      )}

      {targetType === 'all' && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
          This will send to all {contacts.length} contact{contacts.length !== 1 ? 's' : ''}, each via their own preferred method.
        </p>
      )}

      <div className="checkbox-row" style={{ margin: '14px 0' }}>
        <input
          type="checkbox"
          checked={scheduleEnabled}
          onChange={(e) => setScheduleEnabled(e.target.checked)}
        />
        Schedule for later instead of sending now
      </div>

      {scheduleEnabled && (
        <div className="field">
          <label>Send at</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
      )}

      <button type="button" className="btn" onClick={handleSend} disabled={sending} style={{ width: '100%' }}>
        {sending ? 'Working...' : scheduleEnabled ? 'Schedule send' : 'Send now'}
      </button>
    </div>
  );
}
