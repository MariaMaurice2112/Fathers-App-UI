import { invokeFunction } from './invoke';
import {
  mapApiChild,
  mapAppEvents,
  mapBirthdayAlerts,
  mapConfessionAlerts,
  mapDashboardStats,
} from './mappers';
import type { ApiDashboardResponse } from './types';
import type { AppEvent, BirthdayAlert, Child, ConfessionAlert, DashboardStats } from '@/types';

export interface DashboardData {
  stats: DashboardStats;
  confessionAlerts: ConfessionAlert[];
  birthdayAlerts: BirthdayAlert[];
  events: AppEvent[];
  confessionReminders: Child[];
}

export async function fetchDashboard(childList: Child[] = []): Promise<DashboardData> {
  const data = await invokeFunction<ApiDashboardResponse>('dashboard');
  const confessionReminders = (data.confession_reminders ?? []).map(mapApiChild);

  return {
    stats: mapDashboardStats(data),
    confessionAlerts: mapConfessionAlerts(data.confession_reminders ?? []),
    birthdayAlerts: mapBirthdayAlerts(data, childList.length ? childList : confessionReminders),
    events: mapAppEvents(data.general_events_this_week ?? []),
    confessionReminders,
  };
}
