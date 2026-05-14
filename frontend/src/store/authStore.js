import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'skillquest-auth-token';

function clearLegacyToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

clearLegacyToken();

export const useAuthStore = create((set) => ({
  user: null,
  status: 'guest',
  initialized: false,
  setSession: ({ user }) => {
    clearLegacyToken();
    set({
      user,
      status: 'authenticated',
      initialized: true,
    });
  },
  clearSession: () => {
    clearLegacyToken();
    set({
      user: null,
      status: 'guest',
      initialized: true,
    });
  },
  markInitialized: () =>
    set((state) => ({
      initialized: true,
      status: state.user ? 'authenticated' : 'guest',
    })),
}));
