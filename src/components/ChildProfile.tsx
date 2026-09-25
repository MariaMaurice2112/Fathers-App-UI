'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppEvent, Child, OperationTypeLabel } from '@/types';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import { createNotification, fetchChildEvents, getApiErrorMessage } from '@/lib/api';
import { OPERATION_TYPE_FROM_API, OPERATION_TYPE_TO_API } from '@/lib/api/mappers';
import {
  composeTrainingNote,
  formatDate,
  formatEgyptianPhoneDisplay,
  formatTime,
  getAge,
  getDaysDiff,
  getTodayISO,
  normalizeEgyptianPhone,
  OPERATION_TYPE_ICONS,
  OPERATION_TYPE_LABELS,
  parseTrainingNote,
  toISODateTime,
  TRAINING_BIBLE_OPTIONS,
  TRAINING_PRAYER_OPTIONS,
} from '@/utils';

interface ChildProfileProps {
  child: Child;
  saving?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (childId: string) => Promise<void>;
  onAddOperation: (childId: string, type: string, operationDate: string, note?: string) => Promise<void>;
  onEditOperation: (
    childId: string,
    operationId: string,
    type: string,
    operationDate: string,
    note?: string
  ) => Promise<void>;
  onDeleteOperation: (childId: string, operationId: string) => Promise<void>;
  onAddConfession: (childId: string, confessionAt: string, notes?: string) => Promise<void>;
}

export default function ChildProfile({
  child,
  saving = false,
  onBack,
  onEdit,
  onDelete,
  onAddOperation,
  onEditOperation,
  onDeleteOperation,
  onAddConfession,
}: ChildProfileProps) {
  const [operationModal, setOperationModal] = useState(false);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);
  const [preservedApiType, setPreservedApiType] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [deleteOperationModal, setDeleteOperationModal] = useState(false);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);
  const [deleteOperationError, setDeleteOperationError] = useState<string | null>(null);
  const [deletingOperation, setDeletingOperation] = useState(false);
  const [confessionModal, setConfessionModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [trainingPrayers, setTrainingPrayers] = useState<string[]>([]);
  const [trainingBible, setTrainingBible] = useState<string[]>([]);
  const [trainingOther, setTrainingOther] = useState('');
  const [operationDate, setOperationDate] = useState(getTodayISO());
  const [operationType, setOperationType] = useState<OperationTypeLabel>('مخصص');
  const [confessionDate, setConfessionDate] = useState(getTodayISO());
  const [confessionNotes, setConfessionNotes] = useState('');
  const [confessionError, setConfessionError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(getTodayISO());
  const [eventTime, setEventTime] = useState('');
  const [eventMessage, setEventMessage] = useState('');
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [childEvents, setChildEvents] = useState<AppEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const age = child.birthday ? getAge(child.birthday) : null;
  const confessionDays = child.latestConfessionAt ? getDaysDiff(child.latestConfessionAt) : null;
  const overdueConfession = child.needsConfession;
  const busy = saving || eventSaving || deleting || deletingOperation;

  const operationPendingDelete = deletingOperationId
    ? child.operations.find((op) => op.id === deletingOperationId)
    : undefined;

  const loadChildEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const events = await fetchChildEvents(child.id);
      setChildEvents(events);
    } catch (err) {
      setEventsError(getApiErrorMessage(err, 'تعذّر تحميل الأحداث'));
    } finally {
      setEventsLoading(false);
    }
  }, [child.id]);

  useEffect(() => {
    void loadChildEvents();
  }, [loadChildEvents]);

  const confessions = [...child.confessions]
    .map((c) => ({
      date: c.confessionAt,
      label: 'اعتراف',
      text: c.notes ?? 'تسجيل اعتراف',
      icon: '⛪',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const notes = [...child.operations]
    .map((op) => {
      const typeLabel = OPERATION_TYPE_FROM_API[op.type] ?? op.type;
      return {
        id: op.id,
        date: op.operationDate,
        type: op.type,
        label: typeLabel,
        text: op.note ?? typeLabel,
        icon: OPERATION_TYPE_ICONS[op.type] ?? OPERATION_TYPE_ICONS[typeLabel] ?? '📝',
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const resetOperationForm = () => {
    setEditingOperationId(null);
    setPreservedApiType(null);
    setNoteText('');
    setTrainingPrayers([]);
    setTrainingBible([]);
    setTrainingOther('');
    setOperationDate(getTodayISO());
    setOperationType('مخصص');
    setOperationError(null);
  };

  const clearTrainingFields = () => {
    setTrainingPrayers([]);
    setTrainingBible([]);
    setTrainingOther('');
  };

  const handleOperationTypeChange = (nextType: OperationTypeLabel) => {
    setOperationType(nextType);
    if (nextType !== 'تدريب') {
      clearTrainingFields();
    } else {
      setNoteText('');
    }
  };

  const toggleTrainingOption = (
    value: string,
    selected: string[],
    setSelected: (next: string[]) => void
  ) => {
    setSelected(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
    );
  };

  const openAddOperationModal = () => {
    resetOperationForm();
    setOperationModal(true);
  };

  const openEditOperationModal = (operationId: string) => {
    const op = child.operations.find((o) => o.id === operationId);
    if (!op) return;
    const mappedLabel = OPERATION_TYPE_FROM_API[op.type];
    const isKnownLabel = (OPERATION_TYPE_LABELS as string[]).includes(mappedLabel ?? '');
    const nextType = isKnownLabel ? (mappedLabel as OperationTypeLabel) : 'مخصص';
    setEditingOperationId(op.id);
    setPreservedApiType(isKnownLabel ? null : op.type);
    setOperationDate(op.operationDate.slice(0, 10));
    setOperationType(nextType);
    setOperationError(null);
    if (nextType === 'تدريب') {
      const parsed = parseTrainingNote(op.note ?? '');
      setTrainingPrayers(parsed.prayers);
      setTrainingBible(parsed.bible);
      setTrainingOther(parsed.other);
      setNoteText('');
    } else {
      setTrainingPrayers([]);
      setTrainingBible([]);
      setTrainingOther('');
      setNoteText(op.note ?? '');
    }
    setOperationModal(true);
  };

  const closeOperationModal = () => {
    if (busy) return;
    setOperationModal(false);
    resetOperationForm();
  };

  const trainingNoteValid =
    trainingPrayers.length > 0 || trainingBible.length > 0 || trainingOther.trim().length > 0;
  const operationNoteValid = operationType === 'تدريب' ? trainingNoteValid : noteText.trim().length > 0;

  const handleSaveOperation = async () => {
    if (!operationNoteValid) return;
    setOperationError(null);
    const selectedApiType = OPERATION_TYPE_TO_API[operationType] ?? 'custom';
    const apiType =
      preservedApiType && operationType === 'مخصص' ? preservedApiType : selectedApiType;
    const notePayload =
      operationType === 'تدريب'
        ? composeTrainingNote(trainingPrayers, trainingBible, trainingOther)
        : noteText.trim();
    try {
      if (editingOperationId) {
        await onEditOperation(child.id, editingOperationId, apiType, operationDate, notePayload);
      } else {
        await onAddOperation(child.id, apiType, operationDate, notePayload);
      }
      resetOperationForm();
      setOperationModal(false);
      setNotesVisible(true);
    } catch (err) {
      setOperationError(getApiErrorMessage(err, editingOperationId ? 'تعذّر تعديل الملاحظة' : 'تعذّر حفظ الملاحظة'));
    }
  };

  const openDeleteOperationModal = (operationId: string) => {
    setDeletingOperationId(operationId);
    setDeleteOperationError(null);
    setDeleteOperationModal(true);
  };

  const closeDeleteOperationModal = () => {
    if (deletingOperation) return;
    setDeleteOperationModal(false);
    setDeletingOperationId(null);
    setDeleteOperationError(null);
  };

  const handleConfirmDeleteOperation = async () => {
    if (!deletingOperationId) return;
    setDeletingOperation(true);
    setDeleteOperationError(null);
    try {
      await onDeleteOperation(child.id, deletingOperationId);
      setDeleteOperationModal(false);
      setDeletingOperationId(null);
      setNotesVisible(true);
    } catch (err) {
      setDeleteOperationError(getApiErrorMessage(err, 'تعذّر حذف الملاحظة'));
    } finally {
      setDeletingOperation(false);
    }
  };

  const openConfessionModal = () => {
    setConfessionDate(getTodayISO());
    setConfessionNotes('');
    setConfessionError(null);
    setConfessionModal(true);
  };

  const closeConfessionModal = () => {
    if (busy) return;
    setConfessionModal(false);
    setConfessionError(null);
  };

  const handleSaveConfession = async () => {
    setConfessionError(null);
    try {
      await onAddConfession(child.id, toISODateTime(confessionDate), confessionNotes.trim() || undefined);
      setConfessionNotes('');
      setConfessionDate(getTodayISO());
      setConfessionModal(false);
    } catch (err) {
      setConfessionError(getApiErrorMessage(err, 'تعذّر تسجيل الاعتراف'));
    }
  };

  const openEventModal = () => {
    setEventTitle('');
    setEventDate(getTodayISO());
    setEventTime('');
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
      const created = await createNotification({
        title: eventTitle.trim(),
        notificationDate: eventDate,
        eventTime: eventTime.trim() || null,
        message: eventMessage.trim() || undefined,
        childId: child.id,
      });
      setChildEvents((prev) =>
        [created, ...prev].sort(
          (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        )
      );
      setEventModal(false);
      setEventTitle('');
      setEventDate(getTodayISO());
      setEventTime('');
      setEventMessage('');
    } catch (err) {
      setEventError(getApiErrorMessage(err, 'تعذّر إضافة الحدث'));
    } finally {
      setEventSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteError(null);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(false);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(child.id);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'تعذّر حذف الابن'));
      setDeleting(false);
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
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>{child.stage}</div>
          <div className="profile-meta-grid">
            {age !== null && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">العمر</span>
                <span className="profile-meta-value">{age} سنة</span>
              </div>
            )}
            {child.birthday && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">تاريخ الميلاد</span>
                <span className="profile-meta-value">{formatDate(child.birthday)}</span>
              </div>
            )}
            <div className="profile-meta-item">
              <span className="profile-meta-label">الحالة الاجتماعية</span>
              <span className="profile-meta-value">
                {child.maritalStatus === 'married' ? 'متزوج' : 'أعزب'}
              </span>
            </div>
            {child.phoneNumber && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">رقم الهاتف</span>
                <a
                  href={`tel:${normalizeEgyptianPhone(child.phoneNumber) ?? child.phoneNumber}`}
                  className="profile-meta-value profile-meta-value--link"
                  dir="ltr"
                >
                  {formatEgyptianPhoneDisplay(child.phoneNumber)}
                </a>
              </div>
            )}
            {child.phoneNumber2 && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">رقم هاتف إضافي</span>
                <a
                  href={`tel:${normalizeEgyptianPhone(child.phoneNumber2) ?? child.phoneNumber2}`}
                  className="profile-meta-value profile-meta-value--link"
                  dir="ltr"
                >
                  {formatEgyptianPhoneDisplay(child.phoneNumber2)}
                </a>
              </div>
            )}
            {child.maritalStatus === 'married' && child.marriageDate && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">تاريخ الزواج</span>
                <span className="profile-meta-value">{formatDate(child.marriageDate)}</span>
              </div>
            )}
            {child.marriageContract && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">خلو موانع</span>
                <span className="profile-meta-value">{formatDate(child.marriageContract)}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button onClick={onEdit} disabled={busy} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>تعديل</button>
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
            <button onClick={openConfessionModal} disabled={busy} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>+ تسجيل اعتراف</button>
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

      <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', boxShadow: '0 1px 6px rgba(44,36,32,0.06)', overflow: 'hidden', marginTop: 24 }}>
        <div className="timeline-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-warm-border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>أحداث الابن</h2>
          </div>
          <button onClick={openEventModal} disabled={busy} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>+ إضافة حدث</button>
        </div>
        <div style={{ padding: '8px 0' }}>
          {eventsLoading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>جاري تحميل الأحداث…</p>
            </div>
          ) : eventsError ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', color: 'var(--color-danger)', fontSize: 14 }}>{eventsError}</p>
              <button
                type="button"
                onClick={() => void loadChildEvents()}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : childEvents.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>لا توجد أحداث مرتبطة بهذا الابن</p>
            </div>
          ) : (
            <div style={{ padding: '16px 24px' }}>
              {childEvents.map((ev, i) => (
                <div key={ev.id} style={{ display: 'flex', gap: 16, paddingBottom: i < childEvents.length - 1 ? 24 : 0, position: 'relative' }}>
                  {i < childEvents.length - 1 && (
                    <div style={{ position: 'absolute', right: 15, top: 28, bottom: 0, width: 1, background: 'var(--color-warm-border)' }} />
                  )}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-teal-pale)', border: '2px solid var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                    📅
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(ev.eventDate)}</span>
                      {ev.eventTime && (
                        <span style={{ fontSize: 12, color: 'var(--color-teal)', fontWeight: 600 }}>{formatTime(ev.eventTime)}</span>
                      )}
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: 'var(--color-teal-pale)', color: 'var(--color-teal)' }}>حدث</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 600, lineHeight: 1.5 }}>{ev.title}</div>
                    {ev.message && (
                      <div style={{ fontSize: 13, color: 'var(--color-text-soft)', lineHeight: 1.5, marginTop: 4 }}>{ev.message}</div>
                    )}
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
              <button onClick={openAddOperationModal} disabled={busy} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>+ إضافة ملاحظة</button>
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
                  <div key={ev.id} style={{ display: 'flex', gap: 16, paddingBottom: i < notes.length - 1 ? 24 : 0, position: 'relative' }}>
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
                        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openEditOperationModal(ev.id)}
                            disabled={busy}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: '1.5px solid var(--color-warm-border)',
                              background: 'transparent',
                              color: 'var(--color-text-soft)',
                              fontSize: 12,
                              cursor: busy ? 'default' : 'pointer',
                              fontFamily: 'var(--font-body)',
                              fontWeight: 600,
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteOperationModal(ev.id)}
                            disabled={busy}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: '1.5px solid rgba(163,58,58,0.35)',
                              background: 'transparent',
                              color: 'var(--color-danger)',
                              fontSize: 12,
                              cursor: busy ? 'default' : 'pointer',
                              fontFamily: 'var(--font-body)',
                              fontWeight: 600,
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{ev.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-warm-border)', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={openDeleteModal}
          disabled={busy}
          style={{
            padding: '11px 28px',
            borderRadius: 10,
            border: '1.5px solid rgba(163,58,58,0.35)',
            background: 'transparent',
            color: 'var(--color-danger)',
            fontSize: 14,
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            opacity: busy ? 0.6 : 1,
          }}
        >
          حذف الابن
        </button>
      </div>

      <Modal open={operationModal} onClose={closeOperationModal} title={editingOperationId ? 'تعديل ملاحظة رعوية' : 'إضافة ملاحظة رعوية'} width={500}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>نوع الملاحظة</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {OPERATION_TYPE_LABELS.map((t) => (
              <button key={t} type="button" onClick={() => handleOperationTypeChange(t)}
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
        {operationType === 'تدريب' ? (
          <div style={{ marginBottom: operationError ? 12 : 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 8 }}>الصلوات</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TRAINING_PRAYER_OPTIONS.map((option) => (
                  <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={trainingPrayers.includes(option)}
                      onChange={() => toggleTrainingOption(option, trainingPrayers, setTrainingPrayers)}
                      style={{ accentColor: 'var(--color-teal)', width: 15, height: 15 }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 8 }}>الكتاب المقدس</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TRAINING_BIBLE_OPTIONS.map((option) => (
                  <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={trainingBible.includes(option)}
                      onChange={() => toggleTrainingOption(option, trainingBible, setTrainingBible)}
                      style={{ accentColor: 'var(--color-teal)', width: 15, height: 15 }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>اخرى</label>
              <textarea
                value={trainingOther}
                onChange={(e) => setTrainingOther(e.target.value)}
                placeholder="أضف ملاحظات أخرى…"
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: operationError ? 12 : 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الملاحظة *</label>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="أضف ملاحظتك الرعوية هنا…" rows={4}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
          </div>
        )}
        {operationError && (
          <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: 'rgba(163,58,58,0.08)', color: 'var(--color-danger)', fontSize: 13 }}>
            {operationError}
          </div>
        )}
        <div className="modal-actions">
          <button onClick={closeOperationModal} disabled={busy} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
          <button onClick={handleSaveOperation} disabled={!operationNoteValid || busy} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: operationNoteValid && !busy ? 1 : 0.5 }}>
            {busy ? '…جاري الحفظ' : editingOperationId ? 'حفظ التعديلات' : 'حفظ الملاحظة'}
          </button>
        </div>
      </Modal>

      <Modal open={confessionModal} onClose={closeConfessionModal} title="تسجيل اعتراف" width={500}>
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
        {confessionError && (
          <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger, #8A4A4A)' }}>{confessionError}</div>
        )}
        <div className="modal-actions">
          <button onClick={closeConfessionModal} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
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
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الوقت (اختياري)</label>
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
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

      <Modal open={deleteModal} onClose={closeDeleteModal} title="حذف الابن" width={440}>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
          هل أنت متأكد من حذف <strong>{child.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        {deleteError && (
          <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger)' }}>{deleteError}</div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={deleting}
            style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleting}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-danger)', color: '#fff', fontSize: 13, cursor: deleting ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? '…جاري الحذف' : 'تأكيد الحذف'}
          </button>
        </div>
      </Modal>

      <Modal open={deleteOperationModal} onClose={closeDeleteOperationModal} title="حذف الملاحظة" width={440}>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
          هل أنت متأكد من حذف هذه الملاحظة؟
          {operationPendingDelete?.note ? (
            <>
              {' '}
              <strong>«{operationPendingDelete.note}»</strong>
            </>
          ) : null}
          {' '}لا يمكن التراجع عن هذا الإجراء.
        </p>
        {deleteOperationError && (
          <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger)' }}>{deleteOperationError}</div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            onClick={closeDeleteOperationModal}
            disabled={deletingOperation}
            style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteOperation}
            disabled={deletingOperation}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-danger)', color: '#fff', fontSize: 13, cursor: deletingOperation ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: deletingOperation ? 0.7 : 1 }}
          >
            {deletingOperation ? '…جاري الحذف' : 'تأكيد الحذف'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
