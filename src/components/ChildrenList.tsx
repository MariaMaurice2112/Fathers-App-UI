'use client';

import { useState } from 'react';
import type { Child } from '@/types';
import Avatar from '@/components/Avatar';
import { confessionStatusLabel } from '@/lib/api/mappers';
import { formatDate, getDaysDiff } from '@/utils';

interface ChildrenListProps {
  childList: Child[];
  loading?: boolean;
  onSelectChild: (id: string) => void;
  onAddChild: () => void;
}

export default function ChildrenList({ childList, loading = false, onSelectChild, onAddChild }: ChildrenListProps) {
  const [search, setSearch] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  const filtered = childList.filter((c) => {
    if (search && !c.name.includes(search)) return false;
    if (filterOverdue && !c.needsConfession) return false;
    return true;
  });

  const hasFilters = search || filterOverdue;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>أبنائي الروحيون</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{childList.length} ابن وابنة في قائمة الرعية</p>
        </div>
        <button onClick={onAddChild}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, alignSelf: 'flex-start' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> إضافة ابن
        </button>
      </div>

      <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-warm-border)', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم…"
            style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-teal)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--color-warm-border)'; }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-soft)', cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={filterOverdue} onChange={(e) => setFilterOverdue(e.target.checked)} style={{ accentColor: 'var(--color-teal)', width: 15, height: 15 }} />
          متأخرون في الاعتراف
        </label>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterOverdue(false); }}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
            مسح الفلاتر
          </button>
        )}
      </div>

      <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden' }}>
        <div className="children-table-header">
          {['الاسم', 'المرحلة', 'آخر اعتراف', 'حالة الاعتراف', ''].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {loading && childList.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>…جاري التحميل</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>◈</div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
              {hasFilters ? 'لا يوجد أبناء يطابقون معايير البحث' : 'لم تتم إضافة أبناء بعد'}
            </p>
            {!hasFilters && (
              <button onClick={onAddChild} style={{ marginTop: 16, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>إضافة أول ابن</button>
            )}
          </div>
        ) : (
          filtered.map((child, i) => {
            const days = child.latestConfessionAt ? getDaysDiff(child.latestConfessionAt) : null;
            const overdue = child.needsConfession;
            return (
              <div key={child.id}
                className="children-table-row"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-surface)' : 'none' }}
                onClick={() => onSelectChild(child.id)}
              >
                <div className="children-cell children-cell--name">
                  <Avatar child={child} size={38} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{child.name}</span>
                </div>
                <div className="children-cell" data-label="المرحلة" style={{ fontSize: 13, color: 'var(--color-text-soft)' }}>{child.stage}</div>
                <div className="children-cell" data-label="آخر اعتراف">
                  {child.latestConfessionAt ? (
                    <div>
                      <div style={{ fontSize: 12, color: overdue ? 'var(--color-danger)' : 'var(--color-text-soft)', fontWeight: overdue ? 600 : 400 }}>{formatDate(child.latestConfessionAt)}</div>
                      {days !== null && overdue && <div style={{ fontSize: 11, color: 'var(--color-danger)' }}>منذ {days} يوم</div>}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>غير محدد</span>
                  )}
                </div>
                <div className="children-cell" data-label="حالة الاعتراف">
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: overdue ? 'var(--color-warning-pale)' : 'var(--color-success-pale)',
                    color: overdue ? 'var(--color-warning)' : 'var(--color-success)',
                  }}>
                    {confessionStatusLabel(child.confessionStatus)}
                  </span>
                </div>
                <div className="children-cell children-cell--actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onSelectChild(child.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-teal-pale)', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="عرض الملف">←</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--color-text-muted)', fontSize: 12 }}>
        {filtered.length} من {childList.length} ابن وابنة • المتابعة الرعوية الخاصة بك — معلومات سرية
      </p>
    </div>
  );
}
