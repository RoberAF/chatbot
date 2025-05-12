'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function ConfirmEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {useSearchParams()
      setStatus('error');
      setMessage('Token inválido o faltante. No se puede verificar tu cuenta.');
      return;
    }

    const confirmEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/confirm?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email confirmado correctamente. Redirigiendo al login...');
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Ha ocurrido un error al confirmar tu cuenta.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Ha ocurrido un error al confirmar tu cuenta.');
        console.error('Error al confirmar email:', error);
      }
    };

    confirmEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            Confirmación de cuenta
          </h2>
          
          {/* Icono según estado */}
          <div className="mt-8 flex justify-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            )}
            {status === 'success' && (
              <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Mensaje */}
          <p className="mt-6 text-lg text-slate-700 dark:text-slate-300">
            {message}
          </p>
          
          {/* Botón según estado */}
          {status === 'error' && (
            <button
              onClick={() => router.push('/login')}
              className="mt-8 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir a Login
            </button>
          )}
          
          {status === 'success' && (
            <div className="mt-8 text-sm text-slate-500 dark:text-slate-400">
              Serás redirigido a la página de login en unos segundos...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}