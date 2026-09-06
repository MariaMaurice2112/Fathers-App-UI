'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { useApp } from '@/context/AppContext';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    childList,
    dashboardStats,
    confessionAlerts,
    birthdayAlerts,
    events,
    isLoading,
    refreshDashboard,
    markConfessionNoted,
    takeConfessionAction,
    snoozeConfession,
    markBirthdayNoted,
    takeBirthdayAction,
  } = useApp();

  useEffect(() => {
    refreshDashboard().catch(() => undefined);
  }, [refreshDashboard]);

  return (
    <Dashboard
      user={user}
      childList={childList}
      dashboardStats={dashboardStats}
      confessionAlerts={confessionAlerts}
      birthdayAlerts={birthdayAlerts}
      events={events}
      loading={isLoading}
      onMarkConfessionNoted={markConfessionNoted}
      onTakeConfessionAction={takeConfessionAction}
      onSnoozeConfession={snoozeConfession}
      onMarkBirthdayNoted={markBirthdayNoted}
      onTakeBirthdayAction={takeBirthdayAction}
      onNavigateToChild={(id) => router.push(`/children/${id}`)}
    />
  );
}
