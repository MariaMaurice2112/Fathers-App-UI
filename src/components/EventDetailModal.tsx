'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import ChildAutocomplete from '@/components/ChildAutocomplete';
import { deleteNotification, getApiErrorMessage, updateNotification } from '@/lib/api';
import type { AppEvent, Child } from '@/types';
import { formatDate, formatTime } from '@/utils';

type ModalMode = 'view' | 'edit' | 'delete';

interface EventDetailModalProps {
  open: boolean;
  event: AppEvent | null;
  childList: Child[];
  onClose: () => void;
  onUpdated: (event: AppEvent) => void;
  onDeleted: (eventId: string) => void;
  onNavigateToChild?: (childId: string) => void;
}

export default function EventDetailModal({
  open,
  event,
  childList,
  onClose,
  onUpdated,
  onDeleted,
  onNavigateToChild,
}: EventDetailModalProps) {
  const [mode, setMode] = useState<ModalMode>('view');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [childId, setChildId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !event) return;
    setMode('view');
    setTitle(event.title);
    setDate(event.eventDate);
    setTime(event.eventTime ?? '');
    setMessage(event.message ?? '');
    setChildId(event.childId ?? '');
    setError(null);
    setBusy(false);
  }, [open, event]);

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleSave = async () => {
    if (!event) return;
    if (!title.trim()) {
      setError('العنوان مطلوب');
      return;
    }
    if (!date) {
      setError('التاريخ مطلوب');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const updated = await updateNotification(event.id, {
        title: title.trim(),
        notificationDate: date,
        eventTime: time.trim() || null,
        message: message.trim() || null,
        childId: childId || null,
      });
      onUpdated(updated);
      setMode('view');
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر تحديث الحدث'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setBusy(true);
    setError(null);
    try {
      await deleteNotification(event.id);
      onDeleted(event.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حذف الحدث'));
      setBusy(false);
    }
  };

  const modalTitle =
    mode === 'edit' ? 'تعديل الحدث' : mode === 'delete' ? 'حذف الحدث' : (event?.title ?? 'تفاصيل الحدث');

  return (
    <Modal open={open && !!event} onClose={handleClose} title={modalTitle} width={500}>
      {event && mode === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>العنوان</div>
            <div style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 600 }}>{event.title}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>التاريخ</div>
            <div style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 600 }}>{formatDate(event.eventDate)}</div>
          </div>
          {event.eventTime && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>الوقت</div>
              <div style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 600 }}>{formatTime(event.eventTime)}</div>
            </div>
          )}
          {event.message && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>التفاصيل</div>
              <div style={{ fontSize: 14, color: 'var(--color-text-soft)', lineHeight: 1.6 }}>{event.message}</div>
            </div>
          )}
          {(event.childName || event.childId) && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>الابن</div>
              {event.childId && onNavigateToChild ? (
                <button
                  type="button"
                  onClick={() => onNavigateToChild(event.childId!)}
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: 14, color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {event.childName ?? 'عرض الملف'} ←
                </button>
              ) : (
                <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{event.childName ?? '—'}</div>
              )}
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('delete');
              }}
              style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(163,58,58,0.35)', background: 'transparent', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              حذف
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(event.title);
                setDate(event.eventDate);
                setTime(event.eventTime ?? '');
                setMessage(event.message ?? '');
                setChildId(event.childId ?? '');
                setError(null);
                setMode('edit');
              }}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              تعديل
            </button>
          </div>
        </div>
      )}

      {event && mode === 'edit' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>العنوان *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              placeholder="مثال: اجتماع الكنيسة"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>تاريخ الإشعار *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الوقت (اختياري)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={busy}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, background: 'var(--color-cream)', outline: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>التفاصيل (اختياري)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder="وصف الحدث أو الموعد…"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>الابن (اختياري)</label>
            <ChildAutocomplete
              options={childList}
              value={childId}
              onChange={setChildId}
              disabled={busy}
              placeholder="ابحث باسم الابن…"
            />
          </div>
          {error && (
            <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger)' }}>{error}</div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                if (busy) return;
                setError(null);
                setMode('view');
              }}
              disabled={busy}
              style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !title.trim() || !date}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: busy || !title.trim() || !date ? 0.5 : 1 }}
            >
              {busy ? '…جاري الحفظ' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      )}

      {event && mode === 'delete' && (
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
            هل أنت متأكد من حذف <strong>{event.title}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          {error && (
            <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-danger)' }}>{error}</div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                if (busy) return;
                setError(null);
                setMode('view');
              }}
              disabled={busy}
              style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--color-danger)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: busy ? 0.5 : 1 }}
            >
              {busy ? '…جاري الحذف' : 'تأكيد الحذف'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
