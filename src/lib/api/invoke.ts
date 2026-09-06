import { FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface InvokeOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
}

type ApiLoadingListener = (pendingCount: number) => void;

let pendingApiCalls = 0;
const apiLoadingListeners = new Set<ApiLoadingListener>();

function notifyApiLoading() {
  apiLoadingListeners.forEach((listener) => listener(pendingApiCalls));
}

function beginApiCall() {
  pendingApiCalls += 1;
  notifyApiLoading();
}

function endApiCall() {
  pendingApiCalls = Math.max(0, pendingApiCalls - 1);
  notifyApiLoading();
}

/** Subscribe to in-flight API call count. Returns unsubscribe. */
export function subscribeApiLoading(listener: ApiLoadingListener): () => void {
  apiLoadingListeners.add(listener);
  listener(pendingApiCalls);
  return () => {
    apiLoadingListeners.delete(listener);
  };
}

function extractErrorFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const body = payload as ApiErrorBody & {
    message?: string;
    error_description?: string;
    msg?: string;
  };

  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  if (typeof body.message === 'string' && body.message.trim()) return body.message;
  if (typeof body.error_description === 'string' && body.error_description.trim()) {
    return body.error_description;
  }
  if (typeof body.msg === 'string' && body.msg.trim()) return body.msg;

  return null;
}

async function resolveInvokeError(error: unknown, data: unknown): Promise<string | null> {
  const fromData = extractErrorFromPayload(data);
  if (fromData) return fromData;

  if (error instanceof FunctionsHttpError || error instanceof FunctionsRelayError) {
    const context = error.context;
    if (context instanceof Response) {
      try {
        const cloned = context.clone();
        const contentType = cloned.headers.get('Content-Type') ?? '';

        if (contentType.toLowerCase().includes('application/json')) {
          const body = await cloned.json();
          const fromBody = extractErrorFromPayload(body);
          if (fromBody) return fromBody;
        }

        const text = (await cloned.text()).trim();
        if (text) return text;
      } catch {
        // Fall through to generic handling below.
      }
    }
  }

  if (error instanceof Error && error.message !== 'Edge Function returned a non-2xx status code') {
    return error.message;
  }

  return null;
}

export async function invokeFunction<T>(functionPath: string, options?: InvokeOptions): Promise<T> {
  beginApiCall();
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke(functionPath, {
      method: options?.method ?? 'GET',
      body: options?.body,
    });

    const payloadError = extractErrorFromPayload(data);
    if (payloadError) {
      throw new ApiError(payloadError);
    }

    if (error) {
      const message = await resolveInvokeError(error, data);
      throw new ApiError(message || 'حدث خطأ في الاتصال ');
    }

    const payload = data as T & ApiErrorBody;
    if (payload && typeof payload === 'object' && payload.success === false) {
      throw new ApiError(extractErrorFromPayload(payload) || 'حدث خطأ في الاتصال ');
    }

    return payload as T;
  } finally {
    endApiCall();
  }
}

/** Normalize any thrown value to a user-facing message. */
export function getApiErrorMessage(err: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
