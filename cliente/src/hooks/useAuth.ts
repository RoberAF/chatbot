'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const API = process.env.NEXT_PUBLIC_API_URL!; // ej. http://localhost:3000/api

export function useAuth() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Añadido el estado de error

  // 1) Cargo token de localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAccessToken(localStorage.getItem(ACCESS_TOKEN_KEY));
    }
    setLoading(false);
  }, []);

  // 2) Guarda tokens
  const saveTokens = useCallback((at: string, rt: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, at);
    localStorage.setItem(REFRESH_TOKEN_KEY, rt);
    setAccessToken(at);
  }, []);

  // 3) Login → siempre al chat
  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Login failed');
        }
        const { accessToken: at, refreshToken: rt } = await res.json();
        saveTokens(at, rt);
        router.push('/chat');
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [saveTokens, router]
  );

  // 4) Registro -> sin auto-login (modificado)
  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al registrarse');
      }
      
      // Solo terminamos la carga sin hacer login ni redirecciones
      return true; // Indicamos éxito
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-lanzamos el error para manejarlo en el componente
    } finally {
      setLoading(false);
    }
  };

  // 5) Logout -> limpia y al login
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (e) {
      console.warn('Error en logout API:', e);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setAccessToken(null);
      router.push('/login');
    }
  }, [accessToken, router]);

  // 6) authFetch: añade API, header auth, refresh automático
  const authFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      if (!accessToken) throw new Error('No access token');

      // construyo URL absoluta
      let url: RequestInfo;
      if (typeof input === 'string') {
        if (input.startsWith('http')) {
          url = input;
        } else {
          const path = input.startsWith('/') ? input : `/${input}`;
          url = `${API}${path}`;
        }
      } else {
        url = input;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers || {}),
      };

      let res = await fetch(url, { ...init, headers });
      if (res.status === 401) {
        // intento refresh
        const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (rt) {
          const r2 = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (r2.ok) {
            const { accessToken: newAt, refreshToken: newRt } = await r2.json();
            saveTokens(newAt, newRt);
            const retryHeaders = { ...headers, Authorization: `Bearer ${newAt}` };
            res = await fetch(url, { ...init, headers: retryHeaders });
          } else {
            logout();
            throw new Error('Session expired');
          }
        } else {
          logout();
          throw new Error('Session expired');
        }
      }
      return res;
    },
    [accessToken, logout, saveTokens]
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