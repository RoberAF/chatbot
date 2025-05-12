import React, { useState } from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
}: PromptInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.max(44, e.target.scrollHeight)}px`;
  };

  return (
    <div className="max-w-2xl mx-auto w-full"> 
      <div className="flex items-end space-x-2 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-md border border-slate-200 dark:border-slate-700">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-transparent p-2 focus:outline-none resize-none max-h-40 min-h-[44px] text-slate-900 dark:text-slate-100 custom-scrollbar"
          rows={1}
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className={`
            p-2 rounded-lg flex items-center justify-center
            ${
              value.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
            }
            transition-colors duration-200
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
          </svg>
        </button>
      </div>
    </div>
  );
}