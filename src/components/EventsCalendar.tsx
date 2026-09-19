'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import EventDetailModal from '@/components/EventDetailModal';
import ChildAutocomplete from '@/components/ChildAutocomplete';
import { useApp } from '@/context/AppContext';
import { createNotification, fetchMonthNotifications, getApiErrorMessage } from '@/lib/api';
import type { AppEvent } from '@/types';
import { formatDate, formatTime, getTodayISO } from '@/utils';

const WEEKDAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

/** Saturday-first index for ar-EG calendars (Sat=0 … Fri=6). */
function saturdayFirstWeekday(year: number, month: number, day: number) {
  const jsDay = new Date(year, month - 1, day).getDay(); // Sun=0 … Sat=6
  return (jsDay + 1) % 7;
}

type PopupState =
  | { mode: 'day'; date: string; events: AppEvent[] }
  | { mode: 'event'; event: AppEvent };

export default function EventsCalendar() {
  const router = useRouter();
  const { childList, loadChildren } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(getTodayISO());
  const [formTime, setFormTime] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formChildId, setFormChildId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonthNotifications(y, m);
      setEvents(data);
    } catch (err) {
      setEvents([]);
      setError(getApiErrorMessage(err, 'تعذّر تحميل أحداث الشهر'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(year, month).catch(() => undefined);
  }, [year, month, loadMonth]);

  useEffect(() => {
    if (childList.length === 0) {
      loadChildren().catch(() => undefined);
    }
  }, [childList.length, loadChildren]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AppEvent[]>();
    for (const ev of events) {
      if (!ev.eventDate) continue;
      const list = map.get(ev.eventDate) ?? [];
      list.push(ev);
      map.set(ev.eventDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.eventTime ?? '99:99').localeCompare(b.eventTime ?? '99:99'));
    }
    return map;
  }, [events]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = saturdayFirstWeekday(year, month, 1);
  const today = getTodayISO();

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const openDay = (date: string, dayEvents: AppEvent[]) => {
    if (dayEvents.length === 0) return;
    if (dayEvents.length === 1) {
      setPopup({ mode: 'event', event: dayEvents[0] });
      return;
    }
    setPopup({ mode: 'day', date, events: dayEvents });
  };

  const openEvent = (ev: AppEvent, e: MouseEvent) => {
    e.stopPropagation();
    setPopup({ mode: 'event', event: ev });
  };

  const closePopup = () => setPopup(null);

  const openAddModal = (prefillDate?: string) => {
    setFormTitle('');
    setFormDate(prefillDate ?? today);
    setFormTime('');
    setFormMessage('');
    setFormChildId('');
    setFormError(null);
    setAddOpen(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setAddOpen(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) {
      setFormError('العنوان مطلوب');
      return;
    }
    if (!formDate) {
      setFormError('التاريخ مطلوب');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const created = await createNotification({
        title: formTitle.trim(),
        notificationDate: formDate,
        eventTime: formTime.trim() || null,
        message: formMessage.trim() || undefined,
        childId: formChildId || undefined,
      });
      setAddOpen(false);

      const [createdYear, createdMonth] = formDate.split('-').map(Number);
      if (createdYear === year && createdMonth === month) {
        setEvents((prev) =>
          [...prev, created].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
        );
      } else {
        setYear(createdYear);
        setMonth(createdMonth);
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'تعذّر إضافة الحدث'));
    } finally {
      setSaving(false);
    }
  };

  const cells: Array<{ day: number | null; date: string | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: toISODate(year, month, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null });

  const selectedEvent = popup?.mode === 'event' ? popup.event : null;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>الأحداث</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>عرض شهري للمواعيد والفعاليات</p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, alignSelf: 'flex-start' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> إضافة حدث
        </button>
      </div>

      <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--color-warm-border)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={goNext}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            الشهر التالي ←
          </button>
          <div style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text)' }}>
            {monthLabel(year, month)}
          </div>
          <button
            type="button"
            onClick={goPrev}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            → الشهر السابق
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 20px', background: 'var(--color-surface)', color: 'var(--color-danger, #8A4A4A)', fontSize: 13, borderBottom: '1px solid var(--color-warm-border)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-warm-border)', background: 'var(--color-surface)' }}>
          {WEEKDAYS.map((label) => (
            <div key={label} style={{ padding: '10px 6px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {label}
            </div>
          ))}
        </div>

        {loading && events.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>جاري تحميل الأحداث…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((cell, idx) => {
              if (!cell.date || cell.day == null) {
                return <div key={`empty-${idx}`} style={{ minHeight: 96, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-warm-border)', borderLeft: '1px solid var(--color-warm-border)' }} />;
              }

              const dayEvents = eventsByDate.get(cell.date) ?? [];
              const isToday = cell.date === today;
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={cell.date}
                  role={hasEvents ? 'button' : undefined}
                  tabIndex={hasEvents ? 0 : undefined}
                  onClick={() => openDay(cell.date!, dayEvents)}
                  onKeyDown={(e) => {
                    if (hasEvents && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      openDay(cell.date!, dayEvents);
                    }
                  }}
                  style={{
                    minHeight: 108,
                    padding: 8,
                    borderBottom: '1px solid var(--color-warm-border)',
                    borderLeft: '1px solid var(--color-warm-border)',
                    background: isToday ? 'var(--color-teal-pale)' : 'var(--color-card)',
                    cursor: hasEvents ? 'pointer' : 'default',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#fff' : 'var(--color-text-soft)',
                    background: isToday ? 'var(--color-teal)' : 'transparent',
                    marginBottom: 6,
                  }}>
                    {cell.day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => openEvent(ev, e)}
                        title={ev.title}
                        style={{
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 6px',
                          textAlign: 'right',
                          fontSize: 11,
                          lineHeight: 1.3,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          background: ev.isRead ? 'var(--color-surface)' : 'var(--color-teal)',
                          color: ev.isRead ? 'var(--color-text-soft)' : '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: ev.isRead ? 0.85 : 1,
                        }}
                      >
                        {ev.eventTime ? `${formatTime(ev.eventTime)} · ${ev.title}` : ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', paddingInline: 4 }}>
                        +{dayEvents.length - 3} أخرى
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={closeAddModal} title="إضافة حدث" width={500}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>العنوان *</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="مثال: اجتماع الكنيسة"
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>تاريخ الإشعار *</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الوقت (اختياري)</label>
          <input
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>التفاصيل (اختياري)</label>
          <textarea
            value={formMessage}
            onChange={(e) => setFormMessage(e.target.value)}
            placeholder="وصف الحدث أو الموعد…"
            rows={3}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الابن (اختياري)</label>
          <ChildAutocomplete
            options={childList}
            value={formChildId}
            onChange={setFormChildId}
            disabled={saving}
            placeholder="ابحث باسم الابن…"
          />
        </div>
        {formError && (
          <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger, #8A4A4A)' }}>{formError}</div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            onClick={closeAddModal}
            disabled={saving}
            style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !formTitle.trim() || !formDate}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: saving || !formTitle.trim() || !formDate ? 0.5 : 1 }}
          >
            {saving ? '…جاري الحفظ' : 'حفظ الحدث'}
          </button>
        </div>
      </Modal>

      <Modal
        open={popup?.mode === 'day'}
        onClose={closePopup}
        title={popup?.mode === 'day' ? `أحداث ${formatDate(popup.date)}` : 'أحداث اليوم'}
        width={480}
      >
        {popup?.mode === 'day' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {popup.events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setPopup({ mode: 'event', event: ev })}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'right',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--color-warm-border)',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{ev.title}</div>
                {ev.eventTime && (
                  <div style={{ fontSize: 12, color: 'var(--color-teal)', fontWeight: 600, marginBottom: 2 }}>{formatTime(ev.eventTime)}</div>
                )}
                {ev.message && <div style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>{ev.message}</div>}
              </button>
            ))}
          </div>
        )}
      </Modal>

      <EventDetailModal
        open={popup?.mode === 'event'}
        event={selectedEvent}
        childList={childList}
        onClose={closePopup}
        onUpdated={(updated) => {
          setEvents((prev) =>
            prev
              .map((ev) => (ev.id === updated.id ? updated : ev))
              .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
          );
          setPopup({ mode: 'event', event: updated });
          const [y, m] = updated.eventDate.split('-').map(Number);
          if (y !== year || m !== month) {
            setYear(y);
            setMonth(m);
            closePopup();
          }
        }}
        onDeleted={(eventId) => {
          setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
          closePopup();
        }}
        onNavigateToChild={(id) => {
          closePopup();
          router.push(`/children/${id}`);
        }}
      />
    </div>
  );
}
