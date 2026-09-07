'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/constants';
import type { PriestUser } from '@/types';
import { getInitials } from '@/utils';

interface SidebarProps {
  user: PriestUser | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { href: string; label: string; icon: string; match: (path: string) => boolean }[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: '⊞', match: (path) => path === '/dashboard' },
  { href: '/events', label: 'الأحداث', icon: '▦', match: (path) => path.startsWith('/events') },
  { href: '/children', label: 'أبنائي', icon: '◈', match: (path) => path.startsWith('/children') },
  { href: '/change-password', label: 'تغيير كلمة المرور', icon: '⚿', match: (path) => path.startsWith('/change-password') },
];

export default function Sidebar({ user, onLogout, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const displayName = user?.fatherName ?? user?.email ?? 'الأب';
  const initials = user?.fatherName ? getInitials(user.fatherName) : (user?.email?.[0]?.toUpperCase() ?? '؟');

  return (
    <aside className={`app-sidebar${isOpen ? ' open' : ''}`}>
      <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link
          href="/dashboard"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontFamily: 'Georgia, serif' }}>✝</div>
          <div>
            <div className="app-name" style={{ color: '#fff', fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{APP_NAME}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>المتابعة الرعوية</div>
          </div>
        </Link>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '8px 12px', letterSpacing: '0.08em', marginBottom: 4 }}>القائمة الرئيسية</div>
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400,
                textAlign: 'right', marginBottom: 2,
                transition: 'background 0.15s, color 0.15s',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', textAlign: 'right', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <span>↩</span> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
