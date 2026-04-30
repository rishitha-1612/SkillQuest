import { getStoredAuthToken, useAuthStore } from '../store/authStore';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  '/career-globe';

function getAuthToken() {
  return useAuthStore.getState().token || getStoredAuthToken();
}

function buildHeaders(options = {}) {
  const headers = {
    ...(options.includeJsonHeader === false ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options) {
  const { includeJsonHeader, headers, ...fetchOptions } = options || {};
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: buildHeaders({ headers, includeJsonHeader: false }),
      ...fetchOptions,
    });
  } catch (error) {
    throw new Error('Could not reach the SkillQuest backend. Please make sure the backend is running.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function requestJson(path, options) {
  const { includeJsonHeader, headers, ...fetchOptions } = options || {};
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: buildHeaders({ headers, includeJsonHeader }),
      ...fetchOptions,
    });
  } catch (error) {
    throw new Error('Could not reach the SkillQuest backend. Please make sure the backend is running.');
  }
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
  signup: (payload) =>
    requestJson('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () =>
    requestJson('/auth/me', {
      method: 'GET',
      includeJsonHeader: false,
    }),
  logout: () =>
    requestJson('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  roleDetails: (roleId) => request(`/roles/${encodeURIComponent(roleId)}`),
  stateDetails: (stateId) => request(`/states/${encodeURIComponent(stateId)}`),
  progression: (stateId, payload) =>
    requestJson(`/states/${encodeURIComponent(stateId)}/progression`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  tutorChat: (payload) =>
    requestJson('/tutor/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
