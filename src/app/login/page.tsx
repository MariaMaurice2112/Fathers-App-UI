'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import { useApp } from '@/context/AppContext';
import { getSupabaseConfigMessage, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const { isLoggedIn, isInitializing, isLoading, login } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, isInitializing, router]);

  if (isInitializing || isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-teal)', color: 'rgba(255,255,255,0.7)' }}>
        …جاري التحميل
      </div>
    );
  }

  const configMessage = isSupabaseConfigured() ? null : getSupabaseConfigMessage();

  return (
    <Login
      loading={isLoading}
      configError={configMessage}
      onLogin={async ({ email, password }) => {
        await login(email, password);
        router.push('/dashboard');
      }}
    />
  );
}
