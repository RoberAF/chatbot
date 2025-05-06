'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  
  // Firebase auth for Google login
  const { 
    login: firebaseLogin, 
    loginWithGoogle, 
    user, 
    loading: firebaseLoading, 
    error: firebaseError,
    getIdToken
  } = useFirebaseAuth();
  
  // Custom JWT auth
  const { 
    login: jwtLogin, 
    loading: jwtLoading, 
    error: jwtError 
  } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  
  // UI state
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [processingGoogleAuth, setProcessingGoogleAuth] = useState(false);

  // Effect for redirection after successful Firebase auth
  useEffect(() => {
    // Check if we already have a user and are not in the middle of redirecting
    if (user && !isRedirecting && !processingGoogleAuth) {
      console.log('Firebase user detected:', user.email);
      
      // Prevent multiple redirections
      setIsRedirecting(true);
      
      // After firebase auth, we need to sync with our backend
      // Get the Firebase ID token
      getIdToken().then(firebaseToken => {
        if (firebaseToken) {
          console.log('Firebase token obtained, syncing with backend...');
          
          // You would replace this with your actual endpoint
          // This endpoint should validate the Firebase token and issue your JWT tokens
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.email,
              // Use a placeholder password or consider implementing a different
              // endpoint for Firebase auth in your backend
              password: 'firebase-auth-user' 
            })
          })
          .then(res => {
            if (!res.ok) {
              throw new Error('Backend sync failed');
            }
            return res.json();
          })
          .then(data => {
            // Store tokens in localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            console.log('Backend sync successful, redirecting to chat...');
            
            // Use window.location for a hard redirect to avoid Next.js router issues
            window.location.href = '/chat';
          })
          .catch(err => {
            console.error('Error syncing with backend:', err);
            setLocalError('Error al sincronizar con el backend. Intente de nuevo.');
            setIsRedirecting(false);
          });
        } else {
          console.error('No Firebase token available');
          setLocalError('Error al obtener token de autenticación');
          setIsRedirecting(false);
        }
      })
      .catch(err => {
        console.error('Error getting Firebase token:', err);
        setLocalError('Error al obtener token de Firebase');
        setIsRedirecting(false);
      });
    }
  }, [user, isRedirecting, getIdToken, processingGoogleAuth]);

  // Handle form submission (email/password login)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      // Try Firebase auth first
      await firebaseLogin(email, password);
      
      // The useEffect above will handle the redirection after successful login
    } catch (err: any) {
      console.error('Firebase login error:', err);
      
      // Fall back to JWT auth if Firebase fails
      try {
        await jwtLogin(email, password);
        console.log('JWT login successful, redirecting...');
        
        // Direct navigation for JWT auth success
        router.push('/chat');
      } catch (jwtErr: any) {
        console.error('JWT login error:', jwtErr);
        setLocalError('Credenciales incorrectas. Intenta de nuevo.');
      }
    }
  };

  // Enhanced Google login handler
  const handleGoogleLogin = useCallback(async () => {
    setLocalError(null);
    setProcessingGoogleAuth(true);
    
    try {
      console.log('Iniciando login con Google...');
      await loginWithGoogle();
      
      // The useEffect will handle the redirection
      console.log('Google login successful, waiting for redirect...');
    } catch (err: any) {
      console.error('Google login error:', err);
      setLocalError('Error al iniciar sesión con Google. Intente de nuevo.');
      setProcessingGoogleAuth(false);
    }
  }, [loginWithGoogle]);

  // If already redirecting, show a loading state
  if (isRedirecting || processingGoogleAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">
            {processingGoogleAuth 
              ? 'Procesando autenticación con Google...' 
              : 'Iniciando sesión...'}
          </p>
        </div>
      </div>
    );
  }

  // Main loading state
  if (firebaseLoading || jwtLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-sm w-full text-slate-700 dark:text-slate-300 space-y-5">
        {/* Header */}
        <div className="text-center pb-8 space-y-2">
          <h3 className="mt-5 text-slate-900 dark:text-slate-200 text-2xl font-bold sm:text-3xl">
            Inicia sesión
          </h3>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            ¿No tienes cuenta?{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Regístrate
            </a>
          </p>
        </div>

        {/* Error messages */}
        {(firebaseError || jwtError || localError) && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
            {localError || firebaseError || jwtError}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div>
            <label className="font-medium text-slate-800 dark:text-slate-200">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full mt-2 px-3 py-2
                text-slate-900 dark:text-slate-100
                bg-transparent outline-none border border-slate-300
                focus:border-blue-600 dark:focus:border-blue-500
                shadow-sm rounded-lg
                dark:border-slate-700 dark:bg-slate-800
              "
            />
          </div>

          {/* Password field */}
          <div>
            <label className="font-medium text-slate-800 dark:text-slate-200">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full mt-2 px-3 py-2
                text-slate-900 dark:text-slate-100
                bg-transparent outline-none border border-slate-300
                focus:border-blue-600 dark:focus:border-blue-500
                shadow-sm rounded-lg
                dark:border-slate-700 dark:bg-slate-800
              "
            />
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-x-2 text-slate-700 dark:text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 focus:ring-blue-500"
              />
              Recordarme
            </label>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={firebaseLoading || jwtLoading}
            className="
              w-full px-4 py-2
              text-white font-medium
              bg-blue-600 hover:bg-blue-500 active:bg-blue-700
              disabled:bg-blue-400 disabled:cursor-not-allowed
              rounded-lg duration-150
            "
          >
            {(firebaseLoading || jwtLoading) ? 'Cargando…' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <hr className="flex-1 border-slate-300 dark:border-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            o continúa con
          </span>
          <hr className="flex-1 border-slate-300 dark:border-slate-700" />
        </div>

        {/* Google login button */}
        <button
          onClick={handleGoogleLogin}
          disabled={firebaseLoading || jwtLoading || processingGoogleAuth}
          className="
            w-full flex items-center justify-center gap-x-3 py-2.5
            border border-slate-300 dark:border-slate-700 rounded-lg
            text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {/* Google SVG */}
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_17_40)">
              <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4" />
              <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853" />
              <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04" />
              <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335" />
            </g>
            <defs>
              <clipPath id="clip0_17_40">
                <rect width="48" height="48" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {processingGoogleAuth ? 'Procesando...' : 'Continuar con Google'}
        </button>
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-xs text-slate-500 dark:text-slate-400 p-2 border border-slate-200 dark:border-slate-700 rounded">
            <p>Debug: Firebase auth state - {user ? `Logged in as ${user.email}` : 'Not logged in'}</p>
            <p>JWT Token - {localStorage.getItem('accessToken') ? 'Present' : 'Not present'}</p>
          </div>
        )}
      </div>
    </main>
  );
}