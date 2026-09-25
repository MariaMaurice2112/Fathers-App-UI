export type ConfessionStatus = 'NO_CONFESSION_RECORDED' | 'OVERDUE' | 'UP_TO_DATE';
export type AlertStatus = 'pending' | 'noted' | 'action_taken';
export type ActionType = 'اتصال' | 'زيارة' | 'رسالة' | 'متابعة أخرى';
export type OperationTypeLabel = 'مخصص' | 'تذكير' | 'زيارة' | 'مكالمة' | 'تدريب';
export type MaritalStatus = 'single' | 'married';

export interface Operation {
  id: string;
  type: string;
  note?: string;
  operationDate: string;
}

export interface ConfessionRecord {
  id: string;
  confessionAt: string;
  notes?: string;
}

export interface Stage {
  id: number;
  name: string;
}

export interface Child {
  id: string;
  name: string;
  birthday?: string;
  marriageContract?: string;
  phoneNumber?: string;
  phoneNumber2?: string;
  maritalStatus: MaritalStatus;
  marriageDate?: string;
  stageId: number;
  stage: string;
  latestConfessionAt?: string;
  daysSinceLastConfession?: number;
  needsConfession: boolean;
  confessionStatus: ConfessionStatus;
  reminderIsRead: boolean;
  reminderSnoozedUntil?: string;
  confessions: ConfessionRecord[];
  operations: Operation[];
}

export interface PriestUser {
  id: string;
  email: string;
  fatherName?: string;
}

export interface ConfessionAlert {
  id: string;
  childId: string;
  status: AlertStatus;
  actionDate?: string;
  actionNote?: string;
  actionType?: ActionType;
  snoozedUntil?: string;
}

export interface BirthdayAlert {
  id: string;
  childId: string;
  relation: 'yesterday' | 'today' | 'tomorrow';
  year: number;
  status: AlertStatus;
  actionDate?: string;
  actionNote?: string;
  actionType?: ActionType;
}

export interface AppEvent {
  id: string;
  title: string;
  message?: string;
  eventDate: string;
  /** Optional HH:MM clock time; omit when unset. */
  eventTime?: string;
  childId?: string;
  childName?: string;
  isRead: boolean;
}

export interface DashboardStats {
  childrenCount: number;
  childrenNeedingConfessionCount: number;
  birthdaysThisWeekCount: number;
  generalEventsThisWeekCount: number;
}

export interface ChildFormData {
  name: string;
  birthday: string;
  marriageContract?: string;
  phoneNumber?: string;
  phoneNumber2?: string;
  maritalStatus: MaritalStatus;
  marriageDate?: string;
  stageId: number;
}
