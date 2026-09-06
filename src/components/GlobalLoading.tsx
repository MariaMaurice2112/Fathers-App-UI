'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeApiLoading } from '@/lib/api/invoke';

const HIDE_DELAY_MS = 150;

export default function GlobalLoading() {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => subscribeApiLoading(setPending), []);

  useEffect(() => {
    if (pending > 0) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setVisible(true);
      return;
    }

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [pending]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={pending > 0}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(44, 36, 32, 0.28)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'auto',
        cursor: 'wait',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: '22px 28px',
          borderRadius: 16,
          background: 'var(--color-card)',
          border: '1px solid var(--color-warm-border)',
          boxShadow: '0 16px 40px rgba(44,36,32,0.18)',
          minWidth: 160,
          pointerEvents: 'none',
        }}
      >
        <div
          className="global-loading-spinner"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid var(--color-teal-pale)',
            borderTopColor: 'var(--color-teal)',
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-soft)', fontFamily: 'var(--font-body)' }}>
          جاري التحميل…
        </span>
      </div>
    </div>
  );
}
