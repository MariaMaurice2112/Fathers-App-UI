import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function readEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

export function getSupabaseConfigMessage(): string | null {
  const { url, key } = readEnv();

  if (!url && !key) {
    return 'يرجى إعداد NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف beklaous/.env.local (راجع .env.example).';
  }
  if (!url) {
    return 'المتغير NEXT_PUBLIC_SUPABASE_URL غير مُعرّف. أضفه إلى beklaous/.env.local.';
  }
  if (!key) {
    return 'المتغير NEXT_PUBLIC_SUPABASE_ANON_KEY غير مُعرّف. أضفه إلى beklaous/.env.local.';
  }
  return null;
}

export function getSupabase(): SupabaseClient {
  const configMessage = getSupabaseConfigMessage();
  if (configMessage) {
    throw new Error(configMessage);
  }

  if (!client) {
    const { url, key } = readEnv();
    client = createClient(url, key);
  }

  return client;
}
