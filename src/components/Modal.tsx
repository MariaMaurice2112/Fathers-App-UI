'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,32,0.45)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 4vw, 24px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-card)', borderRadius: 16, width: '100%', maxWidth: width, boxShadow: '0 20px 60px rgba(44,36,32,0.2)', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(16px, 3vw, 20px) clamp(16px, 4vw, 24px)', borderBottom: '1px solid var(--color-warm-border)' }}>
          <h3 style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 18px)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--color-surface)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>{children}</div>
      </div>
    </div>
  );
}
