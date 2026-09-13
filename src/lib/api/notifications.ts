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

export async function updateNotification(
  id: string,
  data: {
    title?: string;
    notificationDate?: string;
    message?: string | null;
    childId?: string | null;
  }
): Promise<AppEvent> {
  const body: Record<string, unknown> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.notificationDate !== undefined) body.notification_date = data.notificationDate;
  if (data.message !== undefined) body.message = data.message;
  if (data.childId !== undefined) body.child_id = data.childId;

  const res = await invokeFunction<{ success: boolean; data: ApiEvent }>(`notifications/${id}`, {
    method: 'PATCH',
    body,
  });
  return mapAppEvents([res.data])[0];
}

export async function deleteNotification(id: string): Promise<void> {
  await invokeFunction(`notifications/${id}`, { method: 'DELETE' });
}
