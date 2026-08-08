// lib/auth.tsx
// Session state for the SPA. Mirrors the backend JWT flow: on login the
// token + user object are stored in localStorage and kept in state; the
// route guard (see App.tsx) reads isAuthenticated to protect pages.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getToken, setToken, clearToken } from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: 'farmer' | 'admin';
  // Optional profile fields populated by the Figma-style multi-step signup.
  region?: string | null;
  land_size?: number | null;
  farm_type?: 'Subsistence' | 'Commercial' | 'Mixed' | 'Organic' | null;
  language?: 'en' | 'so' | 'ar' | null;
}

const USER_KEY = 'farmerai.user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(() => readUser());

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    window.localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  // On first mount: if a token exists but the cached user object is missing
  // (e.g. localStorage was cleared in another tab, or the user was restored
  // from a deep-link), hydrate the user profile by calling /api/me. If the
  // token is invalid the server responds 401 and api.ts triggers
  // farmerai:logout which clears the session.
  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { user: AuthUser }) => {
        if (cancelled) return;
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        logout();
      });
    return () => { cancelled = true; };
  }, [token, user, logout]);

  // api.ts dispatches this event when any authed request returns 401, so
  // a mid-session expiry clears the UI without waiting for a page reload.
  useEffect(() => {
    window.addEventListener('farmerai:logout', logout);
    return () => window.removeEventListener('farmerai:logout', logout);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
