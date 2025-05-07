'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Enhanced authentication hook that integrates with Firebase auth
 * Handles JWT tokens for backend API calls
 */
export function useAuth() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging function
  const logDebug = useCallback((message: string, ...args: any[]) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    console.log(`[${timestamp}] 🔑 AUTH: ${message}`, ...args);
  }, []);

  // Function to debug token state - useful for troubleshooting
  const debugAuth = useCallback(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      logDebug('Access token exists:', !!token);
      logDebug('Refresh token exists:', !!refreshToken);

      if (token) {
        try {
          // Try to decode the JWT to see when it expires
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          const expiry = new Date(decoded.exp * 1000);
          logDebug('Token expires:', expiry);
          logDebug('Token expired:', expiry < new Date());
        } catch (e) {
          logDebug('Error decoding token:', e);
        }
      }
    }
  }, [logDebug]);

  // Load token from localStorage on initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      logDebug(`Initial token check: ${storedToken ? 'Present' : 'Not found'}`);
      
      if (storedToken) {
        setAccessToken(storedToken);
      }
      
      // Check for firebase token that might need to be exchanged
      const firebaseToken = localStorage.getItem('firebaseToken');
      if (firebaseToken && !storedToken) {
        logDebug('Firebase token found without JWT, attempting exchange');
        exchangeFirebaseToken(firebaseToken).catch(err => {
          logDebug('Firebase token exchange failed', err);
        });
      }
      
      // Run debug once to help troubleshoot issues
      const hasDebugged = localStorage.getItem('auth_debugged');
      if (!hasDebugged) {
        logDebug('---------- AUTH DEBUG INFO ----------');
        debugAuth();
        logDebug('-------------------------------------');
        localStorage.setItem('auth_debugged', 'true');
      }
      
      setLoading(false);
    }
  }, [logDebug, debugAuth]);

  // Function to exchange Firebase token for JWT
  const exchangeFirebaseToken = useCallback(async (firebaseToken: string) => {
    logDebug('Exchanging Firebase token for JWT');
    try {
      // This endpoint should be implemented on your backend
      // It would verify the Firebase token and issue your JWT tokens
      const res = await fetch(`${API}/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseToken }),
      });
      
      if (!res.ok) {
        throw new Error(`Exchange failed: ${res.status}`);
      }
      
      const { accessToken: newAt, refreshToken: newRt } = await res.json();
      logDebug('Token exchange successful');
      
      localStorage.setItem(ACCESS_TOKEN_KEY, newAt);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRt);
      localStorage.removeItem('firebaseToken'); // Clean up
      
      setAccessToken(newAt);
      return true;
    } catch (err) {
      logDebug('Token exchange error', err);
      setError('Error al intercambiar token de Firebase');
      return false;
    }
  }, [logDebug, API]);

  // Save tokens to localStorage and state
  const saveTokens = useCallback((at: string, rt: string) => {
    logDebug('Saving new tokens to localStorage');
    localStorage.setItem(ACCESS_TOKEN_KEY, at);
    localStorage.setItem(REFRESH_TOKEN_KEY, rt);
    setAccessToken(at);
  }, [logDebug]);

  // Refresh token function - returns boolean success indicator
  const refreshTokenIfNeeded = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      logDebug('No refresh token available');
      return false;
    }

    logDebug('Attempting to refresh token');
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        logDebug('Refresh token response error:', await res.text());
        throw new Error('Failed to refresh token');
      }

      const { accessToken: newAt, refreshToken: newRt } = await res.json();
      logDebug('Token refresh successful');
      
      localStorage.setItem(ACCESS_TOKEN_KEY, newAt);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRt);
      setAccessToken(newAt);
      return true;
    } catch (err) {
      logDebug('Token refresh error:', err);
      return false;
    }
  }, [logDebug, API]);

  // Enhanced login function with proper error handling
  const login = useCallback(async (email: string, password: string) => {
    logDebug(`Logging in user: ${email}`);
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Get full response text for better debugging
      const responseText = await res.text();
      logDebug('Login response:', responseText);

      if (!res.ok) {
        let errorMessage = 'Login failed';
        try {
          // Try to parse the error message
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          logDebug('Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      // Parse the response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        logDebug('Error parsing JSON response:', e);
        throw new Error('Invalid response format');
      }

      const { accessToken: at, refreshToken: rt } = responseData;

      // Verify tokens exist
      if (!at || !rt) {
        logDebug('Tokens missing in response:', responseData);
        throw new Error('Invalid tokens received');
      }

      // Save tokens and update state
      saveTokens(at, rt);
      logDebug('Login successful, tokens saved');

      // Clear any redirects from localStorage to prevent loops
      localStorage.removeItem('auth_redirect_to');
      
      return true;
    } catch (err: any) {
      logDebug('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API, logDebug, saveTokens]);

  // Register function with enhanced error handling
  const register = useCallback(async (email: string, password: string, name?: string, age?: number) => {
    logDebug(`Registering new user: ${email}`);
    setLoading(true);
    setError(null);
    
    try {
      // Prepare registration data
      const userData = {
        email,
        password,
        ...(name && { name }),
        ...(age && { age }),
      };
      
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrar usuario');
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

  // Enhanced logout function
  const logout = useCallback(async () => {
    logDebug('Starting logout process');
    try {
      if (accessToken) {
        // Notificar al servidor sobre el logout
        try {
          const res = await fetch(`${API}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });
          logDebug('Server logout response:', res.ok ? 'Success' : 'Failed');
        } catch (e) {
          logDebug('Server logout request failed:', e);
        }
      }
      
      // Limpiar tokens locales
      logDebug('Clearing local tokens');
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('firebaseToken');
      localStorage.setItem('intentional_logout', 'true');
      setAccessToken(null);
      
      return true;
    } catch (err) {
      logDebug('Error during logout:', err);
      return false;
    }
  }, [accessToken, API, logDebug]);

  // Enhanced authFetch with automatic token refresh and better error handling
  const authFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      const requestId = Math.random().toString(36).substring(2, 8);
      logDebug(`[${requestId}] Starting authenticated request to: ${typeof input === 'string' ? input : 'RequestInfo object'}`);
      
      // Get the current token, either from state or localStorage
      let currentToken = accessToken;
      if (!currentToken) {
        const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (storedToken) {
          logDebug(`[${requestId}] Token found in localStorage but not in state`);
          currentToken = storedToken;
          setAccessToken(storedToken);
        } else {
          logDebug(`[${requestId}] No access token available, attempting refresh`);
          const refreshed = await refreshTokenIfNeeded();
          if (!refreshed) {
            logDebug(`[${requestId}] Token refresh failed, redirecting to login`);
            
            // Save the current path for redirect after login
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_redirect_to', window.location.pathname + window.location.search);
            }
            
            router.push('/login');
            throw new Error('Authentication required');
          }
          currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        }
      }

      // Build absolute URL if needed
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

      // Add authorization header to request
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
        ...(init.headers || {}),
      };

      logDebug(`[${requestId}] Sending request with auth header`);
      
      try {
        let res = await fetch(url, { ...init, headers });
        
        // Handle 401 Unauthorized by attempting token refresh
        if (res.status === 401) {
          logDebug(`[${requestId}] Received 401, attempting token refresh`);
          const refreshed = await refreshTokenIfNeeded();
          
          if (refreshed) {
            logDebug(`[${requestId}] Token refreshed, retrying original request`);
            // Update token in headers
            const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            // Retry the original request
            res = await fetch(url, { ...init, headers: newHeaders });
          } else {
            logDebug(`[${requestId}] Token refresh failed, logging out`);
            logout();
            throw new Error('Your session has expired. Please log in again.');
          }
        }
        
        logDebug(`[${requestId}] Request completed with status ${res.status}`);
        return res;
      } catch (err) {
        logDebug(`[${requestId}] Request error:`, err);
        throw err;
      }
    },
    [accessToken, API, logout, router, refreshTokenIfNeeded, logDebug]
  );

  // Return the hook interface
  return {
    accessToken,
    loading,
    error,
    login,
    register,
    logout,
    authFetch,
    refreshTokenIfNeeded,
  };
}