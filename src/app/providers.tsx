'use client';

import { AppProvider } from '@/context/AppContext';
import GlobalLoading from '@/components/GlobalLoading';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
      <GlobalLoading />
    </AppProvider>
  );
}
