// src/app/chat/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { PromptInput } from '@/components/PromptInput';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

type Msg = { from: 'user' | 'bot'; text: string };

// Estima un delay de “escritura” según nº de palabras (~40 wpm) con jitter
function estimateTypingDelay(reply: string) {
  const words = reply.trim().split(/\s+/).length;
  const msPerWord = 30000 / 40; // 1500 ms / palabra
  const base = words * msPerWord;
  const jitter = 0.8 + Math.random() * 0.4; // entre 0.8 y 1.2
  return base * jitter;
}

export default function ChatPage() {
  const { accessToken, loading, authFetch, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const pidParam = params.get('pid');
  const personalityId = pidParam ?? null;

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ————————————————————————————————————————————
  // 1) Protección de ruta: si ya cargó y no hay token, desloguea
  useEffect(() => {
    if (!loading && !accessToken) {
      logout();
    }
  }, [loading, accessToken, logout]);

  // ————————————————————————————————————————————
  // 2) Carga el historial cuando cambia la personalidad
  useEffect(() => {
    if (!personalityId) return;
    (async () => {
      try {
        const res = await authFetch(`/chat/history/${personalityId}`);
        if (!res.ok) throw new Error('No pude cargar historial');
        const history: { sender: 'user' | 'bot'; content: string }[] = await res.json();
        setMsgs(history.map(m => ({ from: m.sender, text: m.content })));
        // Scroll al fondo
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [personalityId, authFetch]);

  // ————————————————————————————————————————————
  // 3) Auto-selecciona si sólo tienes UNA personalidad (opcional)
  useEffect(() => {
    if (personalityId || !accessToken) return;
    (async () => {
      try {
        const res = await authFetch('/users/me/personalities');
        if (!res.ok) return;
        const list: { id: string }[] = await res.json();
        if (list.length === 1) {
          router.replace(`/chat?pid=${list[0].id}`);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [accessToken, personalityId, authFetch, router]);

  // ————————————————————————————————————————————
  // 4) Envío de mensaje con indicador typing y delay dinámico
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !personalityId) return;
    // a) Mensaje del usuario
    setMsgs(prev => [...prev, { from: 'user', text }]);
    setInput('');
    try {
      // b) Asegura personalidad seleccionada
      await authFetch(`/users/me/personalities/${personalityId}/select`, {
        method: 'POST',
      });
      // c) Petición al backend
      const res = await authFetch('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('Error del servidor');
      const { reply } = await res.json();
      // d) Muestra “typing” y espera delay
      setTyping(true);
      await new Promise(r => setTimeout(r, estimateTypingDelay(reply)));
      setTyping(false);
      // e) Añade respuesta del bot
      setMsgs(prev => [...prev, { from: 'bot', text: reply }]);
      // f) Scroll al final
      containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
    } catch (e) {
      console.error(e);
      setTyping(false);
    }
  };

  // Enter = enviar, Shift+Enter = newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ————————————————————————————————————————————
  // Render
  return (
    <div className="flex h-screen font-sans text-base">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        {/* HEADER / user menu */}
        <header className="flex justify-end items-center p-4 bg-slate-200 dark:bg-slate-900">
          <UserMenu />
        </header>

        {/* HISTORIAL O PLACEHOLDER */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-900"
        >
          <div className="mx-auto max-w-2xl p-4">
            {personalityId ? (
              <div className="space-y-2">
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
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-slate-600 dark:text-slate-400">
                <p>No hay alter ego seleccionado.</p>
                <button
                  onClick={() => router.push('/personality/setup')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Crear o seleccionar uno
                </button>
              </div>
            )}
          </div>
        </div>

        {/* INPUT sólo si hay personalidad */}
        {personalityId && (
          <div className="p-4 bg-slate-200 dark:bg-slate-900">
            <PromptInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
      </main>
    </div>
  );
}
