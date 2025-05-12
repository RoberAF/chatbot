'use client';

import React, { useState, useEffect } from 'react';
import { useRouter }      from 'next/navigation';
import { useAuth }        from '@/hooks/useAuth';

export default function SetupPage() {
  const { accessToken, loading: authLoading, authFetch, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tier,    setTier]    = useState<'FREE' | 'PRO' | 'PRO_PLUS' | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const [name,    setName]    = useState('');
  const [age,     setAge]     = useState<number | ''>('');
  const [tone,    setTone]    = useState('');
  const [hobbies, setHobbies]= useState('');
  const [quirks,  setQuirks]  = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      logout();
      return;
    }

    (async () => {
      try {
        const res = await authFetch('/subscription/status');
        const { tier: t } = await res.json();
        setTier(t);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, accessToken, authFetch, logout]);

  useEffect(() => {
    if (authLoading || loading) return;

    if (tier !== 'PRO' && tier !== 'PRO_PLUS') {
      router.push('/chat');
    }
  }, [authLoading, loading, tier, router]);

  if (authLoading || loading) {
    return <p className="p-4 text-center">Cargando…</p>;
  }
  if (error) {
    return <p className="p-4 text-red-500 text-center">Error: {error}</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const traits = {
        name,
        age: Number(age),
        tone,
        hobbies: hobbies.split(',').map(h => h.trim()),
        quirks,
      };

      const res = await authFetch('/users/me/personalities', {
        method: 'POST',
        body: JSON.stringify({ traits }),
      });
      if (!res.ok) throw new Error('No se pudo crear la personalidad');
      const { id } = await res.json();

      await authFetch(`/users/me/personalities/${id}/select`, { method: 'POST' });
      router.push(`/chat?pid=${id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900 min-h-screen ">
      {/* Botón "X" de cerrar */}
      <button
        onClick={() => router.push('/chat')}
        aria-label="Cerrar"
        className="
          absolute top-4 right-4
          text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200
          p-2 rounded-full
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="max-w-2xl px-4 py-8 mx-auto lg:py-16">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Crear tu alter ego
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg
                         focus:ring-primary-600 focus:border-primary-600
                         dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          {/* Edad */}
          <div>
            <label htmlFor="age" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Edad
            </label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg
                         focus:ring-primary-600 focus:border-primary-600
                         dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          {/* Tono */}
          <div>
            <label htmlFor="tone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Tono
            </label>
            <input
              id="tone"
              type="text"
              value={tone}
              onChange={e => setTone(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg
                         focus:ring-primary-600 focus:border-primary-600
                         dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          {/* Hobbies */}
          <div>
            <label htmlFor="hobbies" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Hobbies (separados por coma)
            </label>
            <input
              id="hobbies"
              type="text"
              value={hobbies}
              onChange={e => setHobbies(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg
                         focus:ring-primary-600 focus:border-primary-600
                         dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          {/* Quirks */}
          <div>
            <label htmlFor="quirks" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Rasgos únicos (quirks)
            </label>
            <input
              id="quirks"
              type="text"
              value={quirks}
              onChange={e => setQuirks(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg
                         focus:ring-primary-600 focus:border-primary-600
                         dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              Crear y seleccionar
            </button>
            <button
              type="button"
              onClick={() => router.push('/chat')}
              className="px-5 py-2.5 border border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white dark:border-red-500 dark:hover:bg-red-600 dark:hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
