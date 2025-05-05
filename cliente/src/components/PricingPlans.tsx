// src/components/PricingPlans.tsx
'use client';

import React, { useState } from 'react';

type PricingPlansProps = {
  currentTier: 'FREE' | 'PRO' | 'PRO_PLUS';
};

export function PricingPlans({ currentTier }: PricingPlansProps) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const isCurrent = (tier: 'PRO' | 'PRO_PLUS') => currentTier === tier;

  return (
    <div className="min-h-screen bg-slate-50 py-4 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Título y toggle */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
            Cambiar de plan
          </h2>
          <div className="mt-16 flex justify-center">
            <div className="rounded-full border border-slate-300 p-1 dark:border-slate-300/20">
              <div className="flex text-xs font-semibold leading-5">
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`w-auto rounded-full px-3 py-1 ${
                    period === 'monthly'
                      ? 'bg-blue-600 text-slate-200'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setPeriod('yearly')}
                  className={`rounded-full px-3 py-1 ${
                    period === 'yearly'
                      ? 'bg-blue-600 text-slate-200'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards container */}
        <div className="mt-10 flex flex-col items-center space-y-4 md:space-y-0 md:flex-row md:justify-center md:space-x-2">
          {/* Pro Plan */}
          <div className="flex w-full max-w-xs flex-col justify-between rounded-3xl bg-slate-50 p-8 text-slate-900 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-300/20 min-h-[30rem]">
            <div>
              <div className="flex items-center justify-between gap-x-2">
                <h3 id="tier-pro" className="text-lg font-semibold leading-8">
                  Pro
                </h3>
                <p className="rounded-full bg-blue-600/10 px-2 py-1 text-xs font-semibold leading-5 text-blue-600">
                  🚀 Más popular
                </p>
              </div>
              <p className="mt-4 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">
                  {period === 'monthly' ? '€19.99' : '€199.99'}
                </span>
                <span className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-400">
                  /{period === 'monthly' ? 'mes' : 'año'}
                </span>
              </p>
              <ul
                role="list"
                className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-400"
              >
                <li className="flex gap-x-2">✔️ 3 chatbots</li>
                <li className="flex gap-x-2">✔️ Cambiar personalidad</li>
                <li className="flex gap-x-2">✔️ Avatar 3D</li>
              </ul>
            </div>
            <a
              href={isCurrent('PRO') ? undefined : '#'}
              aria-disabled={isCurrent('PRO')}
              className={`
                mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6
                ${
                  isCurrent('PRO')
                    ? 'bg-gray-400 text-gray-100 cursor-default'
                    : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                }
              `}
            >
              {isCurrent('PRO') ? 'Plan actual' : 'Obtener plan'}
            </a>
          </div>

          {/* Pro + Plan */}
          <div className="flex w-full max-w-xs flex-col justify-between rounded-3xl bg-slate-50 p-8 text-slate-900 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-300/20 min-h-[30rem]">
            <div>
              <h3 id="tier-pro-plus" className="text-lg font-semibold leading-8">
                Pro +
              </h3>
              <p className="mt-4 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">
                  {period === 'monthly' ? '€29.99' : '€299.99'}
                </span>
                <span className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-400">
                  /{period === 'monthly' ? 'mes' : 'año'}
                </span>
              </p>
              <ul
                role="list"
                className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-400"
              >
                <li className="flex gap-x-2">✔️ 5 chatbots</li>
                <li className="flex gap-x-2">✔️ Personalizar avatar 3D</li>
                <li className="flex gap-x-2">✔️ Fotos, vídeos y audio</li>
              </ul>
            </div>
            <a
              href={isCurrent('PRO_PLUS') ? undefined : '#'}
              aria-disabled={isCurrent('PRO_PLUS')}
              className={`
                mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6
                ${
                  isCurrent('PRO_PLUS')
                    ? 'bg-gray-400 text-gray-100 cursor-default'
                    : 'ring-1 ring-inset ring-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                }
              `}
            >
              {isCurrent('PRO_PLUS') ? 'Plan actual' : 'Obtener plan'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
