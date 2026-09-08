import type {
  ApiBirthday,
  ApiChild,
  ApiChildDetail,
  ApiConfessionRecord,
  ApiDashboardResponse,
  ApiEvent,
  ApiOperation,
  ApiStage,
  ConfessionStatus,
} from './types';
import type {
  AlertStatus,
  AppEvent,
  BirthdayAlert,
  Child,
  ConfessionAlert,
  ConfessionRecord,
  DashboardStats,
  Operation,
  Stage,
} from '@/types';
import { getTodayISO, hasRecentBirthdayOperation } from '@/utils';

export const OPERATION_TYPE_TO_API: Record<string, string> = {
  مكالمة: 'call',
  زيارة: 'visit',
  رسالة: 'message',
  'متابعة أخرى': 'follow_up',
  اعتراف: 'confession',
  'عيد ميلاد': 'birthday',
  تذكير: 'reminder',
  مخصص: 'custom',
};

export const OPERATION_TYPE_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(OPERATION_TYPE_TO_API).map(([ar, en]) => [en, ar])
);

export const ACTION_TYPE_TO_API: Record<string, string> = {
  اتصال: 'call',
  زيارة: 'visit',
  رسالة: 'message',
  'متابعة أخرى': 'follow_up',
};

function mapOperation(op: ApiOperation): Operation {
  return {
    id: op.id,
    type: op.type,
    note: op.note ?? undefined,
    operationDate: op.operation_date,
  };
}

function mapConfession(record: ApiConfessionRecord): ConfessionRecord {
  return {
    id: record.id,
    confessionAt: record.confession_at,
    notes: record.notes ?? undefined,
  };
}

function resolveChildId(api: Pick<ApiChild, 'id' | 'child_id'>): string {
  return api.id ?? api.child_id ?? '';
}

export function mapApiChild(api: ApiChild | ApiChildDetail): Child {
  const detail = api as ApiChildDetail;
  const id = resolveChildId(api);
  return {
    id,
    name: api.name,
    birthday: api.birthday ?? undefined,
    marriageContract: api.marriage_contract ?? undefined,
    phoneNumber: api.phone_number ?? undefined,
    maritalStatus: api.marital_status === 'married' ? 'married' : 'single',
    marriageDate: api.marriage_date ?? undefined,
    stageId: api.stage_id,
    stage: api.stage,
    latestConfessionAt: api.latest_confession_at ?? undefined,
    daysSinceLastConfession: api.days_since_last_confession ?? undefined,
    needsConfession: api.needs_confession,
    confessionStatus: api.confession_status,
    reminderIsRead: api.reminder_is_read,
    reminderSnoozedUntil: api.reminder_snoozed_until ?? undefined,
    confessions: (detail.confession_history ?? []).map(mapConfession),
    operations: (detail.operations ?? []).map(mapOperation),
  };
}

export function mapApiStage(stage: ApiStage): Stage {
  return { id: stage.id, name: stage.name };
}

export function mapDashboardStats(data: ApiDashboardResponse): DashboardStats {
  return {
    childrenCount: data.children_count,
    childrenNeedingConfessionCount: data.children_needing_confession_count,
    birthdaysThisWeekCount: data.birthdays_this_week_count,
    generalEventsThisWeekCount: data.general_events_this_week_count,
  };
}

export function mapConfessionAlerts(reminders: ApiChild[]): ConfessionAlert[] {
  const today = getTodayISO();
  return reminders
    .filter((child) => {
      if (child.reminder_snoozed_until && child.reminder_snoozed_until > today) {
        return false;
      }
      return child.needs_confession;
    })
    .map((child) => {
      const childId = resolveChildId(child);
      return {
      id: childId,
      childId,
      status: (child.reminder_is_read ? 'noted' : 'pending') as AlertStatus,
      snoozedUntil: child.reminder_snoozed_until ?? undefined,
    };
    });
}

export function mapBirthdayAlerts(
  data: ApiDashboardResponse,
  childList: Child[]
): BirthdayAlert[] {
  const childMap = Object.fromEntries(childList.map((c) => [c.id, c]));
  const year = new Date().getFullYear();
  const groups: Array<{ relation: BirthdayAlert['relation']; items: ApiBirthday[] }> = [
    { relation: 'yesterday', items: data.birthdays_yesterday ?? [] },
    { relation: 'today', items: data.birthdays_today ?? [] },
    { relation: 'tomorrow', items: data.birthdays_tomorrow ?? [] },
  ];

  return groups.flatMap(({ relation, items }) =>
    items.map((b) => {
      const child = childMap[b.child_id];
      const hasAction = child ? hasRecentBirthdayOperation(child) : false;
      return {
        id: `${b.child_id}-${relation}`,
        childId: b.child_id,
        relation,
        year,
        status: (hasAction ? 'action_taken' : 'pending') as AlertStatus,
      };
    })
  );
}

export function mapAppEvents(events: ApiEvent[]): AppEvent[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    message: event.message ?? undefined,
    eventDate: event.event_date ?? event.notification_date ?? '',
    childId: event.child_id ?? undefined,
    childName: event.child_name ?? undefined,
    isRead: event.is_read,
  }));
}

export function childToCreatePayload(data: {
  name: string;
  birthday?: string;
  marriageContract?: string;
  phoneNumber?: string;
  maritalStatus: 'single' | 'married';
  marriageDate?: string;
  stageId: number;
}) {
  const isMarried = data.maritalStatus === 'married';
  return {
    name: data.name,
    birthday: data.birthday || undefined,
    marriage_contract: data.marriageContract || null,
    phone_number: data.phoneNumber?.trim() || null,
    marital_status: data.maritalStatus,
    marriage_date: isMarried ? (data.marriageDate || null) : null,
    stage_id: data.stageId,
  };
}

export function childToUpdatePayload(data: {
  name?: string;
  birthday?: string;
  marriageContract?: string;
  phoneNumber?: string;
  maritalStatus?: 'single' | 'married';
  marriageDate?: string;
  stageId?: number;
}) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.birthday !== undefined) payload.birthday = data.birthday || null;
  if (data.marriageContract !== undefined) payload.marriage_contract = data.marriageContract || null;
  if (data.phoneNumber !== undefined) payload.phone_number = data.phoneNumber?.trim() || null;
  if (data.maritalStatus !== undefined) {
    payload.marital_status = data.maritalStatus;
    payload.marriage_date =
      data.maritalStatus === 'married' ? (data.marriageDate || null) : null;
  } else if (data.marriageDate !== undefined) {
    payload.marriage_date = data.marriageDate || null;
  }
  if (data.stageId !== undefined) payload.stage_id = data.stageId;
  return payload;
}

export function confessionStatusLabel(status: ConfessionStatus): string {
  const labels: Record<ConfessionStatus, string> = {
    NO_CONFESSION_RECORDED: 'لم يسجّل اعتراف',
    OVERDUE: 'متأخر',
    UP_TO_DATE: 'محدّث',
  };
  return labels[status];
}
