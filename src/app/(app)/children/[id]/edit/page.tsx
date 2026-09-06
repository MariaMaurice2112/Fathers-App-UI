'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddEditChild from '@/components/AddEditChild';
import { useApp } from '@/context/AppContext';

export default function EditChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getChild, stages, isLoading, loadChild, saveChild } = useApp();
  const [saving, setSaving] = useState(false);

  const child = getChild(id);

  useEffect(() => {
    if (!child) {
      loadChild(id).catch(() => undefined);
    }
  }, [id, child, loadChild]);

  if (!child && isLoading) {
    return <div style={{ padding: 40, color: 'var(--color-text-muted)' }}>…جاري التحميل</div>;
  }

  if (!child) {
    return (
      <div style={{ padding: 40, color: 'var(--color-text-muted)' }}>
        لم يتم العثور على الابن
      </div>
    );
  }

  return (
    <AddEditChild
      child={child}
      stages={stages}
      saving={saving || isLoading}
      onSave={async (data) => {
        setSaving(true);
        try {
          await saveChild(data);
          router.push(`/children/${id}`);
        } finally {
          setSaving(false);
        }
      }}
      onCancel={() => router.push(`/children/${id}`)}
    />
  );
}
