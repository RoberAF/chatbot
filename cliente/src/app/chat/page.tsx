'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { PromptInput } from '@/components/PromptInput';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

type Msg = { from: 'user' | 'bot'; text: string };

// Estima un delay de "escritura" según nº de palabras (~40 wpm) con un poco de jitter
function estimateTypingDelay(reply: string) {
  const words = reply.trim().split(/\s+/).length;
  const msPerWord = 30000 / 40;             // 1500 ms / palabra
  const base = words * msPerWord;
  const jitter = 0.8 + Math.random() * 0.4; // entre 0.8 y 1.2
  return base * jitter;
}

export default function ChatPage() {
  const { accessToken, loading, authFetch, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const pidParam = params.get('pid');
  
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [activePersonality, setActivePersonality] = useState<string | null>(null);
  const [creatingDefaultPersonality, setCreatingDefaultPersonality] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1) Protección de ruta: si ya cargó y no hay token, desloguea
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
      if (!accessToken && !isRedirecting) {
        console.log('No hay token en ChatPage, redirigiendo a login');
        setIsRedirecting(true);
        
        // Guardar la ruta actual para redirigir después del login
        localStorage.setItem('auth_redirect_to', window.location.pathname + window.location.search);
        
        // Usar setTimeout para evitar bucles de redirección
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 100);
      }
    }
  }, [loading, accessToken, logout, router, isRedirecting]);

  // 2) Obtener/crear personalidad activa si es necesario
  useEffect(() => {
    if (loading || !accessToken || creatingDefaultPersonality || !authChecked || isRedirecting) return;
    
    console.log('Intentando obtener/crear personalidad activa');
    const getOrCreateActivePersonality = async () => {
      try {
        // Si se proporciona un ID de personalidad en la URL, usamos ese
        if (pidParam) {
          console.log(`Usando personalidad de URL: ${pidParam}`);
          // Marcarla como activa
          await authFetch(`/users/me/personalities/${pidParam}/select`, {
            method: 'POST',
          });
          setActivePersonality(pidParam);
          return;
        }
        
        // Si no hay pid en la URL, intentamos obtener la personalidad activa del usuario
        console.log('Obteniendo lista de personalidades');
        const res = await authFetch('/users/me/personalities');
        if (!res.ok) {
          console.error('Error al obtener personalidades:', await res.text());
          throw new Error('Error al obtener personalidades');
        }
        
        const personalities = await res.json();
        console.log(`Personalidades obtenidas: ${personalities.length}`);
        
        if (personalities && personalities.length > 0) {
          // Buscar si hay alguna ya marcada como activa (de un login anterior)
          console.log('Obteniendo información del usuario');
          const userRes = await authFetch('/users/me');
          if (!userRes.ok) {
            console.error('Error al obtener usuario:', await userRes.text());
            throw new Error('Error al obtener usuario');
          }
          
          const user = await userRes.json();
          
          if (user.activePersonalityId) {
            console.log(`Usuario ya tiene personalidad activa: ${user.activePersonalityId}`);
            setActivePersonality(user.activePersonalityId);
          } else {
            // Si no hay ninguna activa, seleccionamos la primera
            console.log(`Seleccionando primera personalidad: ${personalities[0].id}`);
            const selectRes = await authFetch(`/users/me/personalities/${personalities[0].id}/select`, {
              method: 'POST',
            });
            
            if (!selectRes.ok) {
              console.error('Error al seleccionar personalidad:', await selectRes.text());
              throw new Error('Error al seleccionar personalidad');
            }
            
            setActivePersonality(personalities[0].id);
          }
        } else {
          // Si el usuario no tiene personalidades, creamos una por defecto
          console.log('Creando personalidad por defecto');
          setCreatingDefaultPersonality(true);
          
          // Endpoint para crear personalidad predeterminada
          const defaultRes = await authFetch('/users/me/personalities/default', {
            method: 'POST',
          });
          
          if (!defaultRes.ok) {
            console.error('Error al crear personalidad por defecto:', await defaultRes.text());
            throw new Error('Error al crear personalidad por defecto');
          }
          
          const newPersonality = await defaultRes.json();
          console.log(`Personalidad por defecto creada: ${newPersonality.id}`);
          setActivePersonality(newPersonality.id);
          setCreatingDefaultPersonality(false);
        }
      } catch (error) {
        console.error('Error al obtener/crear personalidad:', error);
        setCreatingDefaultPersonality(false);
      }
    };

    getOrCreateActivePersonality();
  }, [loading, accessToken, pidParam, authFetch, creatingDefaultPersonality, authChecked, isRedirecting]);

  // 3) Carga el historial cuando tengamos una personalidad activa
  useEffect(() => {
    if (loading || !accessToken || !activePersonality || !authChecked || isRedirecting) return;

    console.log(`Cargando historial para personalidad: ${activePersonality}`);
    const loadChatHistory = async () => {
      try {
        const res = await authFetch(`/chat/history/${activePersonality}`);
        if (!res.ok) {
          console.error('Error al cargar historial:', await res.text());
          throw new Error('No pude cargar historial');
        }
        
        const history: { sender: 'user' | 'bot'; content: string }[] = await res.json();
        console.log(`Historial cargado: ${history.length} mensajes`);
        setMsgs(history.map(m => ({ from: m.sender, text: m.content })));
        
        // Scroll al fondo tras render
        setTimeout(() => {
          containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
        }, 0);
      } catch (e) {
        console.error('Error al cargar historial:', e);
      }
    };

    loadChatHistory();
  }, [loading, accessToken, activePersonality, authFetch, authChecked, isRedirecting]);

  // Envío del formulario con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 4) Lógica de envío: usuario → typing → bot con delay → scroll
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activePersonality || !accessToken) return;

    // a) Añade mensaje del user
    setMsgs(prev => [...prev, { from: 'user', text }]);
    setInput('');

    try {
      // b) Asegura que esta personalidad está seleccionada
      console.log(`Seleccionando personalidad para envío: ${activePersonality}`);
      const selectRes = await authFetch(`/users/me/personalities/${activePersonality}/select`, {
        method: 'POST',
      });
      
      if (!selectRes.ok) {
        console.error('Error al seleccionar personalidad para mensaje:', await selectRes.text());
        throw new Error('Error al seleccionar personalidad');
      }

      // c) Llama al backend
      console.log('Enviando mensaje al backend');
      const res = await authFetch('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      
      if (!res.ok) {
        console.error('Error al enviar mensaje:', await res.text());
        throw new Error('Error del servidor');
      }
      
      const { reply } = await res.json();
      console.log('Respuesta recibida del servidor');

      // d) Indicador "typing"
      setTyping(true);
      const delay = estimateTypingDelay(reply);
      await new Promise(r => setTimeout(r, delay));
      setTyping(false);

      // e) Añade respuesta del bot
      setMsgs(prev => [...prev, { from: 'bot', text: reply }]);
      
      // f) Scroll al final
      setTimeout(() => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
      }, 0);
    } catch (e) {
      console.error('Error al procesar mensaje:', e);
      setTyping(false);
      
      // Si hay un error de autenticación, intentar redireccionar
      if (e instanceof Error && e.message.includes('autenticación')) {
        logout();
        router.push('/login');
      }
    }
  };

  // Mostrar pantalla de carga mientras se está redirigiendo
  if (isRedirecting) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-base bg-slate-200 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading || !authChecked) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-base bg-slate-200 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de carga mientras intentamos resolver las personalidades
  if (!activePersonality && !creatingDefaultPersonality) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-base bg-slate-200 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Cargando tu chatbot...</p>
        </div>
      </div>
    );
  }

  // Si estamos creando una personalidad por defecto, mostrar indicador
  if (creatingDefaultPersonality) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-base bg-slate-200 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Preparando tu primera personalidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans text-base">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        {/* HEADER / user menu */}
        <header className="flex justify-end items-center p-4 bg-slate-200 dark:bg-slate-900">
          <UserMenu />
        </header>

        {/* HISTORIAL - Agregada clase custom-scrollbar */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-900 custom-scrollbar"
        >
          <div className="mx-auto max-w-2xl space-y-2 p-4">
            {msgs.map((m, i) => (
              <ChatMessage key={i} from={m.from} text={m.text} />
            ))}

            {typing && (
              <div className="flex items-start space-x-2">
                <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
                <div className="rounded-xl bg-slate-300 dark:bg-slate-700 px-3 py-2 animate-pulse">
                  …
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INPUT - Aplicado también a cualquier scrollbar que pueda aparecer en el textarea */}
        <div className="p-4 bg-slate-200 dark:bg-slate-900">
          <PromptInput
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            onKeyDown={handleKeyDown}
          />
        </div>
      </main>
    </div>
  );
}