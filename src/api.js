const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  contacts: {
    list: () => request('/contacts'),
    create: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
  },
  groups: {
    list: () => request('/groups'),
    create: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  },
  messages: {
    list: () => request('/messages'),
    remove: (id) => request(`/messages/${id}`, { method: 'DELETE' }),
  },
  settings: {
    getPin: () => request('/settings/pin'),
    setPin: (pin) => request('/settings/pin', { method: 'PUT', body: JSON.stringify({ pin }) }),
  },
};
