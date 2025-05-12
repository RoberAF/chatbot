'use client';

import React from 'react';

export type ChatMessageProps = {
  from: 'user' | 'bot';
  text: string;
};

export function ChatMessage({ from, text }: ChatMessageProps) {
  const isUser = from === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2`}>
      <div
        className={`
          max-w-[60%] px-4 py-2 text-base font-sans
          ${isUser
            ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-none'
            : 'bg-white text-slate-900 rounded-tr-lg rounded-br-lg rounded-tl-none rounded-bl-lg'
          }
        `}
      >
        {text}
      </div>
    </div>
  );
}
