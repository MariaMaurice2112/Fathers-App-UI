'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { APP_NAME } from '@/constants';
import { useApp } from '@/context/AppContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isInitializing, logout } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isInitializing && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isInitializing, isLoggedIn, router]);

  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-cream)', color: 'var(--color-text-muted)' }}>
        …جاري التحميل
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-main">
        <header className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="فتح القائمة"
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            ☰
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="app-name" style={{ fontSize: 15, fontWeight: 700 }}>{APP_NAME}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>المتابعة الرعوية</div>
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
