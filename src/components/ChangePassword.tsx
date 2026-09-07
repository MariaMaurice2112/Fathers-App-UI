'use client';

import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/api/invoke';

interface ChangePasswordProps {
  saving?: boolean;
  onSubmit: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--color-warm-border)',
  borderRadius: 10,
  fontSize: 14,
  color: 'var(--color-text)',
  background: 'var(--color-cream)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.15s',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 6 }}>
        {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function localizePasswordError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('current password is incorrect')) return 'كلمة المرور الحالية غير صحيحة';
  if (lower.includes('at least 6')) return 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل';
  if (lower.includes('current_password') && lower.includes('new_password')) {
    return 'يرجى إدخال كلمة المرور الحالية والجديدة';
  }
  if (lower.includes('unauthorized')) return 'انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى';
  return message;
}

export default function ChangePassword({ saving = false, onSubmit, onCancel }: ChangePasswordProps) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | 'form', string>>>({});
  const [success, setSuccess] = useState('');

  const set = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
    setSuccess('');
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.currentPassword) errs.currentPassword = 'كلمة المرور الحالية مطلوبة';
    if (!form.newPassword) errs.newPassword = 'كلمة المرور الجديدة مطلوبة';
    else if (form.newPassword.length < 6) errs.newPassword = 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل';
    if (!form.confirmPassword) errs.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    else if (form.newPassword && form.confirmPassword !== form.newPassword) {
      errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }
    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
      errs.newPassword = 'كلمة المرور الجديدة يجب أن تختلف عن الحالية';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSuccess('');
    try {
      await onSubmit({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('تم تغيير كلمة المرور بنجاح');
    } catch (err) {
      const message = localizePasswordError(getApiErrorMessage(err, 'فشل تغيير كلمة المرور'));
      setErrors({ form: message });
    }
  };

  const inputProps = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
    style: { ...inputStyle, borderColor: errors[key] ? 'var(--color-danger)' : 'var(--color-warm-border)' },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = 'var(--color-teal)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = errors[key] ? 'var(--color-danger)' : 'var(--color-warm-border)';
    },
  });

  return (
    <div className="page-shell page-shell--form">
      <button
        type="button"
        onClick={onCancel}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--color-teal)',
          fontSize: 14,
          fontFamily: 'var(--font-body)',
          marginBottom: 20,
          padding: 0,
        }}
      >
        → العودة
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            fontWeight: 700,
          }}
        >
          تغيير كلمة المرور
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'var(--color-card)',
            borderRadius: 16,
            border: '1px solid var(--color-warm-border)',
            padding: 24,
            marginBottom: 28,
            boxShadow: '0 1px 6px rgba(44,36,32,0.05)',
          }}
        >
          <h2
            style={{
              margin: '0 0 20px',
              fontSize: 16,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
              fontWeight: 700,
              paddingBottom: 12,
              borderBottom: '1px solid var(--color-warm-border)',
            }}
          >
            بيانات كلمة المرور
          </h2>

          {errors.form && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(180,60,60,0.08)',
                border: '1px solid rgba(180,60,60,0.25)',
                color: 'var(--color-danger)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {errors.form}
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(26,95,95,0.08)',
                border: '1px solid rgba(26,95,95,0.25)',
                color: 'var(--color-teal)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="كلمة المرور الحالية" required>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={saving}
                {...inputProps('currentPassword')}
              />
              {errors.currentPassword && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.currentPassword}</p>
              )}
            </Field>

            <Field label="كلمة المرور الجديدة" required>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={saving}
                {...inputProps('newPassword')}
              />
              {errors.newPassword && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.newPassword}</p>
              )}
            </Field>

            <Field label="تأكيد كلمة المرور الجديدة" required>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={saving}
                {...inputProps('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.confirmPassword}</p>
              )}
            </Field>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: '1.5px solid var(--color-warm-border)',
              background: 'transparent',
              color: 'var(--color-text-soft)',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '11px 28px',
              borderRadius: 10,
              border: 'none',
              background: saving ? 'var(--color-teal-mid)' : 'var(--color-teal)',
              color: '#fff',
              fontSize: 14,
              cursor: saving ? 'default' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(26,95,95,0.3)',
            }}
          >
            {saving ? '…جاري الحفظ' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </form>
    </div>
  );
}
