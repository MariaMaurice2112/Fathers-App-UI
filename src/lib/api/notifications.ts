import { invokeFunction } from './invoke';
import { mapAppEvents } from './mappers';
import type { ApiEvent } from './types';
import type { AppEvent } from '@/types';

export async function fetchMonthNotifications(year: number, month: number): Promise<AppEvent[]> {
  const res = await invokeFunction<{ data: ApiEvent[] }>(
    `notifications/month?year=${year}&month=${month}`
  );
  return mapAppEvents(res.data ?? []);
}

export async function createNotification(data: {
  title: string;
  notificationDate: string;
  message?: string;
  childId?: string;
}): Promise<AppEvent> {
  const res = await invokeFunction<{ success: boolean; data: ApiEvent }>('notifications', {
    method: 'POST',
    body: {
      title: data.title,
      notification_date: data.notificationDate,
      message: data.message ?? '',
      child_id: data.childId ?? null,
    },
  });
  return mapAppEvents([res.data])[0];
}
