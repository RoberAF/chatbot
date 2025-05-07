'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useAuth } from '@/hooks/useAuth';

// Define the context type
type AuthContextType = {
  // Authentication state
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Firebase user information
  firebaseUser: any;
  firebaseLoading: boolean;
  
  // Custom JWT information
  accessToken: string | null;
  jwtLoading: boolean;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  register: (email: string, password: string, name?: string, age?: number) => Promise<any>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  
  // API request method
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Firebase authentication
  const { 
    user: firebaseUser, 
    loading: firebaseLoading, 
    error: firebaseError,
    login: firebaseLogin,
    loginWithGoogle: firebaseLoginWithGoogle,
    register: firebaseRegister,
    logout: firebaseLogout,
    getIdToken
  } = useFirebaseAuth();
  
  // Custom JWT authentication
  const {
    accessToken,
    loading: jwtLoading,
    error: jwtError,
    login: jwtLogin,
    register: jwtRegister,
    logout: jwtLogout,
    authFetch
  } = useAuth();
  
  // Combined loading and error states
  const loading = firebaseLoading || jwtLoading;
  const [error, setError] = useState<string | null>(null);
  
  // Determine if the user is authenticated (either via Firebase or JWT)
  const isAuthenticated = Boolean(firebaseUser || accessToken);
  
  // Update the error state when either auth system reports an error
  useEffect(() => {
    if (firebaseError || jwtError) {
      setError(firebaseError || jwtError);
    } else {
      setError(null);
    }
  }, [firebaseError, jwtError]);

  // Unified login function that tries both authentication systems
  const login = async (email: string, password: string) => {
    try {
      // Try Firebase first
      const firebaseResult = await firebaseLogin(email, password);
      
      // If successful, the Firebase auth state listener will trigger
      // token exchange in useAuth
      return firebaseResult;
    } catch (firebaseErr) {
      console.error('Firebase login failed, trying JWT login:', firebaseErr);
      
      try {
        // Fall back to JWT authentication
        return await jwtLogin(email, password);
      } catch (jwtErr) {
        console.error('JWT login also failed:', jwtErr);
        throw jwtErr; // Propagate the error
      }
    }
  };

  // Unified register function
  const register = async (email: string, password: string, name?: string, age?: number) => {
    try {
      // Try Firebase registration
      const firebaseResult = await firebaseRegister(email, password);
      
      // If successful with Firebase, also register with backend
      // This ensures both auth systems have the user
      try {
        await jwtRegister(email, password, name, age);
      } catch (jwtErr) {
        console.error('Backend registration failed, but Firebase succeeded:', jwtErr);
        // We might want to delete the Firebase user in this case,
        // but for now we'll continue since Firebase auth worked
      }
      
      return firebaseResult;
    } catch (firebaseErr) {
      console.error('Firebase registration failed:', firebaseErr);
      
      // If Firebase fails but it's just because the user already exists,
      // we might still want to try JWT registration
      if ((firebaseErr as any)?.code === 'auth/email-already-in-use') {
        try {
          return await jwtRegister(email, password, name, age);
        } catch (jwtErr) {
          console.error('JWT registration also failed:', jwtErr);
          throw jwtErr;
        }
      }
      
      throw firebaseErr;
    }
  };

  // Unified logout from both systems
  const logout = async () => {
    try {
      console.log("Iniciando proceso de cierre de sesión completo");
      
      // 1. Establecer flag de cierre de sesión
      localStorage.setItem('intentional_logout', 'true');
      
      // 2. Forzar cierre de sesión en el backend primero
      if (accessToken) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
          });
          console.log("Backend notificado del cierre de sesión");
        } catch (e) {
          console.error("Error al notificar al backend:", e);
        }
      }
      
      // 3. Limpiar TODOS los tokens y estado local
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Llamar a jwtLogout para limpiar estado interno del hook useAuth
      await jwtLogout();
      
      // 5. Cerrar sesión en Firebase
      try {
        // Desactivar listener temporalmente
        const unsubscribeTemp = onAuthStateChanged(auth, () => {});
        unsubscribeTemp();
        
        await signOut(auth);
        console.log("Firebase signOut completado");
      } catch (fbError) {
        console.error("Error al cerrar sesión en Firebase:", fbError);
      }
      
      // 6. Espera breve para que todo se procese
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 7. Redirección usando window.location para forzar recarga completa
      console.log("Redirigiendo a la página de login...");
      window.location.href = '/login';
    } catch (err) {
      console.error('Error global en cierre de sesión:', err);
      
      // 8. Aún en caso de error, forzar la redirección
      window.location.href = '/login';
    }
  };

  // Función de emergencia para forzar cierre de sesión total
  const forceLogout = () => {
    console.log("Ejecutando cierre de sesión de emergencia");
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    window.location.href = '/login';
  };

  // Unified Google login
  const loginWithGoogle = async () => {
    try {
      const result = await firebaseLoginWithGoogle();
      
      // The Firebase listener will handle token exchange
      return result;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Error al iniciar sesión con Google');
      throw err;
    }
  };

  // The value provided to consuming components
  const value = {
    isAuthenticated,
    loading,
    error,
    firebaseUser,
    firebaseLoading,
    accessToken,
    jwtLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    forceLogout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}