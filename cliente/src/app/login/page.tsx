'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading, error } = useFirebaseAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Redireccionar si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      console.log('Usuario autenticado, redirigiendo a /chat');
      router.push('/chat');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(email, password);
      // La redirección se maneja en el useEffect
    } catch (err: any) {
      setLocalError('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // La redirección se maneja en el useEffect
    } catch (err: any) {
      setLocalError('Error al iniciar sesión con Google.');
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
        {/* Cabecera */}
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

        {/* Error */}
        {(error || localError) && (
          <p className="text-red-500 text-center">{error || localError}</p>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="font-medium text-slate-800 dark:text-slate-200">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
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

          {/* Password */}
          <div>
            <label className="font-medium text-slate-800 dark:text-slate-200">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
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

          {/* Recordarme & Olvidé */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-x-2 text-slate-700 dark:text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
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

          {/* Botón */}
          <button
            type="submit"
            className="
              w-full px-4 py-2
              text-white font-medium
              bg-blue-600 hover:bg-blue-500 active:bg-blue-700
              rounded-lg duration-150
            "
          >
            {loading ? 'Cargando…' : 'Entrar'}
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

        {/* Google */}
        <button
          className="w-full flex items-center justify-center gap-x-3 py-2.5
          border border-slate-300 dark:border-slate-700 rounded-lg
          text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800
          duration-150"
          onClick={handleGoogleLogin}
        >
          {/* SVG de Google (mantener el existente) */}
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
          Continuar con Google
        </button>
      </div>
    </main>
  );
}