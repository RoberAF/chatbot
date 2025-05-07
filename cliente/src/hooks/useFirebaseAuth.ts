'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

/**
 * Enhanced Firebase authentication hook
 * Handles synchronization with custom JWT backend
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Track the last navigation attempt to prevent navigation loops
  const [lastNavigationAttempt, setLastNavigationAttempt] = useState<string | null>(null);

  // Enhanced logging for better debugging
  const logWithTimestamp = useCallback((message: string, ...args: any[]) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    console.log(`[${timestamp}] ${message}`, ...args);
  }, []);

  // Function to exchange Firebase token for custom JWT
  // IMPORTANTE: Esta función DEBE estar definida ANTES del useEffect que la usa
  const exchangeFirebaseTokenForJWT = useCallback(async (currentUser: User) => {
    try {
      logWithTimestamp('Getting Firebase ID token');
      const firebaseToken = await currentUser.getIdToken();

      logWithTimestamp('Firebase token obtained, saving to localStorage for now');
      localStorage.setItem('firebaseToken', firebaseToken);

      // Here you would normally exchange the Firebase token for your custom JWT
      // For now, we'll simulate this by simply storing the Firebase token
      // You would implement your actual token exchange endpoint here

      logWithTimestamp('Token exchange process completed');

      // Check if we need to redirect after authentication
      const redirectTo = localStorage.getItem('auth_redirect_to');
      if (redirectTo && redirectTo !== lastNavigationAttempt) {
        logWithTimestamp(`Redirecting to saved path: ${redirectTo}`);
        setLastNavigationAttempt(redirectTo);
        localStorage.removeItem('auth_redirect_to');
        router.push(redirectTo);
      }
    } catch (err: any) {
      logWithTimestamp('Error exchanging Firebase token:', err);
      setError(`Error exchanging token: ${err.message}`);
    }
  }, [logWithTimestamp, router, lastNavigationAttempt]);

  // Listen for Firebase authentication state changes
  useEffect(() => {
    logWithTimestamp('Setting up Firebase auth listener');

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      logWithTimestamp('Firebase auth state changed:', currentUser ? `authenticated as ${currentUser.email}` : 'not authenticated');

      // Verificar si hay un cierre de sesión intencional en progreso
      const intentionalLogout = localStorage.getItem('intentional_logout') === 'true';

      if (!currentUser && intentionalLogout) {
        // Si no hay usuario y estamos en proceso de logout, mantener el estado logout
        setUser(null);
        localStorage.removeItem('intentional_logout'); // Limpiar el flag
        logWithTimestamp('Intentional logout detected, keeping logged out state');
      } else {
        // Actualizar el estado del usuario
        setUser(currentUser);

        // Generar tokens solo si hay un usuario y NO estamos en proceso de logout
        if (currentUser && !intentionalLogout) {
          exchangeFirebaseTokenForJWT(currentUser);
        }
      }

      setLoading(false);
    });

    return () => {
      logWithTimestamp('Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, [logWithTimestamp, exchangeFirebaseTokenForJWT]);

  // Google authentication
  const loginWithGoogle = useCallback(async () => {
    logWithTimestamp('Starting Google login flow');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

      logWithTimestamp('Opening Google auth popup');
      const result = await signInWithPopup(auth, provider);

      logWithTimestamp('Google auth successful, user:', result.user.email);

      // The Firebase auth state listener will handle token exchange
      return result;
    } catch (err: any) {
      logWithTimestamp('Google login error:', err);

      // Handle specific Google auth errors
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado. Por favor, intente de nuevo.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes e intente de nuevo.');
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logWithTimestamp]);

  // Email/password login
  const login = useCallback(async (email: string, password: string) => {
    logWithTimestamp(`Starting email login for: ${email}`);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      logWithTimestamp('Email login successful');
      return result;
    } catch (err: any) {
      logWithTimestamp('Email login error:', err);

      // Translate Firebase error codes to user-friendly messages
      if (err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Esta cuenta ha sido deshabilitada.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logWithTimestamp]);

  // Registration with email and password
  const register = useCallback(async (email: string, password: string) => {
    logWithTimestamp(`Starting registration for: ${email}`);
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      logWithTimestamp('Registration successful');
      return result;
    } catch (err: any) {
      logWithTimestamp('Registration error:', err);

      // Translate Firebase error codes to user-friendly messages
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil. Use al menos 6 caracteres.');
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logWithTimestamp]);

  // Logout from both Firebase and custom JWT
  const logout = useCallback(async () => {
    logWithTimestamp('Starting logout process');
    try {
      // 1. Desactivar temporalmente el listener de autenticación
      //    (Esto evita que se detecten cambios de estado durante el proceso)
      const currentUnsubscribe = onAuthStateChanged(auth, () => { });
      currentUnsubscribe(); // Detener el listener actual

      // 2. Limpiar localStorage ANTES de cerrar sesión en Firebase
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('auth_redirect_to');
      localStorage.removeItem('auth_debugged');

      // 3. Flag para indicar cierre de sesión intencional
      localStorage.setItem('intentional_logout', 'true');

      // 4. Cerrar sesión en Firebase y esperar a que termine
      await signOut(auth);

      // 5. Actualizar estado local
      setUser(null);

      logWithTimestamp('Logout completed successfully');
      return true;
    } catch (err: any) {
      logWithTimestamp('Logout error:', err);
      setError(err.message);
      return false;
    }
  }, [logWithTimestamp]);

  // Get the current Firebase ID token (for API calls)
  const getIdToken = useCallback(async () => {
    if (!user) return null;
    try {
      logWithTimestamp('Getting fresh Firebase ID token');
      return await user.getIdToken(true); // forceRefresh = true to always get a fresh token
    } catch (err: any) {
      logWithTimestamp('Error getting ID token:', err);
      setError(err.message);
      return null;
    }
  }, [user, logWithTimestamp]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    getIdToken,
    // Add additional methods as needed
  };
}