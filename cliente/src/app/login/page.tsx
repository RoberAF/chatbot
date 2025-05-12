'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { 
    accessToken,
    login, 
    loading, 
    error: authError 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      router.push('/chat');
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      await login(email, password);
      router.push('/chat');
    } catch (err: any) {
      console.error('Login error:', err);
      setLocalError('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  if (loading) {
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
        {(authError || localError) && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
            {localError || authError}
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
            disabled={loading}
            className="
              w-full px-4 py-2
              text-white font-medium
              bg-blue-600 hover:bg-blue-500 active:bg-blue-700
              disabled:bg-blue-400 disabled:cursor-not-allowed
              rounded-lg duration-150
            "
          >
            {loading ? 'Cargando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}