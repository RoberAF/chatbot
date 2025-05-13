'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [language, setLanguage] = useState('es');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    
    if (!storedToken) {
      console.log('No hay token, redirigiendo a login');
      router.push('/login');
      return;
    }
    
    const loadSettings = () => {
      try {
        // El tema ya se carga automáticamente en el ThemeProvider
        
        const storedNotifications = localStorage.getItem('notifications');
        setNotifications(storedNotifications === 'true');
        
        const storedEmailUpdates = localStorage.getItem('emailUpdates');
        setEmailUpdates(storedEmailUpdates === 'true');
        
        const storedLanguage = localStorage.getItem('language') || 'es';
        setLanguage(storedLanguage);
        
      } catch (err) {
        console.error('Error al cargar configuración:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // El tema ya se guarda automáticamente con el ThemeProvider
      localStorage.setItem('notifications', notifications.toString());
      localStorage.setItem('emailUpdates', emailUpdates.toString());
      localStorage.setItem('language', language);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
    } catch (err: any) {
      setError('Error al guardar ajustes');
      console.error('Error al guardar ajustes:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Cargando ajustes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Ajustes
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Personaliza tu experiencia en la aplicación
          </p>
        </div>

        {/* Formulario de ajustes */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Mensajes de éxito/error */}
            {success && (
              <div className="m-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                Ajustes guardados correctamente
              </div>
            )}
            
            {error && (
              <div className="m-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Sección de apariencia */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Apariencia</h2>
              
              <div className="space-y-6">
                {/* Selector de tema */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tema
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`
                        flex items-center justify-center rounded-lg border p-3
                        ${theme === 'light'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Claro
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`
                        flex items-center justify-center rounded-lg border p-3
                        ${theme === 'dark'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Oscuro
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`
                        flex items-center justify-center rounded-lg border p-3
                        ${theme === 'system'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Sistema
                    </button>
                  </div>
                </div>
                
                {/* Selector de idioma */}
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Idioma
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Sección de notificaciones */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Notificaciones</h2>
              
              <div className="space-y-4">
                {/* Notificaciones en la app */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifications"
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="notifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Notificaciones en la aplicación
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Recibe alertas cuando haya actividad importante en tu cuenta
                    </p>
                  </div>
                </div>
                
                {/* Actualizaciones por email */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailUpdates"
                      type="checkbox"
                      checked={emailUpdates}
                      onChange={(e) => setEmailUpdates(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="emailUpdates" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Actualizaciones por email
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Recibe correos con novedades y mejoras del servicio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de privacidad */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Privacidad</h2>
              
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg mb-4">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">
                    Para gestionar tu información personal y opciones de privacidad avanzadas, ve a la página de 
                    <a href="/profile" className="font-medium underline ml-1">Mi Perfil</a>.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                Ir a mi perfil
              </button>
            </div>
            
            {/* Sección de accesibilidad */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Accesibilidad</h2>
              
              <div className="space-y-4">
                {/* Tamaño de fuente */}
                <div>
                  <label htmlFor="fontSize" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tamaño de fuente
                  </label>
                  <select
                    id="fontSize"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    defaultValue="medium"
                  >
                    <option value="small">Pequeño</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
                
                {/* Animaciones */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="reduceMotion"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                      defaultChecked={false}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="reduceMotion" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Reducir animaciones
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Minimiza efectos de movimiento en la interfaz
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`
                  px-4 py-2 rounded-lg text-white
                  ${saving
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}