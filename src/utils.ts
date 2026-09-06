import type { Child, OperationTypeLabel } from './types';

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const AVATAR_COLORS = [
  '#1A5F5F', '#556249', '#5B4A8A', '#8A4A4A', '#4A7A8A', '#8A6B4A', '#4A8A6B', '#7A4A6B',
];

export const OPERATION_TYPE_LABELS: OperationTypeLabel[] = [
  'مخصص',  'زيارة', 'مكالمة',
];

export const OPERATION_TYPE_ICONS: Record<string, string> = {
  call: '📞',
  visit: '🏠',
  message: '💬',
  follow_up: '📋',
  confession: '⛪',
  birthday: '🎂',
  reminder: '🔔',
  custom: '📝',
  مكالمة: '📞',
  زيارة: '🏠',
  رسالة: '💬',
  'متابعة أخرى': '📋',
  اعتراف: '⛪',
  'عيد ميلاد': '🎂',
  تذكير: '🔔',
  مخصص: '📝',
};

export function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts[0]?.[0] ?? '؟';
}

export function getDaysDiff(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

export function getBirthdayRelation(birthdayStr: string): 'yesterday' | 'today' | 'tomorrow' | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const b = new Date(birthdayStr);
  const thisYear = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  const diff = Math.floor((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === -1) return 'yesterday';
  if (diff === 1) return 'tomorrow';
  return null;
}

export function getAge(birthdayStr: string): number {
  const today = new Date();
  const b = new Date(birthdayStr);
  let age = today.getFullYear() - b.getFullYear();
  if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) {
    age--;
  }
  return age;
}

export function hasRecentBirthdayOperation(child: Child): boolean {
  const today = getTodayISO();
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 3);
  const windowStartISO = windowStart.toISOString().slice(0, 10);

  return child.operations.some(
    (op) =>
      (op.type === 'birthday' || op.type === 'عيد ميلاد') &&
      op.operationDate >= windowStartISO &&
      op.operationDate <= today
  );
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function toISODateTime(dateISO: string): string {
  return new Date(`${dateISO}T12:00:00`).toISOString();
}
