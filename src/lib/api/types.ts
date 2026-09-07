export type ConfessionStatus = 'NO_CONFESSION_RECORDED' | 'OVERDUE' | 'UP_TO_DATE';

export interface ApiStage {
  id: number;
  name: string;
}

export interface ApiChild {
  id?: string;
  child_id?: string;
  name: string;
  birthday?: string | null;
  marriage_contract?: string | null;
  phone_number?: string | null;
  age?: number | null;
  stage_id: number;
  stage: string;
  latest_confession_at?: string | null;
  days_since_last_confession?: number | null;
  needs_confession: boolean;
  confession_status: ConfessionStatus;
  reminder_is_read: boolean;
  reminder_snoozed_until?: string | null;
}

export interface ApiChildDetail extends ApiChild {
  confession_history?: ApiConfessionRecord[];
  operations?: ApiOperation[];
}

export interface ApiOperation {
  id: string;
  type: string;
  note?: string | null;
  operation_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiConfessionRecord {
  id: string;
  confession_at: string;
  notes?: string | null;
  created_at?: string;
}

export interface ApiBirthday {
  child_id: string;
  name: string;
  birthday: string;
  age: number;
  stage_id: number;
  stage: string;
}

export interface ApiEvent {
  id: string;
  father_id?: string;
  child_id?: string | null;
  father_name?: string | null;
  child_name?: string | null;
  type: string;
  title: string;
  message?: string | null;
  event_date?: string;
  notification_date?: string;
  status?: string;
  is_read: boolean;
  created_at?: string;
}

export interface ApiDashboardResponse {
  children_count: number;
  children_needing_confession_count: number;
  birthdays_this_week_count: number;
  general_events_this_week_count: number;
  birthdays_yesterday: ApiBirthday[];
  birthdays_today: ApiBirthday[];
  birthdays_tomorrow: ApiBirthday[];
  confession_reminders: ApiChild[];
  general_events_this_week: ApiEvent[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  user: {
    id: string;
    email: string;
    father_name?: string | null;
  };
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ApiErrorBody {
  success?: boolean;
  error?: string;
}
