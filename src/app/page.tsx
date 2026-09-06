'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const { isLoggedIn, isInitializing } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;
    router.replace(isLoggedIn ? '/dashboard' : '/login');
  }, [isLoggedIn, isInitializing, router]);

  return null;
}
