'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type Personality = {
  id: string;
  traits: { name: string };
};

function parseJwt(token: string) {
  try {
    const payload = token
      .split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    return JSON.parse(
      decodeURIComponent(
        atob(payload)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
  } catch {
    return null;
  }
}

function SidebarContent() {
  const { accessToken, loading, authFetch, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const activePid = params.get('pid') || '';

  const userId = useMemo(() => {
    if (!accessToken) return null;
    return parseJwt(accessToken)?.sub ?? null;
  }, [accessToken]);

  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPersonalities, setIsLoadingPersonalities] = useState(false);

  const newChat = () => {
    router.push('/personality/new');
  };

  const goPlans = () => {
    router.push('/subscription/plans');
  };

  const loadPersonalities = useCallback(async () => {
    if (isLoadingPersonalities) return;
    
    setIsLoadingPersonalities(true);
    try {
      const res = await authFetch(`/users/me/personalities`);
      if (!res.ok) throw new Error('No se pudieron cargar las personalidades');
      const data = await res.json();
      setPersonalities(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingPersonalities(false);
    }
  }, [authFetch, isLoadingPersonalities]);

  useEffect(() => {
    if (!loading && !accessToken) {
      logout();
      return;
    }
    
    if (loading || !accessToken || !userId) return;
    
    if (personalities.length === 0 && !isLoadingPersonalities) {
      loadPersonalities();
    }
  }, [loading, accessToken, userId, logout, personalities.length, isLoadingPersonalities, loadPersonalities]);

  const selectPersonality = async (pid: string) => {
    if (pid === activePid) return;
    
    await authFetch(`/users/me/personalities/${pid}/select`, {
      method: 'POST',
    });
    router.push(`/chat?pid=${pid}`);
  };

  return (
    <aside className="flex h-screen">
      <div className="flex h-screen w-64 flex-col overflow-y-auto overflow-x-hidden bg-slate-50 pt-8 dark:bg-slate-900 px-2 custom-scrollbar">
        <h2 className="px-3 text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
          Chats
        </h2>

        <button
          onClick={newChat}
          aria-label="Crear nuevo Alter Ego"
          className="mb-2 flex w-full items-center gap-x-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
            <path stroke="none" d="M0 0h24v24H0z"/>
            <path d="M12 5l0 14"/>
            <path d="M5 12l14 0"/>
          </svg>
          Nuevo con plantilla
        </button>
        
        <button
          onClick={() => router.push('/personality/setup')}
          aria-label="Crear personalidad desde cero"
          className="mb-6 flex w-full items-center gap-x-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
            <path stroke="none" d="M0 0h24v24H0z"/>
            <path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4" />
            <path d="M13.5 6.5l4 4" />
          </svg>
          Crear desde cero
        </button>

        <div className="flex-1 space-y-2 px-1">
          {error && (
            <p className="text-red-500 text-sm px-3">{error}</p>
          )}
          
          {isLoadingPersonalities && (
            <p className="text-sm text-slate-500 dark:text-slate-400 px-3">
              Cargando chats...
            </p>
          )}
          
          {!isLoadingPersonalities && !error && personalities.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 px-3">
              No tienes chats.
            </p>
          )}
          
          {personalities.map(p => {
            const isActive = p.id === activePid;
            return (
              <button
                key={p.id}
                onClick={() => selectPersonality(p.id)}
                className={`
                  flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium
                  transition-colors duration-200
                  ${isActive
                    ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{p.traits.name}</span>
                {isActive && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
                    <path stroke="none" d="M0 0h24v24H0z"/>
                    <path d="M9 6l6 6l-6 6"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={goPlans}
          aria-label="Ver planes de suscripción"
          className="mt-6 mb-4 flex w-full items-center gap-x-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
            <path stroke="none" d="M0 0h24v24H0z"/>
            <path d="M12 20l9 -5l-9 -5l-9 5l9 5z"/>
            <path d="M12 20v-10"/>
            <path d="M21 15l-9 -5"/>
            <path d="M3 15l9 -5"/>
          </svg>
          Planes de suscripción
        </button>
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={
      <aside className="flex h-screen">
        <div className="flex h-screen w-64 items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </aside>
    }>
      <SidebarContent />
    </Suspense>
  );
}