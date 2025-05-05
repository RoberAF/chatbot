'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Por ahora nuestro backend ignora "name", solo usa email+password
      await register(email, password);
      // Mostrar el mensaje de éxito en lugar de redireccionar
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Si el registro fue exitoso, mostrar instrucciones para confirmar email
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
            
            <div className="mt-6 space-y-4 text-left text-slate-700 dark:text-slate-300">
              <p>
                Hemos enviado un correo electrónico a <span className="font-medium">{email}</span> con instrucciones para confirmar tu cuenta.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h3 className="font-bold text-blue-700 dark:text-blue-300 text-lg mb-2">Siguiente paso</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Revisa tu bandeja de entrada para encontrar el correo de confirmación</li>
                  <li>Haz clic en el botón "Confirmar mi cuenta" dentro del correo</li>
                  <li>Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado</li>
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
                  <li>No podrás iniciar sesión hasta confirmar tu cuenta</li>
                  <li>Si no encuentras el correo en tu bandeja de entrada, revisa tu carpeta de spam</li>
                  <li>El enlace de confirmación expira en 1 hora</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button 
                onClick={() => router.push('/login')}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Ir a Login
              </button>
              
              <button 
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </main>
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
        <div className="bg-white p-6 rounded-lg dark:bg-slate-900">
          {error && (
            <p className="mb-4 text-red-500 text-center">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre (opcional) */}
            <div>
              <label className="font-medium text-slate-800 dark:text-slate-200">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
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
            </div>

            {/* Botón Crear cuenta */}
            <button
              type="submit"
              disabled={authLoading}
              className="
                w-full px-4 py-2 text-white font-medium
                bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                rounded-lg duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {authLoading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2 my-6">
            <hr className="flex-1 border-slate-300 dark:border-slate-700" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              o continúa con
            </span>
            <hr className="flex-1 border-slate-300 dark:border-slate-700" />
          </div>

          {/* Botón Google */}
          <button
            className="
              w-full flex items-center justify-center gap-x-3 py-2.5
              border border-slate-300 dark:border-slate-700 rounded-lg
              text-sm font-medium
              hover:bg-slate-100 dark:hover:bg-slate-800
              duration-150
            "
            onClick={() => {
              // implementar OAuth si se desea
            }}
          >
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
      </div>
    </main>
  );
}