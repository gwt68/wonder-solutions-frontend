import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api.js';

const METHOD_LABELS = { sms: 'Text', call: 'Phone call', voice_note: 'Voice note' };

function emptyForm() {
  return { name: '', phone_number: '', email: '', address: '', preferred_method: 'sms', notes: '', group_ids: [] };
}

// Maps common header variants in an uploaded spreadsheet to our field names
function normalizeRow(row) {
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k);
      if (found && row[found] !== undefined && row[found] !== '') return row[found];
    }
    return '';
  };
  return {
    name: get('name', 'full name', 'contact name'),
    phone_number: get('phone', 'phone number', 'phone_number', 'mobile', 'cell').toString(),
    email: get('email', 'email address'),
    address: get('address', 'street address'),
    notes: get('notes', 'note'),
    preferred_method: (get('preferred_method', 'method', 'contact method') || 'sms')
      .toString().toLowerCase().replace(/\s+/g, '_'),
  };
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const [c, g] = await Promise.all([api.contacts.list(), api.groups.list()]);
      setContacts(c);
      setGroups(g);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(contact) {
    setEditing(contact);
    setForm({
      name: contact.name || '',
      phone_number: contact.phone_number,
      email: contact.email || '',
      address: contact.address || '',
      preferred_method: contact.preferred_method,
      notes: contact.notes || '',
      group_ids: contact.groups.map((g) => g.id),
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.contacts.update(editing.id, form);
      } else {
        await api.contacts.create(form);
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
    if (!confirm('Remove this contact?')) return;
    try {
      await api.contacts.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleGroup(id) {
    setForm((f) => ({
      ...f,
      group_ids: f.group_ids.includes(id)
        ? f.group_ids.filter((g) => g !== id)
        : [...f.group_ids, id],
    }));
  }

  function handleImportClick() {
    setImportResult(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const normalized = rows.map(normalizeRow).filter((r) => r.phone_number);

      if (!normalized.length) {
        setError('No rows with a phone number were found in that file.');
        return;
      }

      const result = await api.contacts.bulkImport(normalized);
      setImportResult(result);
      await load();
    } catch (err) {
      setError('Could not read that file. Make sure it\'s a .xlsx or .csv file with a phone number column.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Contacts</h1>
          <p>{contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your list</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
          <button className="btn secondary" onClick={handleImportClick} disabled={importing}>
            <i className="ti ti-upload" /> {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <button className="btn" onClick={openAdd}><i className="ti ti-plus" /> Add contact</button>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}
      {importResult && (
        <div className="banner ok">
          Imported {importResult.created} contact{importResult.created !== 1 ? 's' : ''}.
          {importResult.skipped > 0 && ` ${importResult.skipped} row${importResult.skipped !== 1 ? 's' : ''} skipped (missing or invalid phone number).`}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : contacts.length === 0 ? (
        <div className="card empty-state">
          <h3>No contacts yet</h3>
          <p>Add your first contact, import a spreadsheet, or call your Wonder Solutions line and press 3.</p>
        </div>
      ) : (
        <div className="list">
          {contacts.map((c) => (
            <div className="row" key={c.id}>
              <div className="row-main">
                <span className="row-title">{c.name || 'Unnamed contact'}</span>
                <span className="row-sub">
                  {c.phone_number}
                  {c.email ? ` · ${c.email}` : ''}
                </span>
                {c.address && <span className="row-sub" style={{ color: 'var(--ink-faint)' }}>{c.address}</span>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span className="pill">{METHOD_LABELS[c.preferred_method]}</span>
                  {c.groups.map((g) => (
                    <span className="pill signal" key={g.id}>{g.name}</span>
                  ))}
                </div>
              </div>
              <div className="row-actions">
                <button className="icon-btn" onClick={() => openEdit(c)} aria-label="Edit contact"><i className="ti ti-edit" /></button>
                <button className="icon-btn danger" onClick={() => handleDelete(c.id)} aria-label="Delete contact"><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit contact' : 'Add contact'}</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional" />
              </div>
              <div className="field">
                <label>Phone number</label>
                <input
                  required
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="+19145551234"
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="field">
                <label>Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="field">
                <label>How should they receive messages?</label>
                <select
                  value={form.preferred_method}
                  onChange={(e) => setForm({ ...form, preferred_method: e.target.value })}
                >
                  <option value="sms">Text message</option>
                  <option value="call">Phone call</option>
                  <option value="voice_note">Voice note (MMS)</option>
                </select>
              </div>
              {groups.length > 0 && (
                <div className="field">
                  <label>Groups</label>
                  <div className="checkbox-group">
                    {groups.map((g) => (
                      <label className="checkbox-row" key={g.id}>
                        <input
                          type="checkbox"
                          checked={form.group_ids.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="field">
                <label>Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
