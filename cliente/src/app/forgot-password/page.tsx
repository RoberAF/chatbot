'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Por favor, introduce tu email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al procesar tu solicitud');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <div className="text-center">
            <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">
              Email enviado
            </h2>
            
            <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
              <p>
                Si existe una cuenta asociada a <span className="font-medium">{email}</span>, recibirás un correo con instrucciones para restablecer tu contraseña.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h3 className="font-bold text-blue-700 dark:text-blue-300 text-lg mb-2">Siguiente paso</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Revisa tu bandeja de entrada</li>
                  <li>Haz clic en el botón "Restablecer contraseña" dentro del correo</li>
                  <li>Establece una nueva contraseña segura</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center text-lg mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Importante
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>El correo puede tardar unos minutos en llegar</li>
                  <li>Si no encuentras el correo en tu bandeja de entrada, revisa tu carpeta de spam</li>
                  <li>El enlace de recuperación expirará en 1 hora</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button 
                onClick={() => router.push('/login')}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Volver a Login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            Recupera tu contraseña
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
                placeholder="nombre@ejemplo.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  O vuelve a
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}