'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Child } from '@/types';

interface ChildAutocompleteProps {
  options: Child[];
  value: string;
  onChange: (childId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChildAutocomplete({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'ابحث بالاسم…',
}: ChildAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((c) => c.id === value) ?? null;

  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setQuery(selected?.name ?? '');
  }, [selected?.name, value]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options.slice(0, 8);
    return options.filter((c) => c.name.includes(q)).slice(0, 8);
  }, [options, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const pick = (child: Child | null) => {
    if (!child) {
      onChange('');
      setQuery('');
      setOpen(false);
      return;
    }
    onChange(child.id);
    setQuery(child.name);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setQuery('');
    setOpen(true);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange('');
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
              setOpen(true);
              return;
            }
            if (e.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && open) {
              e.preventDefault();
              const choice = filtered[highlight];
              if (choice) pick(choice);
            }
          }}
          style={{
            width: '100%',
            padding: value ? '9px 36px 9px 12px' : '9px 12px',
            border: '1.5px solid var(--color-warm-border)',
            borderRadius: 10,
            fontSize: 13,
            background: 'var(--color-cream)',
            outline: 'none',
            boxSizing: 'border-box',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="مسح الاختيار"
            style={{
              position: 'absolute',
              top: '50%',
              left: 8,
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 20,
            top: 'calc(100% + 4px)',
            right: 0,
            left: 0,
            maxHeight: 220,
            overflowY: 'auto',
            background: 'var(--color-card)',
            border: '1px solid var(--color-warm-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(44,36,32,0.12)',
          }}
        >
          <button
            type="button"
            role="option"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(null)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'right',
              padding: '10px 12px',
              border: 'none',
              borderBottom: '1px solid var(--color-surface)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            بدون ابن محدد
          </button>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px', fontSize: 13, color: 'var(--color-text-muted)' }}>لا توجد نتائج</div>
          ) : (
            filtered.map((child, index) => {
              const active = index === highlight || child.id === value;
              return (
                <button
                  key={child.id}
                  type="button"
                  role="option"
                  aria-selected={child.id === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(child)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'right',
                    padding: '10px 12px',
                    border: 'none',
                    borderBottom: '1px solid var(--color-surface)',
                    background: active ? 'var(--color-teal-pale)' : 'transparent',
                    color: 'var(--color-text)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: child.id === value ? 600 : 400,
                  }}
                >
                  {child.name}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
