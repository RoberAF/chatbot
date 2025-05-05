'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'; // ej. http://localhost:3000/api

export function useAuth() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función de depuración para identificar problemas de autenticación
  const debugAuth = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      console.log('Access token existe:', !!token);
      console.log('Refresh token existe:', !!refreshToken);

      if (token) {
        try {
          // Intentar decodificar el JWT para ver cuándo expira
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          const expiry = new Date(decoded.exp * 1000);
          console.log('Token expira:', expiry);
          console.log('Token expirado:', expiry < new Date());
        } catch (e) {
          console.error('Error al decodificar token:', e);
        }
      }
    }
  };

  // Ejecutar debug al inicio para diagnosticar problemas
  useEffect(() => {
    debugAuth();
  }, []);

  // Cargar token desde localStorage al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      console.log('Token encontrado en localStorage:', !!storedToken);
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
    setLoading(false);
  }, []);

  // Guardar tokens en localStorage y estado
  const saveTokens = useCallback((at: string, rt: string) => {
    console.log('Guardando tokens en localStorage');
    localStorage.setItem(ACCESS_TOKEN_KEY, at);
    localStorage.setItem(REFRESH_TOKEN_KEY, rt);
    setAccessToken(at);
  }, []);

  // Función para intentar refrescar el token
  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      console.log('No hay refresh token disponible');
      return false;
    }

    console.log('Intentando refrescar token');
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.error('Error en respuesta de refresh:', await res.text());
        throw new Error('Falló el refresh del token');
      }

      const { accessToken: newAt, refreshToken: newRt } = await res.json();
      console.log('Token refrescado exitosamente');
      localStorage.setItem(ACCESS_TOKEN_KEY, newAt);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRt);
      setAccessToken(newAt);
      return true;
    } catch (e) {
      console.error('Error al refrescar token:', e);
      return false;
    }
  };

  // Login mejorado con logs para depuración
  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        console.log('Intentando login con:', email);
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        // Primero obtén el texto completo de la respuesta
        const responseText = await res.text();
        console.log('Respuesta del servidor (texto):', responseText);

        if (!res.ok) {
          let errorMessage = 'Login failed';
          try {
            // Intenta parsear el texto como JSON para obtener el mensaje de error
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('No se pudo parsear la respuesta de error:', e);
          }
          throw new Error(errorMessage);
        }

        // Ahora parsea la respuesta como JSON
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error('Error al parsear respuesta JSON:', e);
          throw new Error('Formato de respuesta inválido');
        }

        const { accessToken: at, refreshToken: rt } = responseData;

        // Verificar que los tokens existen
        console.log('Recibido access token:', at ? `Sí (longitud: ${at.length})` : 'No');
        console.log('Recibido refresh token:', rt ? `Sí (longitud: ${rt.length})` : 'No');

        if (!at || !rt) {
          console.error('Tokens no encontrados en la respuesta:', responseData);
          throw new Error('No se recibieron tokens válidos del servidor');
        }

        // Guardar explícitamente en localStorage
        localStorage.setItem(ACCESS_TOKEN_KEY, at);
        localStorage.setItem(REFRESH_TOKEN_KEY, rt);
        console.log('Tokens guardados en localStorage');

        // Actualizar el estado
        setAccessToken(at);
        console.log('Estado accessToken actualizado');

        // Navegar a la página de chat
        router.push('/chat');
      } catch (err: any) {
        console.error('Error en login:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Registro con validación mejorada
  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Intentando registro con:', email);
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al registrarse');
      }

      console.log('Registro exitoso');
      return true;
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout con manejo de errores mejorado
  const logout = useCallback(async () => {
    console.log('Iniciando logout');
    try {
      if (accessToken) {
        const res = await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('Respuesta de logout:', res.ok ? 'Exitosa' : 'Fallida');
      }
    } catch (e) {
      console.warn('Error en logout API:', e);
    } finally {
      console.log('Limpiando tokens locales');
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setAccessToken(null);
      router.push('/login');
    }
  }, [accessToken, router]);

  // authFetch mejorado con refresh automático
  // Reemplaza la función authFetch en useAuth.ts con esta versión mejorada
const authFetch = useCallback(
  async (input: RequestInfo, init: RequestInit = {}) => {
    console.log('Ejecutando authFetch:', typeof input === 'string' ? input : 'RequestInfo object');
    
    // Verificar si hay token en localStorage aunque no esté en estado
    let currentToken = accessToken;
    if (!currentToken) {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (storedToken) {
        console.log('Token encontrado en localStorage pero no en estado, usándolo directamente');
        currentToken = storedToken;
        // Actualizar el estado para futuras peticiones
        setAccessToken(storedToken);
      } else {
        console.log('No hay access token disponible, intentando refresh');
        const refreshed = await refreshTokenIfNeeded();
        if (!refreshed) {
          console.error('No se pudo refrescar el token, redireccionando a login');
          router.push('/login');
          throw new Error('No hay token de acceso válido');
        }
        // Usar el token recién refrescado
        currentToken = accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
      }
    }

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
      Authorization: `Bearer ${currentToken}`,
      ...(init.headers || {}),
    };

    console.log('Enviando petición a:', typeof url === 'string' ? url : 'URL object');
    console.log('Con token (primeros caracteres):', currentToken?.substring(0, 15) + '...');
    
    try {
      let res = await fetch(url, { ...init, headers });
      
      // Si hay error 401 (Unauthorized), intentar refresh
      if (res.status === 401) {
        console.log('Recibido 401, intentando refresh token');
        const refreshed = await refreshTokenIfNeeded();
        
        if (refreshed) {
          console.log('Token refrescado, reintentando petición original');
          // Actualizar el token en los headers con el nuevo token
          const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };
          // Reintentar la petición original
          res = await fetch(url, { ...init, headers: newHeaders });
        } else {
          console.log('No se pudo refrescar el token, redirigiendo a login');
          logout();
          throw new Error('Sesión expirada');
        }
      }
      
      // Verificar si la respuesta fue satisfactoria
      if (!res.ok) {
        console.error(`Error en respuesta HTTP: ${res.status}`);
        // Intentar obtener detalles del error
        let errorDetails = '';
        try {
          const errorText = await res.text();
          errorDetails = errorText;
          console.error('Detalles del error:', errorText);
        } catch (e) {
          console.error('No se pudieron obtener detalles del error');
        }
        throw new Error(`Error HTTP ${res.status}: ${errorDetails}`);
      }
      
      return res;
    } catch (err) {
      console.error('Error en authFetch:', err);
      // Si el error no es a causa de una respuesta HTTP, podría ser un error de red
      if (err instanceof Error && !(err instanceof Response)) {
        console.error('Tipo de error:', err.name, err.message);
      }
      throw err;
    }
  },
  [accessToken, logout, router, refreshTokenIfNeeded]
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