'use client';

import { useState } from 'react';
import type { Child, ChildFormData, Stage } from '@/types';
import { getTodayISO } from '@/utils';

interface AddEditChildProps {
  child?: Child;
  stages: Stage[];
  saving?: boolean;
  onSave: (data: ChildFormData & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10,
  fontSize: 14, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s',
};

export default function AddEditChild({ child, stages, saving = false, onSave, onCancel }: AddEditChildProps) {
  const [form, setForm] = useState({
    name: child?.name ?? '',
    birthday: child?.birthday ?? '',
    stageId: child?.stageId ? String(child.stageId) : '',
    marriageContract: child?.marriageContract ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const set = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'الاسم مطلوب';
    if (!form.birthday) errs.birthday = 'تاريخ الميلاد مطلوب';
    if (!form.stageId) errs.stageId = 'المرحلة مطلوبة';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await onSave({
      name: form.name.trim(),
      birthday: form.birthday,
      stageId: Number(form.stageId),
      marriageContract: form.marriageContract || undefined,
      ...(child ? { id: child.id } : {}),
    });
  };

  const inputProps = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(key, e.target.value),
    style: { ...inputStyle, borderColor: errors[key] ? 'var(--color-danger)' : 'var(--color-warm-border)' },
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--color-teal)'; },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = errors[key] ? 'var(--color-danger)' : 'var(--color-warm-border)'; },
  });

  const isEdit = !!child;
  const today = getTodayISO();

  return (
    <div className="page-shell page-shell--form">
      <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-teal)', fontSize: 14, fontFamily: 'var(--font-body)', marginBottom: 20, padding: 0 }}>
        → العودة
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700 }}>{isEdit ? `تعديل بيانات ${child.name}` : 'إضافة ابن جديد'}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>البيانات محفوظة بشكل سري لأغراض رعوية خاصة</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-warm-border)', padding: '24px', marginBottom: 28, boxShadow: '0 1px 6px rgba(44,36,32,0.05)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 700, paddingBottom: 12, borderBottom: '1px solid var(--color-warm-border)' }}>البيانات الأساسية</h2>
          <div className="form-grid">
            <div className="form-grid-full">
              <Field label="الاسم الكامل" required>
                <input type="text" placeholder="مثال: بطرس نبيل سمير" disabled={saving} {...inputProps('name')} />
                {errors.name && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.name}</p>}
              </Field>
            </div>
            <Field label="تاريخ الميلاد" required>
              <input type="date" max={today} disabled={saving} {...inputProps('birthday')} />
              {errors.birthday && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.birthday}</p>}
            </Field>
            <Field label="المرحلة / الصف" required>
              <select disabled={saving || stages.length === 0} {...inputProps('stageId')} style={{ ...inputStyle, borderColor: errors.stageId ? 'var(--color-danger)' : 'var(--color-warm-border)', cursor: 'pointer' }}>
                <option value="">اختر المرحلة…</option>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.stageId && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.stageId}</p>}
            </Field>
            <Field label="عقد زواج (اختياري)">
              <input type="date" disabled={saving} {...inputProps('marriageContract')} />
            </Field>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" onClick={onCancel} disabled={saving} style={{ padding: '11px 22px', borderRadius: 10, border: '1.5px solid var(--color-warm-border)', background: 'transparent', color: 'var(--color-text-soft)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>إلغاء</button>
          <button type="submit" disabled={saving} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: saving ? 'var(--color-teal-mid)' : 'var(--color-teal)', color: '#fff', fontSize: 14, cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, boxShadow: '0 2px 8px rgba(26,95,95,0.3)' }}>
            {saving ? '…جاري الحفظ' : isEdit ? 'حفظ التعديلات' : 'إضافة الابن'}
          </button>
        </div>
      </form>
    </div>
  );
}
