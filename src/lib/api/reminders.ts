import { invokeFunction } from './invoke';

export async function markConfessionReminderRead(childId: string): Promise<void> {
  await invokeFunction(`mark-confession-reminder-read/${childId}`, { method: 'POST' });
}

export async function snoozeConfessionReminder(childId: string, snoozedUntil: string): Promise<void> {
  await invokeFunction(`snooze-confession-reminder/${childId}`, {
    method: 'POST',
    body: { snoozed_until: snoozedUntil },
  });
}

export async function fetchConfessionReminders(unreadOnly = true): Promise<void> {
  await invokeFunction(`confession-reminders?unread_only=${unreadOnly ? 'true' : 'false'}`);
}
