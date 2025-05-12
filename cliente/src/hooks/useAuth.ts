'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function useAuth() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logDebug = useCallback((msg: string, ...args: any[]) => {
    const now = new Date();
    const ts = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    console.log(`[${ts}] 🔑 AUTH: ${msg}`, ...args);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    logDebug('Initial token check – JWT:', !!storedToken);

    if (storedToken) {
      setAccessToken(storedToken);
    }

    setLoading(false);
  }, [logDebug]);

  const saveTokens = useCallback((at: string, rt: string) => {
    logDebug('Saving tokens to localStorage');
    localStorage.setItem(ACCESS_TOKEN_KEY, at);
    localStorage.setItem(REFRESH_TOKEN_KEY, rt);
    setAccessToken(at);
  }, [logDebug]);

  const refreshTokenIfNeeded = useCallback(async (): Promise<boolean> => {
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!rt) {
      logDebug('No refresh token available');
      return false;
    }
    logDebug('Attempting token refresh…');
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) {
        logDebug('Refresh failed:', await res.text());
        throw new Error('Refresh failed');
      }
      const { accessToken: newAt, refreshToken: newRt } = await res.json();
      logDebug('Refresh successful');
      localStorage.setItem(ACCESS_TOKEN_KEY, newAt);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRt);
      setAccessToken(newAt);
      return true;
    } catch (err) {
      logDebug('Refresh error:', err);
      return false;
    }
  }, [API, logDebug]);

  const login = useCallback(async (email: string, password: string) => {
    logDebug(`Logging in ${email}`);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      logDebug('Login response:', text);
      if (!res.ok) {
        let msg = 'Login failed';
        try { msg = JSON.parse(text).message || msg; } catch {}
        throw new Error(msg);
      }
      const { accessToken: at, refreshToken: rt } = JSON.parse(text);
      if (!at || !rt) throw new Error('Invalid tokens');
      saveTokens(at, rt);
      logDebug('Login successful');
      return true;
    } catch (err: any) {
      logDebug('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API, saveTokens, logDebug]);

  const register = useCallback(async (email: string, password: string, name?: string, age?: number) => {
    logDebug(`Registering ${email}`);
    setLoading(true);
    setError(null);
    try {
      const body: any = { email, password };
      if (name) body.name = name;
      if (age) body.age = age;
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }
      logDebug('Registration successful');
      return true;
    } catch (err: any) {
      logDebug('Registration error:', err);
      setError(err.message || 'Error al registrar usuario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API, logDebug]);

  const logout = useCallback(async () => {
    logDebug('Logging out…');
    try {
      if (accessToken) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        logDebug('Backend logout OK');
      }
    } catch (e) {
      console.warn('Error logout API:', e);
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    router.push('/login');
  }, [accessToken, router, API, logDebug]);

  const authFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      const id = Math.random().toString(36).substring(2,8);
      logDebug(`[${id}] authFetch ->`, input);
      let token = accessToken;
      if (!token) {
        const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (stored) { token = stored; setAccessToken(stored); }
        else {
          logDebug(`[${id}] no token, intentando refresh`);
          if (!(await refreshTokenIfNeeded())) {
            logDebug(`[${id}] refresh falló, logout`);
            logout();
            throw new Error('Session expired');
          }
          token = localStorage.getItem(ACCESS_TOKEN_KEY)!;
        }
      }
      let url: string = typeof input === 'string'
        ? (input.startsWith('http') ? input : `${API}${input.startsWith('/')? input : '/'+input}`)
        : (input as any).url;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers||{}),
      };
      let res = await fetch(url, { ...init, headers });
      if (res.status === 401) {
        logDebug(`[${id}] 401 recibido, refresh y retry`);
        if (await refreshTokenIfNeeded()) {
          const newT = localStorage.getItem(ACCESS_TOKEN_KEY)!;
          res = await fetch(url, { ...init, headers: {...headers, Authorization:`Bearer ${newT}`} });
        } else {
          logout();
          throw new Error('Session expired');
        }
      }
      logDebug(`[${id}] authFetch result:`, res.status);
      return res;
    },
    [accessToken, API, refreshTokenIfNeeded, logout, logDebug]
  );

  return {
    accessToken,
    loading,
    error,
    login,
    register,
    logout,
    authFetch,
  };
}