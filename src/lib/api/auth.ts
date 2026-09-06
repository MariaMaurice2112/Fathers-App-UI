import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { invokeFunction } from './invoke';
import type { LoginResponse } from './types';
import type { PriestUser } from '@/types';

const USER_STORAGE_KEY = 'beklaous_user';

export function getStoredUser(): PriestUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PriestUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: PriestUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function loginWithCredentials(email: string, password: string): Promise<PriestUser> {
  const data = await invokeFunction<LoginResponse>('login', {
    method: 'POST',
    body: { email, password },
  });

  const { error } = await getSupabase().auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (error) {
    throw new Error(error.message);
  }

  const user: PriestUser = {
    id: data.user.id,
    email: data.user.email,
    fatherName: data.user.father_name ?? undefined,
  };

  storeUser(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    await getSupabase().auth.signOut();
  }
  clearStoredUser();
}

export async function restoreSession(): Promise<PriestUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { session } } = await getSupabase().auth.getSession();
  if (!session) {
    clearStoredUser();
    return null;
  }

  const stored = getStoredUser();
  if (stored && stored.id === session.user.id) {
    return stored;
  }

  const user: PriestUser = {
    id: session.user.id,
    email: session.user.email ?? '',
    fatherName: stored?.fatherName,
  };
  storeUser(user);
  return user;
}
