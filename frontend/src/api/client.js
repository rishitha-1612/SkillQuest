const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'http://127.0.0.1:8010/career-globe';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function requestJson(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),
  worldMap: () => request('/world-map'),
  states: () => request('/states'),
  roleDetails: (roleId) => request(`/roles/${encodeURIComponent(roleId)}`),
  stateDetails: (stateId) => request(`/states/${encodeURIComponent(stateId)}`),
  tutorChat: (payload) =>
    requestJson('/tutor/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
