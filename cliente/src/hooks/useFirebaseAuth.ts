'use client';

import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Escucha cambios en el estado de autenticación
  useEffect(() => {
    console.log('Configurando escucha de autenticación Firebase');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Estado de autenticación Firebase cambiado:', currentUser ? 'autenticado' : 'no autenticado');
      setUser(currentUser);
      setLoading(false);
      
      // Importante: si estamos autenticados, guarda el token en localStorage
      if (currentUser) {
        currentUser.getIdToken().then(token => {
          console.log('Token Firebase obtenido, guardando en localStorage');
          localStorage.setItem('accessToken', token);
          // No redirigir automáticamente aquí
        });
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Login con Google
  const loginWithGoogle = async () => {
    console.log('Iniciando login con Google');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Login con Google exitoso');
      
      // No redirigir automáticamente, dejar que el efecto de onAuthStateChanged lo maneje
      return result;
    } catch (err: any) {
      console.error('Error en login con Google:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Login con email y contraseña
  const login = async (email: string, password: string) => {
    console.log('Iniciando login con email/password');
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login con email exitoso');
      // No redirigir automáticamente
      return result;
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Registro
  const register = async (email: string, password: string) => {
    console.log('Iniciando registro');
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registro exitoso');
      // No redirigir automáticamente
      return result;
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Cerrar sesión
  const logout = async () => {
    console.log('Cerrando sesión Firebase');
    try {
      await signOut(auth);
      // Limpiar localStorage al cerrar sesión
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      console.log('Sesión cerrada correctamente');
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      setError(err.message);
    }
  };
  
  // Obtener token actual
  const getIdToken = async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (err: any) {
      console.error('Error al obtener token:', err);
      setError(err.message);
      return null;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    getIdToken
  };
}