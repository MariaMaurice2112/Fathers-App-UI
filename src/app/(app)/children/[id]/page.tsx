'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChildProfile from '@/components/ChildProfile';
import { useApp } from '@/context/AppContext';

export default function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getChild, isLoading, loadChild, recordOperation, recordConfession } = useApp();

  const child = getChild(id);

  useEffect(() => {
    loadChild(id).catch(() => undefined);
  }, [id, loadChild]);

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
    <ChildProfile
      child={child}
      saving={isLoading}
      onBack={() => router.push('/children')}
      onEdit={() => router.push(`/children/${id}/edit`)}
      onAddOperation={recordOperation}
      onAddConfession={recordConfession}
    />
  );
}
