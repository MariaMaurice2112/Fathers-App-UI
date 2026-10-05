import { invokeFunction } from './invoke';
import { mapAppEvents } from './mappers';
import type { ApiEvent } from './types';
import type { AppEvent } from '@/types';

export async function fetchEvents(date?: string): Promise<AppEvent[]> {
  const path = date ? `events?date=${date}` : 'events';
  const res = await invokeFunction<{ data: ApiEvent[] }>(path);
  return mapAppEvents(res.data ?? []);
}

export async function markEventRead(eventId: string): Promise<void> {
  await invokeFunction(`events/${eventId}/read`, { method: 'PATCH' });
}

export async function createEvent(data: {
  title: string;
  eventDate: string;
  message?: string;
  eventTime?: string | null;
  childId?: string;
}): Promise<AppEvent> {
  const res = await invokeFunction<{ success: boolean; data: ApiEvent }>('events', {
    method: 'POST',
    body: {
      title: data.title,
      event_date: data.eventDate,
      message: data.message ?? '',
      event_time: data.eventTime?.trim() ? data.eventTime.trim() : null,
      child_id: data.childId ?? null,
    },
  });
  return mapAppEvents([res.data])[0];
}
