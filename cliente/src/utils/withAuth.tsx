'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

// HOC para proteger rutas autenticadas
export function withAuth(Component: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const { user, loading } = useFirebaseAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [loading, user, router]);

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

    if (!user) {
      return null; // No renderiza nada mientras redirige
    }

    return <Component {...props} />;
  };
}