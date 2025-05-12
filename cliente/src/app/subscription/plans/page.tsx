'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PricingPlans } from '@/components/PricingPlans';

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const [tier, setTier] = useState<'FREE' | 'PRO' | 'PRO_PLUS'>();
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
  const [daysLeftInTrial, setDaysLeftInTrial] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/subscription/status')
      .then(res => res.json())
      .then(data => {
        setTier(data.tier);
        setIsOnTrial(data.isOnTrial || false);
        setTrialEndDate(data.trialEndDate);
        setDaysLeftInTrial(data.daysLeftInTrial || 0);
      })
      .catch(err => {
        console.error(err);
        setTier('FREE');
      })
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading || !tier) {
    return <p className="p-4 text-center">Cargando planes…</p>;
  }

  return (
    <div className="relative h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Botón de cerrar */}
      <button
        onClick={() => router.push('/chat')}
        aria-label="Volver al chat"
        className="absolute top-4 right-4 rounded-full p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z"/>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* PricingPlans ocupa todo el alto y hace scroll internamente */}
      <div className="pt-12 h-full">
        <PricingPlans 
          currentTier={tier} 
          isOnTrial={isOnTrial}
          trialEndDate={trialEndDate}
          daysLeftInTrial={daysLeftInTrial}
        />
      </div>
    </div>
  );
}