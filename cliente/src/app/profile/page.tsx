'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  age: number | null;
  createdAt: string;
  subscription: {
    tier: 'FREE' | 'PRO' | 'PRO_PLUS';
    expiresAt: string | null;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { 
    accessToken,
    loading: authLoading, 
    authFetch, 
    logout 
  } = useAuth();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!accessToken) {
      router.push('/login');
      return;
    }
    
    const loadProfile = async () => {
      setPageLoading(true);
      try {
        const res = await authFetch('/users/me');
        
        if (!res.ok) {
          throw new Error('Error al cargar el perfil');
        }
        
        const userData = await res.json();
        setProfile(userData);
        
        setName(userData.name || '');
        setAge(userData.age || '');
        
      } catch (err: any) {
        console.error('Error cargando perfil:', err);
        setError('No se pudo cargar la información del perfil');
      } finally {
        setPageLoading(false);
      }
    };
    
    loadProfile();
  }, [accessToken, authLoading, authFetch, router]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      const updateData = {
        name,
        age: age === '' ? null : Number(age)
      };
      
      console.log('Enviando actualización:', updateData);
      
      const res = await authFetch('/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error de respuesta:', errorData);
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }
      
      const updatedUser = await res.json();
      console.log('Usuario actualizado:', updatedUser);
      
      setProfile({
        ...profile,
        ...updatedUser
      });
      
      // Emitir evento personalizado para actualizar otros componentes
      window.dispatchEvent(new Event('user-profile-updated'));
      
      setUpdateSuccess(true);
      setEditMode(false);
    } catch (err: any) {
      console.error('Error actualizando perfil:', err);
      setUpdateError(err.message || 'Error al actualizar el perfil');
    } finally {
      setUpdating(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{error}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Mi Perfil
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Gestiona tu información personal y revisa el estado de tu cuenta
          </p>
        </div>

        {/* Tarjeta del perfil */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-6">
          {/* Encabezado de tarjeta */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-200 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : profile?.email.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4 text-white">
                <h2 className="text-xl font-semibold">{profile?.name || 'Usuario'}</h2>
                <p className="text-blue-100">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Contenido del perfil */}
          <div className="p-6">
            {/* Mensaje de éxito */}
            {updateSuccess && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                Perfil actualizado correctamente
              </div>
            )}
            
            {/* Mensaje de error */}
            {updateError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {updateError}
              </div>
            )}

            {/* Formulario de edición o vista de información */}
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Edad
                  </label>
                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Tu edad"
                    min="1"
                    max="120"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className={`
                      px-4 py-2 rounded-lg text-white font-medium
                      ${updating
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                      }
                    `}
                  >
                    {updating ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Información de la cuenta</h3>
                  
                  <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-slate-900 dark:text-slate-200">Email</dt>
                      <dd className="text-sm text-slate-700 dark:text-slate-300">{profile?.email}</dd>
                    </div>
                    
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-slate-900 dark:text-slate-200">Nombre</dt>
                      <dd className="text-sm text-slate-700 dark:text-slate-300">{profile?.name || '—'}</dd>
                    </div>
                    
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-slate-900 dark:text-slate-200">Edad</dt>
                      <dd className="text-sm text-slate-700 dark:text-slate-300">{profile?.age || '—'}</dd>
                    </div>
                    
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-slate-900 dark:text-slate-200">Miembro desde</dt>
                      <dd className="text-sm text-slate-700 dark:text-slate-300">
                        {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                      </dd>
                    </div>
                    
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-slate-900 dark:text-slate-200">Plan actual</dt>
                      <dd className="text-sm">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${profile?.subscription?.tier === 'PRO' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : profile?.subscription?.tier === 'PRO_PLUS'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }
                        `}>
                          {profile?.subscription?.tier || 'FREE'}
                        </span>
                      </dd>
                    </div>
                    
                    {profile?.subscription?.expiresAt && (
                      <div className="flex justify-between py-3">
                        <dt className="text-sm font-medium text-slate-900 dark:text-slate-200">Válido hasta</dt>
                        <dd className="text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(profile.subscription.expiresAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Editar perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enlaces rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            onClick={() => router.push('/settings')}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-slate-900 dark:text-white">Ajustes de la cuenta</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Preferencias de interfaz y aplicación</p>
            </div>
          </div>
          
          <div
            onClick={() => router.push('/subscription/plans')}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-slate-900 dark:text-white">Gestionar suscripción</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cambia o actualiza tu plan</p>
            </div>
          </div>
        </div>

        {/* Botón para cerrar sesión */}
        <div className="text-center pt-4">
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}