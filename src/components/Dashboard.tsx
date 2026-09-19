'use client';

import { useState } from 'react';
import type { ActionType, AlertStatus, AppEvent, BirthdayAlert, Child, ConfessionAlert, DashboardStats, PriestUser } from '@/types';
import Avatar from '@/components/Avatar';
import EventDetailModal from '@/components/EventDetailModal';
import Modal from '@/components/Modal';
import {
  addDaysISO,
  formatDate,
  formatDateShort,
  formatTime,
  getAge,
  getDaysDiff,
  getTodayISO,
} from '@/utils';

interface DashboardProps {
  user: PriestUser | null;
  childList: Child[];
  dashboardStats: DashboardStats;
  confessionAlerts: ConfessionAlert[];
  birthdayAlerts: BirthdayAlert[];
  events: AppEvent[];
  loading?: boolean;
  onMarkConfessionNoted: (childId: string) => Promise<void>;
  onTakeConfessionAction: (childId: string, actionType: ActionType, actionDate: string, actionNote?: string) => Promise<void>;
  onSnoozeConfession: (childId: string, until: string) => Promise<void>;
  onMarkBirthdayNoted: (childId: string) => Promise<void>;
  onTakeBirthdayAction: (childId: string, actionType: ActionType, actionDate: string, actionNote?: string) => Promise<void>;
  onNavigateToChild: (id: string) => void;
  onNavigateToChildren: () => void;
  onNavigateToEvents: () => void;
  onRefreshEvents: () => Promise<void>;
}

type OverdueFilter = 30 | 60 | 90 | 180;

interface ActionModal {
  type: 'confession' | 'birthday';
  childId: string;
  childName: string;
  mode: 'noted' | 'action' | 'snooze';
}

function StatusBadge({ status }: { status: AlertStatus }) {
  if (status === 'pending') return null;
  const map = {
    noted: { label: 'تم الاطلاع', bg: 'var(--color-teal-pale)', color: 'var(--color-teal)', border: 'rgba(26,95,95,0.2)' },
    action_taken: { label: 'تم اتخاذ إجراء', bg: 'var(--color-success-pale)', color: 'var(--color-success)', border: 'rgba(46,110,74,0.2)' },
  };
  const s = map[status];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{s.label}</span>
  );
}

function OverdueBadge({ days }: { days: number }) {
  const severe = days > 90;
  const bg = severe ? 'var(--color-danger-pale)' : 'var(--color-warning-pale)';
  const color = severe ? 'var(--color-danger)' : 'var(--color-warning)';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color, border: `1px solid ${severe ? 'rgba(163,58,58,0.2)' : 'rgba(168,104,48,0.2)'}`, whiteSpace: 'nowrap' }}>
      {days} يوماً
    </span>
  );
}

const ACTION_TYPES: ActionType[] = ['اتصال', 'زيارة', 'رسالة', 'متابعة أخرى'];

export default function Dashboard({
  user,
  childList,
  dashboardStats,
  confessionAlerts,
  birthdayAlerts,
  events,
  loading = false,
  onMarkConfessionNoted,
  onTakeConfessionAction,
  onSnoozeConfession,
  onMarkBirthdayNoted,
  onTakeBirthdayAction,
  onRefreshEvents,
  onNavigateToChild,
  onNavigateToChildren,
  onNavigateToEvents,
}: DashboardProps) {
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>(30);
  const [modal, setModal] = useState<ActionModal | null>(null);
  const [actionDate, setActionDate] = useState(getTodayISO());
  const [actionNote, setActionNote] = useState('');
  const [actionType, setActionType] = useState<ActionType>('اتصال');
  const [snoozeModal, setSnoozeModal] = useState<{ childId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  const today = getTodayISO();
  const childMap = Object.fromEntries(childList.map((c) => [c.id, c]));

  const activeConfessionAlerts = confessionAlerts.filter((a) => {
    if (a.snoozedUntil && a.snoozedUntil > today) return false;
    const child = childMap[a.childId];
    if (!child?.latestConfessionAt) return true;
    return getDaysDiff(child.latestConfessionAt) >= overdueFilter;
  }).sort((a, b) => {
    const da = childMap[a.childId]?.latestConfessionAt ?? '2000-01-01';
    const db = childMap[b.childId]?.latestConfessionAt ?? '2000-01-01';
    return new Date(da).getTime() - new Date(db).getTime();
  });

  const birthdayOrder = { yesterday: 0, today: 1, tomorrow: 2 } as const;
  const sortedBirthdayAlerts = [...birthdayAlerts]
    .filter((a) => a.status !== 'action_taken')
    .sort((a, b) => (birthdayOrder[a.relation] ?? 3) - (birthdayOrder[b.relation] ?? 3));

  const openNoted = (type: 'confession' | 'birthday', childId: string, childName: string) => {
    setModal({ type, childId, childName, mode: 'noted' });
  };
  const openAction = (type: 'confession' | 'birthday', childId: string, childName: string) => {
    setActionDate(today); setActionNote(''); setActionType('اتصال');
    setModal({ type, childId, childName, mode: 'action' });
  };
  const closeModal = () => setModal(null);

  const confirmNoted = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      if (modal.type === 'confession') await onMarkConfessionNoted(modal.childId);
      else await onMarkBirthdayNoted(modal.childId);
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAction = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      if (modal.type === 'confession') {
        await onTakeConfessionAction(modal.childId, actionType, actionDate, actionNote);
        setSnoozeModal({ childId: modal.childId });
      } else {
        await onTakeBirthdayAction(modal.childId, actionType, actionDate, actionNote);
      }
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async (days: number | null) => {
    if (!snoozeModal) { setSnoozeModal(null); return; }
    setSubmitting(true);
    try {
      if (days) {
        await onSnoozeConfession(snoozeModal.childId, addDaysISO(today, days));
      }
    } finally {
      setSubmitting(false);
      setSnoozeModal(null);
    }
  };

  const filterOptions: { label: string; value: OverdueFilter }[] = [
    { label: 'أكثر من شهر', value: 30 },
    { label: 'أكثر من شهرين', value: 60 },
    { label: 'أكثر من ٣ أشهر', value: 90 },
    { label: 'أكثر من ٦ أشهر', value: 180 },
  ];

  const todayDate = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const greetingName = user?.fatherName ? `أبونا ${user.fatherName}` : 'أهلاً وسهلاً';

  if (loading && childList.length === 0) {
    return (
      <div className="page-shell" style={{ padding: 40, color: 'var(--color-text-muted)' }}>
        …جاري تحميل لوحة المتابعة
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div style={{ marginBottom: 32 }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--color-text-muted)' }}>{todayDate}</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 30px)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>{greetingName}</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--color-text-soft)' }}>إليك ملخص المتابعة الرعوية لهذا اليوم</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'إجمالي الأبناء', value: dashboardStats.childrenCount, color: 'var(--color-teal)', icon: '◎', onClick: onNavigateToChildren },
          { label: 'متأخرون في الاعتراف', value: dashboardStats.childrenNeedingConfessionCount, color: 'var(--color-warning)', icon: '◷' },
          { label: 'أعياد ميلاد قريبة', value: dashboardStats.birthdaysThisWeekCount, color: 'var(--color-gold)', icon: '❋' },
          { label: 'أحداث هذا الأسبوع', value: dashboardStats.generalEventsThisWeekCount, color: 'var(--color-olive)', icon: '▦', onClick: onNavigateToEvents },
        ].map((stat) => (
          <div
            key={stat.label}
            role={stat.onClick ? 'button' : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
            onClick={stat.onClick}
            onKeyDown={stat.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stat.onClick?.(); } } : undefined}
            style={{
              background: 'var(--color-card)',
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: '0 1px 4px rgba(44,36,32,0.06)',
              border: '1px solid var(--color-warm-border)',
              cursor: stat.onClick ? 'pointer' : undefined,
              transition: stat.onClick ? 'box-shadow 0.15s, transform 0.15s' : undefined,
            }}
            onMouseEnter={stat.onClick ? (e) => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(44,36,32,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } : undefined}
            onMouseLeave={stat.onClick ? (e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(44,36,32,0.06)'; e.currentTarget.style.transform = 'none'; } : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 20, color: stat.color }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden' }}>
          <div className="widget-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-warm-border)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>متابعة الاعتراف</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>الأبناء المتأخرون عن الاعتراف يحتاجون متابعة رعوية</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {filterOptions.map((f) => (
                <button key={f.value} onClick={() => setOverdueFilter(f.value)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${overdueFilter === f.value ? 'var(--color-teal)' : 'var(--color-warm-border)'}`, background: overdueFilter === f.value ? 'var(--color-teal-pale)' : 'transparent', color: overdueFilter === f.value ? 'var(--color-teal)' : 'var(--color-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {activeConfessionAlerts.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>لا يوجد أبناء متأخرون في الاعتراف بهذا المعيار</p>
              </div>
            ) : (
              activeConfessionAlerts.map((alert) => {
                const child = childMap[alert.childId];
                if (!child) return null;
                const days = child.latestConfessionAt ? getDaysDiff(child.latestConfessionAt) : 999;
                return (
                  <div key={alert.id} className="confession-row">
                    <button onClick={() => onNavigateToChild(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Avatar child={child} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <button onClick={() => onNavigateToChild(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', marginBottom: 2 }}>{child.name}</button>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{child.stage}</div>
                    </div>
                    <div className="confession-row__meta">
                      <div className="confession-row__date" style={{ textAlign: 'center', minWidth: 110 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>آخر اعتراف</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-soft)', fontWeight: 500 }}>{child.latestConfessionAt ? formatDate(child.latestConfessionAt) : 'غير محدد'}</div>
                      </div>
                     
                    </div>
                     <OverdueBadge days={days} />
                    <StatusBadge status={alert.status} />
                    <div className="confession-row__actions">
                      {alert.status === 'pending' && (
                        <button onClick={() => openNoted('confession', alert.childId, child.name)}
                          style={{margin : '5px' , padding: '3px 10px', borderRadius: 8, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                          تم الاطلاع
                        </button>
                      )}
                      <button onClick={() => openAction('confession', alert.childId, child.name)}
                        style={{margin : '5px' , padding: '3px 10px', borderRadius: 8, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        تم اتخاذ إجراء
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="two-col-grid">
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-warm-border)' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>أعياد الميلاد</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>الأمس، اليوم، وغداً</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {sortedBirthdayAlerts.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎂</div>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>لا توجد أعياد ميلاد قريبة</p>
              </div>
            ) : (
              sortedBirthdayAlerts.map((alert) => {
                const child = childMap[alert.childId];
                if (!child) return null;
                const age = child.birthday ? getAge(child.birthday) : null;
                const isToday = alert.relation === 'today';
                const labelMap = { yesterday: 'أمس', today: 'اليوم ✦', tomorrow: 'غداً' };
                const colorMap = { yesterday: 'var(--color-text-muted)', today: 'var(--color-gold)', tomorrow: 'var(--color-teal)' };
                return (
                  <div key={alert.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-surface)', background: isToday ? 'var(--color-gold-pale)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <button onClick={() => onNavigateToChild(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Avatar child={child} size={38} />
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button onClick={() => onNavigateToChild(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{child.name}</button>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{age !== null ? `عمر ${age} سنة • ` : ''}{child.stage}</div>
                      </div>
                      {alert.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <button onClick={() => openNoted('birthday', alert.childId, child.name)}
                          style={{marginLeft: '10px', padding: '5px 11px', borderRadius: 8, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          تم الاطلاع
                        </button>
                      </div>
                    )} 
                      <span style={{ fontSize: 12, fontWeight: 700, color: colorMap[alert.relation] }}>{labelMap[alert.relation]}</span>
                    </div>
                    <StatusBadge status={alert.status} />
                   
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-warm-border)' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>أحداث هذا الأسبوع</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>الفعاليات والمواعيد العامة</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {events.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>لا توجد أحداث مقررة هذا الأسبوع</p>
              </div>
            ) : (
              events.map((ev) => {
                const child = ev.childId ? childMap[ev.childId] : null;
                const isToday = ev.eventDate === today;
                return (
                  <div key={ev.id} style={{ display: 'flex', gap: 14, padding: '14px 24px', borderBottom: '1px solid var(--color-surface)', background: isToday ? 'var(--color-teal-pale)' : 'transparent', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? 'var(--color-teal)' : 'var(--color-text-soft)', lineHeight: 1 }}>{formatDateShort(ev.eventDate)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 2, fontWeight: 600 }}>
                        {ev.eventTime ? `${ev.title} - ${formatTime(ev.eventTime)}` : ev.title}
                      </div>
                      {ev.message && <div style={{ fontSize: 12, color: 'var(--color-text-soft)', marginBottom: 4 }}>{ev.message}</div>}
                      {child && (
                        <button onClick={() => onNavigateToChild(ev.childId!)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                          {child.name} ←
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(ev)}
                      title="عرض الحدث"
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-teal-pale)', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      ←
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal open={modal?.mode === 'noted'} onClose={closeModal} title="تم الاطلاع" width={420}>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-soft)', fontSize: 14 }}>
          هل تريد تأكيد الاطلاع على تنبيه <strong>{modal?.childName}</strong>؟
        </p>
        <div className="modal-actions">
          <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
          <button onClick={confirmNoted} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>تأكيد الاطلاع</button>
        </div>
      </Modal>

      <Modal open={modal?.mode === 'action'} onClose={closeModal} title="تم اتخاذ إجراء" width={500}>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-soft)', fontSize: 14 }}>
          سجّل الإجراء المتخذ مع <strong>{modal?.childName}</strong>
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>نوع الإجراء</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACTION_TYPES.map((t) => (
              <button key={t} onClick={() => setActionType(t)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${actionType === t ? 'var(--color-teal)' : 'var(--color-warm-border)'}`, background: actionType === t ? 'var(--color-teal-pale)' : 'transparent', color: actionType === t ? 'var(--color-teal)' : 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: actionType === t ? 600 : 400 }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>تاريخ الإجراء *</label>
          <input type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} max={today}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>ملاحظة قصيرة</label>
          <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="مثلاً: اتصلت به وشجعته على العودة للاعتراف..." rows={3}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
        </div>
        <div className="modal-actions">
          <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
          <button onClick={confirmAction} disabled={!actionDate || submitting}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-success)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            حفظ الإجراء
          </button>
        </div>
      </Modal>

      <Modal open={!!snoozeModal} onClose={() => setSnoozeModal(null)} title="تم حفظ الإجراء ✓" width={440}>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-soft)', fontSize: 14 }}>هل تريد تأجيل هذا التنبيه؟</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[{ label: 'تأجيل أسبوع', days: 7 }, { label: 'تأجيل شهر', days: 30 }, { label: 'تأجيل ٣ أشهر', days: 90 }].map((s) => (
            <button key={s.days} onClick={() => handleSnooze(s.days)} disabled={submitting}
              style={{ padding: '10px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'var(--color-surface)', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {s.label}
            </button>
          ))}
          <button onClick={() => handleSnooze(null)} disabled={submitting}
            style={{ padding: '10px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            إزالة من القائمة
          </button>
        </div>
      </Modal>

      <EventDetailModal
        open={!!selectedEvent}
        event={selectedEvent}
        childList={childList}
        onClose={() => setSelectedEvent(null)}
        onUpdated={async (updated) => {
          setSelectedEvent(updated);
          await onRefreshEvents();
        }}
        onDeleted={async () => {
          setSelectedEvent(null);
          await onRefreshEvents();
        }}
        onNavigateToChild={(id) => {
          setSelectedEvent(null);
          onNavigateToChild(id);
        }}
      />
    </div>
  );
}
