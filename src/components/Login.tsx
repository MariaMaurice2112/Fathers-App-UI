'use client';

import { useState } from 'react';
import { APP_NAME, DEVELOPERS } from '@/constants';
import { getApiErrorMessage } from '@/lib/api/invoke';

interface LoginData {
  email: string;
  password: string;
  error: string;
}

interface LoginProps {
  onLogin: (data: Pick<LoginData, 'email' | 'password'>) => Promise<void>;
  loading?: boolean;
  configError?: string | null;
}

export default function Login({ onLogin, loading = false, configError = null }: LoginProps) {
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    error: '',
  });

  const updateField = (field: keyof LoginData, value: string) => {
    setLoginData((prev) => ({
      ...prev,
      [field]: value,
      ...(field !== 'error' ? { error: '' } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginData.email.trim();
    if (!email) {
      updateField('error', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!loginData.password) {
      updateField('error', 'يرجى إدخال كلمة المرور');
      return;
    }
    updateField('error', '');
    try {
      await onLogin({ email, password: loginData.password });
    } catch (err) {
      updateField('error', getApiErrorMessage(err, 'فشل تسجيل الدخول'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-teal)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -120, left: -80, width: 360, height: 360, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 24px)', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.12)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>✝</div>
            <h1 className="app-name" style={{ margin: 0, color: '#fff', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700 }}>{APP_NAME}</h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>نظام المتابعة الرعوية للأبناء الروحيين</p>
          </div>

          <div className="login-card" style={{ background: 'var(--color-card)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>تسجيل الدخول</h2>
            <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--color-text-muted)' }}>هذا النظام مخصص للكهنة فقط — المعلومات سرية ورعوية</p>

            {configError && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, background: 'var(--color-warning-pale)', border: '1px solid rgba(168,104,48,0.25)', color: 'var(--color-warning)', fontSize: 13, lineHeight: 1.5 }}>
                {configError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="abouna@church.eg"
                  disabled={loading}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 14, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-teal)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--color-warm-border)'; }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>كلمة المرور</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${loginData.error ? 'var(--color-danger)' : 'var(--color-warm-border)'}`, borderRadius: 10, fontSize: 14, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-teal)'; }}
                  onBlur={(e) => { e.target.style.borderColor = loginData.error ? 'var(--color-danger)' : 'var(--color-warm-border)'; }}
                />
                {loginData.error && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{loginData.error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || !!configError}
                style={{ width: '100%', padding: '12px', background: loading || configError ? 'var(--color-teal-mid)' : 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: loading || configError ? 'default' : 'pointer', transition: 'background 0.2s', letterSpacing: '0.02em' }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-teal-hover)'; }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-teal)'; }}
              >
                {loading ? '…جاري الدخول' : 'دخول'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer style={{ position: 'relative', zIndex: 1, padding: '20px 24px 28px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.12)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.6 }}>
            كنيسة العذراء مريم والملاك ميخائيل بالاباصيري
            <span style={{ margin: '0 8px', opacity: 0.4 }}>•</span>
            نظام رعوي داخلي
          </p>
          <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Developed by
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 28px' }}>
            {DEVELOPERS.map((dev) => (
              <div key={dev.name} style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                  {dev.name}
                </div>
                <a
                  href={`tel:${dev.tel}`}
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textDecoration: 'none', direction: 'ltr', display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}
                >
                  {dev.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
