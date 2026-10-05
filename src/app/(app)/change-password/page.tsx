'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChangePassword from '@/components/ChangePassword';
import { changePassword } from '@/lib/api/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <ChangePassword
      saving={saving}
      onCancel={() => router.push('/dashboard')}
      onSubmit={async ({ currentPassword, newPassword }) => {
        setSaving(true);
        try {
          await changePassword(currentPassword, newPassword);
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
