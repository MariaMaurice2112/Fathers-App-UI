'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChildrenList from '@/components/ChildrenList';
import { useApp } from '@/context/AppContext';

export default function ChildrenPage() {
  const router = useRouter();
  const { childList, isLoading, loadChildren } = useApp();

  useEffect(() => {
    loadChildren().catch(() => undefined);
  }, [loadChildren]);

  return (
    <ChildrenList
      childList={childList}
      loading={isLoading}
      onSelectChild={(id) => router.push(`/children/${id}`)}
      onAddChild={() => router.push('/children/new')}
    />
  );
}
