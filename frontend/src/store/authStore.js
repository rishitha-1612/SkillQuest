import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const AUTH_TOKEN_KEY = 'skillquest-auth-token';

function writeToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

const initialToken = getStoredAuthToken();

export const useAuthStore = create(
  persist(
    (set) => ({
      token: initialToken,
      user: null,
      status: initialToken ? 'authenticating' : 'guest',
      initialized: false,
      setSession: ({ token, user }) => {
        writeToken(token);
        set({
          token,
          user,
          status: 'authenticated',
          initialized: true,
        });
      },
      clearSession: () => {
        writeToken('');
        set({
          token: '',
          user: null,
          status: 'guest',
          initialized: true,
        });
      },
      markInitialized: () =>
        set((state) => ({
          initialized: true,
          status: state.token ? (state.user ? 'authenticated' : 'authenticating') : 'guest',
        })),
    }),
    {
      name: 'skillquest-auth-store',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        status: state.status,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        writeToken(state.token || '');
        state.initialized = true;
        state.status = state.token ? (state.user ? 'authenticated' : 'authenticating') : 'guest';
      },
    }
  )
);
