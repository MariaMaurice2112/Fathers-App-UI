import type { Child, OperationTypeLabel } from './types';

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const AVATAR_COLORS = [
  '#1A5F5F', '#556249', '#5B4A8A', '#8A4A4A', '#4A7A8A', '#8A6B4A', '#4A8A6B', '#7A4A6B',
];

export const OPERATION_TYPE_LABELS: OperationTypeLabel[] = [
  'مخصص', 'زيارة', 'مكالمة', 'تدريب',
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
  training: '📖',
  مكالمة: '📞',
  زيارة: '🏠',
  رسالة: '💬',
  'متابعة أخرى': '📋',
  اعتراف: '⛪',
  'عيد ميلاد': '🎂',
  تذكير: '🔔',
  مخصص: '📝',
  تدريب: '📖',
};

export const TRAINING_PRAYER_OPTIONS = [
  'باكر',
  'باكر / غروب / نوم',
  'باكر / نوم',
] as const;

export const TRAINING_BIBLE_OPTIONS = [
  'اصحاح عهد جديد',
  'اصحاح عهد قديم',
  'اصحاح عهد جديد و اصحاح عهد قديم',
] as const;

export const TRAINING_SECTION_HEADERS = {
  prayers: 'الصلوات:',
  bible: 'الكتاب المقدس:',
  other: 'اخرى:',
} as const;

function extractKnownOptions(text: string, options: readonly string[]): {
  matched: string[];
  leftover: string;
} {
  const sorted = [...options].sort((a, b) => b.length - a.length);
  const matched: string[] = [];
  let remaining = text.trim();

  let changed = true;
  while (changed && remaining) {
    changed = false;
    for (const option of sorted) {
      if (remaining === option) {
        if (!matched.includes(option)) matched.push(option);
        remaining = '';
        changed = true;
        break;
      }
      if (remaining.startsWith(`${option} `)) {
        if (!matched.includes(option)) matched.push(option);
        remaining = remaining.slice(option.length).trim();
        changed = true;
        break;
      }
      const mid = ` ${option} `;
      const idx = remaining.indexOf(mid);
      if (idx !== -1) {
        if (!matched.includes(option)) matched.push(option);
        remaining = `${remaining.slice(0, idx)} ${remaining.slice(idx + mid.length)}`.trim();
        changed = true;
        break;
      }
      if (remaining.endsWith(` ${option}`)) {
        if (!matched.includes(option)) matched.push(option);
        remaining = remaining.slice(0, remaining.length - option.length - 1).trim();
        changed = true;
        break;
      }
    }
  }

  return { matched, leftover: remaining };
}

export function composeTrainingNote(
  prayers: string[],
  bible: string[],
  other: string
): string {
  const parts: string[] = [];
  if (prayers.length > 0) {
    parts.push(`${TRAINING_SECTION_HEADERS.prayers} ${prayers.join(' ')}`);
  }
  if (bible.length > 0) {
    parts.push(`${TRAINING_SECTION_HEADERS.bible} ${bible.join(' ')}`);
  }
  const otherTrimmed = other.trim();
  if (otherTrimmed) {
    parts.push(`${TRAINING_SECTION_HEADERS.other} ${otherTrimmed}`);
  }
  return parts.join('\n');
}

export function parseTrainingNote(note: string): {
  prayers: string[];
  bible: string[];
  other: string;
} {
  const prayerSet = new Set<string>(TRAINING_PRAYER_OPTIONS);
  const bibleSet = new Set<string>(TRAINING_BIBLE_OPTIONS);
  const prayers: string[] = [];
  const bible: string[] = [];
  const otherLines: string[] = [];

  const lines = note.split(/\r?\n/);
  let section: 'prayers' | 'bible' | 'other' | null = null;

  const isPrayerHeader = (line: string) =>
    line === TRAINING_SECTION_HEADERS.prayers || line === 'الصلوات' || line.startsWith('الصلوات:');
  const isBibleHeader = (line: string) =>
    line === TRAINING_SECTION_HEADERS.bible ||
    line === 'الكتاب المقدس' ||
    line === '(الكتاب المقدس):' ||
    line === '(الكتاب المقدس)' ||
    line.startsWith('الكتاب المقدس:') ||
    line.startsWith('(الكتاب المقدس):');
  const isOtherHeader = (line: string) =>
    line === TRAINING_SECTION_HEADERS.other || line === 'اخرى' || line.startsWith('اخرى:');

  const contentAfterHeader = (line: string, headers: string[]) => {
    for (const header of headers) {
      if (line === header || line === header.replace(/:$/, '')) return '';
      if (line.startsWith(`${header} `) || (header.endsWith(':') && line.startsWith(header))) {
        return line.slice(header.length).trim();
      }
    }
    return '';
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isPrayerHeader(line)) {
      section = 'prayers';
      const rest = contentAfterHeader(line, ['الصلوات:', 'الصلوات']);
      if (rest) {
        const { matched, leftover } = extractKnownOptions(rest, TRAINING_PRAYER_OPTIONS);
        for (const item of matched) {
          if (!prayers.includes(item)) prayers.push(item);
        }
        if (leftover) otherLines.push(leftover);
      }
      continue;
    }
    if (isBibleHeader(line)) {
      section = 'bible';
      const rest = contentAfterHeader(line, ['الكتاب المقدس:', '(الكتاب المقدس):', 'الكتاب المقدس', '(الكتاب المقدس)']);
      if (rest) {
        const { matched, leftover } = extractKnownOptions(rest, TRAINING_BIBLE_OPTIONS);
        for (const item of matched) {
          if (!bible.includes(item)) bible.push(item);
        }
        if (leftover) otherLines.push(leftover);
      }
      continue;
    }
    if (isOtherHeader(line)) {
      section = 'other';
      const rest = contentAfterHeader(line, ['اخرى:', 'اخرى']);
      if (rest) otherLines.push(rest);
      continue;
    }

    if (section === 'prayers') {
      if (prayerSet.has(line) && !prayers.includes(line)) prayers.push(line);
      else {
        const { matched, leftover } = extractKnownOptions(line, TRAINING_PRAYER_OPTIONS);
        for (const item of matched) {
          if (!prayers.includes(item)) prayers.push(item);
        }
        if (leftover) otherLines.push(leftover);
      }
    } else if (section === 'bible') {
      if (bibleSet.has(line) && !bible.includes(line)) bible.push(line);
      else {
        const { matched, leftover } = extractKnownOptions(line, TRAINING_BIBLE_OPTIONS);
        for (const item of matched) {
          if (!bible.includes(item)) bible.push(item);
        }
        if (leftover) otherLines.push(leftover);
      }
    } else if (section === 'other') {
      otherLines.push(line);
    } else if (prayerSet.has(line) && !prayers.includes(line)) {
      prayers.push(line);
    } else if (bibleSet.has(line) && !bible.includes(line)) {
      bible.push(line);
    } else {
      otherLines.push(line);
    }
  }

  return { prayers, bible, other: otherLines.join('\n') };
}

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

/** Format HH:MM (or HH:MM:SS) as 12-hour clock, e.g. "09:00 pm". */
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeStr;
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
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
