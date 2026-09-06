'use client';

import { useState } from 'react';
import type { Child, OperationTypeLabel } from '@/types';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import { createNotification, getApiErrorMessage } from '@/lib/api';
import { OPERATION_TYPE_TO_API } from '@/lib/api/mappers';
import {
  formatDate,
  getAge,
  getDaysDiff,
  getTodayISO,
  OPERATION_TYPE_ICONS,
  OPERATION_TYPE_LABELS,
  toISODateTime,
} from '@/utils';

interface ChildProfileProps {
  child: Child;
  saving?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAddOperation: (childId: string, type: string, operationDate: string, note?: string) => Promise<void>;
  onAddConfession: (childId: string, confessionAt: string, notes?: string) => Promise<void>;
}

export default function ChildProfile({
  child,
  saving = false,
  onBack,
  onEdit,
  onAddOperation,
  onAddConfession,
}: ChildProfileProps) {
  const [operationModal, setOperationModal] = useState(false);
  const [confessionModal, setConfessionModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [operationDate, setOperationDate] = useState(getTodayISO());
  const [operationType, setOperationType] = useState<OperationTypeLabel>('مخصص');
  const [confessionDate, setConfessionDate] = useState(getTodayISO());
  const [confessionNotes, setConfessionNotes] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(getTodayISO());
  const [eventMessage, setEventMessage] = useState('');
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const age = child.birthday ? getAge(child.birthday) : null;
  const confessionDays = child.latestConfessionAt ? getDaysDiff(child.latestConfessionAt) : null;
  const overdueConfession = child.needsConfession;
  const busy = saving || eventSaving;

  const confessions = [...child.confessions]
    .map((c) => ({
      date: c.confessionAt,
      label: 'اعتراف',
      text: c.notes ?? 'تسجيل اعتراف',
      icon: '⛪',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const notes = [...child.operations]
    .map((op) => ({
      date: op.operationDate,
      label: op.type,
      text: op.note ?? op.type,
      icon: OPERATION_TYPE_ICONS[op.type] ?? '📝',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveOperation = async () => {
    if (!noteText.trim()) return;
    const apiType = OPERATION_TYPE_TO_API[operationType] ?? 'custom';
    await onAddOperation(child.id, apiType, operationDate, noteText.trim());
    setNoteText('');
    setOperationDate(getTodayISO());
    setOperationType('مخصص');
    setOperationModal(false);
    setNotesVisible(true);
  };

  const handleSaveConfession = async () => {
    await onAddConfession(child.id, toISODateTime(confessionDate), confessionNotes.trim() || undefined);
    setConfessionNotes('');
    setConfessionDate(getTodayISO());
    setConfessionModal(false);
  };

  const openEventModal = () => {
    setEventTitle('');
    setEventDate(getTodayISO());
    setEventMessage('');
    setEventError(null);
    setEventModal(true);
  };

  const closeEventModal = () => {
    if (eventSaving) return;
    setEventModal(false);
    setEventError(null);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) {
      setEventError('العنوان مطلوب');
      return;
    }
    if (!eventDate) {
      setEventError('التاريخ مطلوب');
      return;
    }

    setEventSaving(true);
    setEventError(null);
    try {
      await createNotification({
        title: eventTitle.trim(),
        notificationDate: eventDate,
        message: eventMessage.trim() || undefined,
        childId: child.id,
      });
      setEventModal(false);
      setEventTitle('');
      setEventDate(getTodayISO());
      setEventMessage('');
    } catch (err) {
      setEventError(getApiErrorMessage(err, 'تعذّر إضافة الحدث'));
    } finally {
      setEventSaving(false);
    }
  };

  return (
    <div className="page-shell page-shell--narrow">
      <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-teal)', fontSize: 14, fontFamily: 'var(--font-body)', marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        → العودة إلى القائمة
      </button>

      <div className="profile-header-card" style={{ background: 'var(--color-card)', borderRadius: 20, border: '1px solid var(--color-warm-border)', boxShadow: '0 2px 12px rgba(44,36,32,0.07)', padding: 28, marginBottom: 24 }}>
        <Avatar child={child} size={72} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(20px, 4vw, 24px)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>{child.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>{child.stage}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
            {age !== null && <div><span style={{ color: 'var(--color-text-muted)' }}>العمر: </span><span style={{ color: 'var(--color-text-soft)', fontWeight: 500 }}>{age} سنة</span></div>}
            {child.birthday && <div><span style={{ color: 'var(--color-text-muted)' }}>تاريخ الميلاد: </span><span style={{ color: 'var(--color-text-soft)', fontWeight: 500 }}>{formatDate(child.birthday)}</span></div>}
            {child.marriageContract && <div><span style={{ color: 'var(--color-text-muted)' }}>عقد زواج: </span><span style={{ color: 'var(--color-text-soft)', fontWeight: 500 }}>{formatDate(child.marriageContract)}</span></div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>تعديل</button>
          <button
            onClick={openEventModal}
            disabled={busy}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            + إضافة حدث
          </button>
        </div>
      </div>

      <div className="three-col-grid">
        <div style={{ background: overdueConfession ? 'var(--color-danger-pale)' : 'var(--color-card)', borderRadius: 14, border: `1px solid ${overdueConfession ? 'rgba(163,58,58,0.2)' : 'var(--color-warm-border)'}`, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: overdueConfession ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>آخر اعتراف</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: overdueConfession ? 'var(--color-danger)' : 'var(--color-text)' }}>
            {child.latestConfessionAt ? formatDate(child.latestConfessionAt) : 'غير محدد'}
          </div>
          {confessionDays !== null && <div style={{ fontSize: 12, color: overdueConfession ? 'var(--color-danger)' : 'var(--color-text-muted)', marginTop: 2 }}>منذ {confessionDays} يوم</div>}
        </div>
        <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-warm-border)', padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>سجل الاعتراف</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-teal)', fontFamily: 'var(--font-display)' }}>{child.confessions.length}</div>
        </div>
        <button
          type="button"
          onClick={() => setNotesVisible((v) => !v)}
          style={{ background: notesVisible ? 'var(--color-teal-pale)' : 'var(--color-card)', borderRadius: 14, border: `1px solid ${notesVisible ? 'var(--color-teal)' : 'var(--color-warm-border)'}`, padding: '18px 20px', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit' }}
        >
          <div style={{ fontSize: 11, color: notesVisible ? 'var(--color-teal)' : 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>الملاحظات الرعوية 📝</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-teal)', fontFamily: 'var(--font-display)' }}>{child.operations.length}</div>
        </button>
      </div>

      <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden', marginTop: 24 }}>
        <div className="timeline-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-warm-border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>سجل الاعتراف</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setNotesVisible((v) => !v)}
              aria-label={notesVisible ? 'إخفاء الملاحظات' : 'إظهار الملاحظات'}
              title={notesVisible ? 'إخفاء الملاحظات' : 'إظهار الملاحظات'}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1.5px solid ${notesVisible ? 'var(--color-teal)' : 'var(--color-warm-border)'}`,
                background: notesVisible ? 'var(--color-teal-pale)' : 'transparent',
                color: notesVisible ? 'var(--color-teal)' : 'var(--color-text-soft)',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              📝
              {notes.length > 0 && (
                <span style={{ position: 'absolute', top: -4, left: -4, minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-teal)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {notes.length}
                </span>
              )}
            </button>
            <button onClick={() => setConfessionModal(true)} disabled={busy} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>+ تسجيل اعتراف</button>
          </div>
        </div>
        <div style={{ padding: '8px 0' }}>
          {confessions.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⛪</div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>لا توجد اعترافات مسجّلة بعد</p>
            </div>
          ) : (
            <div style={{ padding: '16px 24px' }}>
              {confessions.map((ev, i) => (
                <div key={`confession-${ev.date}-${i}`} style={{ display: 'flex', gap: 16, paddingBottom: i < confessions.length - 1 ? 24 : 0, position: 'relative' }}>
                  {i < confessions.length - 1 && (
                    <div style={{ position: 'absolute', right: 15, top: 28, bottom: 0, width: 1, background: 'var(--color-warm-border)' }} />
                  )}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-success-pale)', border: '2px solid var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                    {ev.icon}
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(ev.date)}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: 'var(--color-success-pale)', color: 'var(--color-success)' }}>{ev.label}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{ev.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {notesVisible && (
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden', marginTop: 24 }}>
          <div className="timeline-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-warm-border)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>الملاحظات الرعوية</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setNotesVisible(false)}
                aria-label="إخفاء الملاحظات"
                title="إخفاء الملاحظات"
                style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
              <button onClick={() => setOperationModal(true)} disabled={busy} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>+ إضافة ملاحظة</button>
            </div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {notes.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>لا توجد ملاحظات بعد</p>
              </div>
            ) : (
              <div style={{ padding: '16px 24px' }}>
                {notes.map((ev, i) => (
                  <div key={`note-${ev.date}-${i}`} style={{ display: 'flex', gap: 16, paddingBottom: i < notes.length - 1 ? 24 : 0, position: 'relative' }}>
                    {i < notes.length - 1 && (
                      <div style={{ position: 'absolute', right: 15, top: 28, bottom: 0, width: 1, background: 'var(--color-warm-border)' }} />
                    )}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-teal-pale)', border: '2px solid var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                      {ev.icon}
                    </div>
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(ev.date)}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: 'var(--color-teal-pale)', color: 'var(--color-teal)' }}>{ev.label}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{ev.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={operationModal} onClose={() => setOperationModal(false)} title="إضافة ملاحظة رعوية" width={500}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>نوع الملاحظة</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {OPERATION_TYPE_LABELS.map((t) => (
              <button key={t} onClick={() => setOperationType(t)}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${operationType === t ? 'var(--color-teal)' : 'var(--color-warm-border)'}`, background: operationType === t ? 'var(--color-teal-pale)' : 'transparent', color: operationType === t ? 'var(--color-teal)' : 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: operationType === t ? 600 : 400 }}>
                {OPERATION_TYPE_ICONS[OPERATION_TYPE_TO_API[t] ?? 'custom']} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>التاريخ *</label>
          <input type="date" value={operationDate} onChange={(e) => setOperationDate(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الملاحظة *</label>
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="أضف ملاحظتك الرعوية هنا…" rows={4}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
        </div>
        <div className="modal-actions">
          <button onClick={() => setOperationModal(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
          <button onClick={handleSaveOperation} disabled={!noteText.trim() || busy} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: noteText.trim() && !busy ? 1 : 0.5 }}>حفظ الملاحظة</button>
        </div>
      </Modal>

      <Modal open={confessionModal} onClose={() => setConfessionModal(false)} title="تسجيل اعتراف" width={500}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>تاريخ الاعتراف *</label>
          <input type="date" value={confessionDate} onChange={(e) => setConfessionDate(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>ملاحظات (اختياري)</label>
          <textarea value={confessionNotes} onChange={(e) => setConfessionNotes(e.target.value)} placeholder="ملاحظات عن الاعتراف…" rows={3}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
        </div>
        <div className="modal-actions">
          <button onClick={() => setConfessionModal(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
          <button onClick={handleSaveConfession} disabled={busy} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>حفظ الاعتراف</button>
        </div>
      </Modal>

      <Modal open={eventModal} onClose={closeEventModal} title={`إضافة حدث — ${child.name}`} width={500}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الابن</label>
          <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-warm-border)', fontSize: 13, color: 'var(--color-text)', fontWeight: 600 }}>
            {child.name}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>العنوان *</label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="مثال: زيارة رعوية"
            disabled={eventSaving}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>تاريخ الإشعار *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={eventSaving}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>التفاصيل (اختياري)</label>
          <textarea
            value={eventMessage}
            onChange={(e) => setEventMessage(e.target.value)}
            placeholder="وصف الحدث أو الموعد…"
            rows={3}
            disabled={eventSaving}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
          />
        </div>
        {eventError && (
          <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger, #8A4A4A)' }}>{eventError}</div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            onClick={closeEventModal}
            disabled={eventSaving}
            style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSaveEvent}
            disabled={eventSaving || !eventTitle.trim() || !eventDate}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: eventSaving || !eventTitle.trim() || !eventDate ? 0.5 : 1 }}
          >
            {eventSaving ? '…جاري الحفظ' : 'حفظ الحدث'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
