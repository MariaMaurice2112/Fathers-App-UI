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

/** Format HH:MM (or HH:MM:SS) for Arabic display. */
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeStr;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
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

/** Egyptian mobile: 010/011/012/015 — accepts local or +20 / 0020 forms. Returns +20… or null. */
export function normalizeEgyptianPhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && !digits.startsWith('20')) {
    digits = `20${digits.slice(1)}`;
  }

  if (!/^201[0125]\d{8}$/.test(digits)) return null;
  return `+${digits}`;
}

export function isValidEgyptianPhone(input: string): boolean {
  return normalizeEgyptianPhone(input) !== null;
}

/** Display form for UI (LTR): +20 10X XXX XXXX. Falls back to trimmed input. */
export function formatEgyptianPhoneDisplay(input: string): string {
  const normalized = normalizeEgyptianPhone(input);
  if (!normalized) return input.trim();
  const digits = normalized.slice(1); // 2010XXXXXXXX
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
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
