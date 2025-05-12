'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, accessToken, loading, error: authError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (accessToken) {
      router.push('/chat');
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await register(email, password, name, age === '' ? undefined : age);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrarse');
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
              ¡Registro exitoso!
            </h2>
            
            <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
              <p>
                Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h3 className="font-bold text-blue-700 dark:text-blue-300 text-lg mb-2">
                  ¿Qué sigue?
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Revisa tu bandeja de entrada</li>
                  <li>Haz clic en el enlace de confirmación</li>
                  <li>Inicia sesión con tu cuenta</li>
                </ol>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
              >
                Ir a Login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Procesando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full sm:max-w-md space-y-6 text-slate-700 dark:text-slate-300">
        {/* Cabecera */}
        <div className="text-center">
          <div className="mt-5 space-y-2">
            <h3 className="text-slate-900 dark:text-slate-200 text-2xl font-bold sm:text-3xl">
              Crear una cuenta
            </h3>
            <p className="text-sm">
              ¿Ya tienes cuenta?{' '}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Inicia sesión
              </a>
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white p-6 rounded-lg dark:bg-slate-800 shadow-md">
          {(error || authError) && (
            <div className="mb-4 text-red-500 text-center">
              {error || authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="font-medium text-slate-800 dark:text-slate-200">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="
                  w-full mt-2 px-3 py-2 text-slate-900 dark:text-slate-100
                  bg-transparent outline-none border border-slate-300
                  focus:border-blue-600 dark:focus:border-blue-500
                  shadow-sm rounded-lg
                  dark:border-slate-700 dark:bg-slate-800
                "
              />
            </div>

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
                  w-full mt-2 px-3 py-2 text-slate-900 dark:text-slate-100
                  bg-transparent outline-none border border-slate-300
                  focus:border-blue-600 dark:focus:border-blue-500
                  shadow-sm rounded-lg
                  dark:border-slate-700 dark:bg-slate-800
                "
              />
            </div>

            {/* Edad */}
            <div>
              <label className="font-medium text-slate-800 dark:text-slate-200">
                Edad
              </label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                required
                min="1"
                max="120"
                className="
                  w-full mt-2 px-3 py-2 text-slate-900 dark:text-slate-100
                  bg-transparent outline-none border border-slate-300
                  focus:border-blue-600 dark:focus:border-blue-500
                  shadow-sm rounded-lg
                  dark:border-slate-700 dark:bg-slate-800
                "
              />
            </div>

            {/* Contraseña */}
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
                  w-full mt-2 px-3 py-2 text-slate-900 dark:text-slate-100
                  bg-transparent outline-none border border-slate-300
                  focus:border-blue-600 dark:focus:border-blue-500
                  shadow-sm rounded-lg
                  dark:border-slate-700 dark:bg-slate-800
                "
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mínimo 8 caracteres
              </p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="font-medium text-slate-800 dark:text-slate-200">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="
                  w-full mt-2 px-3 py-2 text-slate-900 dark:text-slate-100
                  bg-transparent outline-none border border-slate-300
                  focus:border-blue-600 dark:focus:border-blue-500
                  shadow-sm rounded-lg
                  dark:border-slate-700 dark:bg-slate-800
                "
              />
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-slate-600 dark:text-slate-400">
                  Acepto los{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Términos y condiciones
                  </a>
                </label>
              </div>
            </div>

            {/* Botón Crear cuenta */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full px-4 py-2 text-white font-medium
                bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                rounded-lg duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}