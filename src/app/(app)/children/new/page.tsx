'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddEditChild from '@/components/AddEditChild';
import { useApp } from '@/context/AppContext';

export default function NewChildPage() {
  const router = useRouter();
  const { stages, isLoading, saveChild } = useApp();
  const [saving, setSaving] = useState(false);

  return (
    <AddEditChild
      stages={stages}
      saving={saving || isLoading}
      onSave={async (data) => {
        setSaving(true);
        try {
          const id = await saveChild(data);
          router.push(`/children/${id}`);
        } finally {
          setSaving(false);
        }
      }}
      onCancel={() => router.push('/children')}
    />
  );
}
