'use client';

import { useState } from 'react';
import type { Child, ChildFormData, MaritalStatus, Stage } from '@/types';
import { getApiErrorMessage } from '@/lib/api';
import { getTodayISO, isValidEgyptianPhone, normalizeEgyptianPhone } from '@/utils';

interface AddEditChildProps {
  child?: Child;
  stages: Stage[];
  saving?: boolean;
  onSave: (data: ChildFormData & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

type FormFields = {
  name: string;
  birthday: string;
  stageId: string;
  marriageContract: string;
  phoneNumber: string;
  maritalStatus: MaritalStatus;
  marriageDate: string;
};

type FormErrors = Partial<Record<keyof FormFields | 'form', string>>;

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

const CHILD_ALREADY_EXISTS_AR = 'يوجد ابن بهذا الاسم بالفعل';

/** Map known English API messages to Arabic UI copy. */
function localizeChildError(message: string): { field?: keyof FormFields; message: string } {
  const lower = message.toLowerCase();

  if (lower.includes('already exists') || lower.includes('child already exist')) {
    return { field: 'name', message: CHILD_ALREADY_EXISTS_AR };
  }
  if (lower.includes('name is required')) {
    return { field: 'name', message: 'الاسم مطلوب' };
  }
  if (lower.includes('stage_id does not exist') || lower.includes('stage_id is required')) {
    return { field: 'stageId', message: 'المرحلة غير صالحة — اختر مرحلة أخرى' };
  }
  if (lower.includes('birthday must be a valid date')) {
    return { field: 'birthday', message: 'تاريخ الميلاد غير صالح' };
  }
  if (lower.includes('marriage_contract must be a valid date')) {
    return { field: 'marriageContract', message: 'تاريخ خلو الموانع غير صالح' };
  }
  if (lower.includes('marital_status')) {
    return { field: 'maritalStatus', message: 'الحالة الاجتماعية غير صالحة' };
  }
  if (lower.includes('marriage_date')) {
    return { field: 'marriageDate', message: 'تاريخ الزواج غير صالح' };
  }
  if (lower.includes('phone_number') || lower.includes('egyptian mobile')) {
    return { field: 'phoneNumber', message: 'أدخل رقم موبايل مصري صحيح (010 / 011 / 012 / 015)' };
  }
  if (lower.includes('not found') || lower.includes('not owned')) {
    return { message: 'لم يتم العثور على الابن أو لا تملك صلاحية تعديله' };
  }
  if (lower.includes('unauthorized')) {
    return { message: 'انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى' };
  }

  return { message };
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-border)', borderRadius: 10,
  fontSize: 14, color: 'var(--color-text)', background: 'var(--color-cream)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s',
};

export default function AddEditChild({ child, stages, saving = false, onSave, onCancel }: AddEditChildProps) {
  const [form, setForm] = useState<FormFields>({
    name: child?.name ?? '',
    birthday: child?.birthday ?? '',
    stageId: child?.stageId ? String(child.stageId) : '',
    marriageContract: child?.marriageContract ?? '',
    phoneNumber: child?.phoneNumber ?? '',
    maritalStatus: child?.maritalStatus ?? 'single',
    marriageDate: child?.marriageDate ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (key: keyof FormFields, val: string) => {
    setForm((f) => {
      if (key === 'maritalStatus') {
        const status = val as MaritalStatus;
        return {
          ...f,
          maritalStatus: status,
          marriageDate: status === 'married' ? f.marriageDate : '',
        };
      }
      return { ...f, [key]: val };
    });
    setErrors((e) => ({
      ...e,
      [key]: undefined,
      form: undefined,
      ...(key === 'maritalStatus' ? { marriageDate: undefined } : {}),
    }));
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'الاسم مطلوب';
    if (!form.birthday) errs.birthday = 'تاريخ الميلاد مطلوب';
    if (!form.stageId) errs.stageId = 'المرحلة مطلوبة';
    if (!form.maritalStatus) errs.maritalStatus = 'الحالة الاجتماعية مطلوبة';
    if (form.phoneNumber.trim() && !isValidEgyptianPhone(form.phoneNumber)) {
      errs.phoneNumber = 'أدخل رقم موبايل مصري صحيح (010 / 011 / 012 / 015)';
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
    const normalizedPhone = form.phoneNumber.trim()
      ? normalizeEgyptianPhone(form.phoneNumber) ?? undefined
      : undefined;

    try {
      await onSave({
        name: form.name.trim(),
        birthday: form.birthday,
        stageId: Number(form.stageId),
        marriageContract: form.marriageContract || undefined,
        phoneNumber: normalizedPhone,
        maritalStatus: form.maritalStatus,
        marriageDate: form.maritalStatus === 'married' ? (form.marriageDate || undefined) : undefined,
        ...(child ? { id: child.id } : {}),
      });
    } catch (err) {
      const localized = localizeChildError(
        getApiErrorMessage(err, 'تعذّر حفظ بيانات الابن'),
      );
      if (localized.field) {
        setErrors({ [localized.field]: localized.message });
      } else {
        setErrors({ form: localized.message });
      }
    }
  };

  const inputProps = (key: keyof FormFields) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(key, e.target.value),
    style: { ...inputStyle, borderColor: errors[key] ? 'var(--color-danger)' : 'var(--color-warm-border)' },
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--color-teal)'; },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = errors[key] ? 'var(--color-danger)' : 'var(--color-warm-border)'; },
  });

  const isEdit = !!child;
  const today = getTodayISO();
  const isMarried = form.maritalStatus === 'married';

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
        {errors.form && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(185, 74, 72, 0.35)',
              background: 'rgba(185, 74, 72, 0.08)',
              color: 'var(--color-danger)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              lineHeight: 1.5,
            }}
          >
            {errors.form}
          </div>
        )}

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
            <Field label="الحالة الاجتماعية" required>
              <select
                disabled={saving}
                {...inputProps('maritalStatus')}
                style={{ ...inputStyle, borderColor: errors.maritalStatus ? 'var(--color-danger)' : 'var(--color-warm-border)', cursor: 'pointer' }}
              >
                <option value="single">أعزب</option>
                <option value="married">متزوج</option>
              </select>
              {errors.maritalStatus && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.maritalStatus}</p>}
            </Field>
            {isMarried && (
              <Field label="تاريخ الزواج (اختياري)">
                <input type="date" max={today} disabled={saving} {...inputProps('marriageDate')} />
                {errors.marriageDate && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.marriageDate}</p>}
              </Field>
            )}
            <Field label="خلو موانع (اختياري)">
              <input type="date" disabled={saving} {...inputProps('marriageContract')} />
              {errors.marriageContract && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.marriageContract}</p>}
            </Field>
            <Field label="رقم الهاتف (اختياري)">
              <input
                type="tel"
                dir="ltr"
                placeholder="01012345678"
                disabled={saving}
                {...inputProps('phoneNumber')}
                style={{
                  ...inputStyle,
                  borderColor: errors.phoneNumber ? 'var(--color-danger)' : 'var(--color-warm-border)',
                  direction: 'ltr',
                  textAlign: 'left',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
              {errors.phoneNumber && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errors.phoneNumber}</p>}
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
