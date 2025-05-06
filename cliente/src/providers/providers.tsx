'use client';

import React from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

/**
 * Root providers wrapper component
 * This component wraps the entire application with necessary providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}