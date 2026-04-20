const API_BASE = 'http://127.0.0.1:8000/career-globe';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
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
};