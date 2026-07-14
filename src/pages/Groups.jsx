import React, { useEffect, useState } from 'react';
import { api, groupAudioLabelUrl } from '../api.js';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setGroups(await api.groups.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setName('');
    setModalOpen(true);
  }

  function openEdit(group) {
    setEditing(group);
    setName(group.name);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.groups.update(editing.id, { name });
      } else {
        await api.groups.create({ name });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this group? Contacts will not be deleted, just removed from the group.')) return;
    try {
      await api.groups.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Groups</h1>
          <p>Organize contacts to send to a whole set at once</p>
        </div>
        <button className="btn" onClick={openAdd}><i className="ti ti-plus" /> New group</button>
      </div>

      {error && <div className="banner error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : groups.length === 0 ? (
        <div className="card empty-state">
          <h3>No groups yet</h3>
          <p>Create a group here, or create one by phone during the contact-adding flow.</p>
        </div>
      ) : (
        <div className="list">
          {groups.map((g) => (
            <div className="row" key={g.id}>
              <div className="row-main">
                <span className="row-title">
                  {g.name}
                  {g.source === 'phone_placeholder' && (
                    <span className="pill signal" style={{ marginLeft: 8 }}>Needs a name</span>
                  )}
                </span>
                <span className="row-sub">{g.member_count} member{g.member_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="row-actions">
                {g.source === 'phone_placeholder' && g.audio_label_url && (
                  <audio controls src={groupAudioLabelUrl(g.id)} />
                )}
                <button className="icon-btn" onClick={() => openEdit(g)} aria-label="Rename group"><i className="ti ti-edit" /></button>
                <button className="icon-btn danger" onClick={() => handleDelete(g.id)} aria-label="Delete group"><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Rename group' : 'New group'}</h2>
            {editing && editing.source === 'phone_placeholder' && editing.audio_label_url && (
              <div className="field">
                <label>Recorded name (from phone)</label>
                <audio controls src={groupAudioLabelUrl(editing.id)} style={{ width: '100%' }} />
              </div>
            )}
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Group name</label>
                <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drivers" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save group'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
