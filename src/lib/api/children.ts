import { invokeFunction } from './invoke';
import { mapApiChild, mapApiStage, mapAppEvents, childToCreatePayload, childToUpdatePayload } from './mappers';
import type { ApiChild, ApiChildDetail, ApiConfessionRecord, ApiEvent, ApiOperation, ApiStage } from './types';
import type { AppEvent, Child } from '@/types';

export async function fetchChildren(): Promise<Child[]> {
  const res = await invokeFunction<{ data: ApiChild[] }>('children');
  return (res.data ?? []).map(mapApiChild);
}

export async function fetchChild(id: string): Promise<Child> {
  const res = await invokeFunction<{ data: ApiChildDetail }>(`children/${id}`);
  return mapApiChild(res.data);
}

export async function fetchChildEvents(childId: string): Promise<AppEvent[]> {
  const res = await invokeFunction<{ data: ApiEvent[] }>(`children/${childId}/events`);
  return mapAppEvents(res.data ?? []);
}

export async function createChild(data: {
  name: string;
  birthday?: string;
  marriageContract?: string;
  phoneNumber?: string;
  phoneNumber2?: string;
  maritalStatus: 'single' | 'married';
  marriageDate?: string;
  stageId: number;
}): Promise<Child> {
  const res = await invokeFunction<{ success: boolean; data: ApiChild }>('children', {
    method: 'POST',
    body: childToCreatePayload(data),
  });
  return mapApiChild(res.data);
}

export async function updateChild(
  id: string,
  data: {
    name?: string;
    birthday?: string;
    marriageContract?: string;
    phoneNumber?: string;
    phoneNumber2?: string;
    maritalStatus?: 'single' | 'married';
    marriageDate?: string;
    stageId?: number;
  }
): Promise<Child> {
  const res = await invokeFunction<{ success: boolean; data: ApiChild }>(`children/${id}`, {
    method: 'PATCH',
    body: childToUpdatePayload(data),
  });
  return mapApiChild(res.data);
}

export async function deleteChild(id: string): Promise<void> {
  await invokeFunction(`children/${id}`, { method: 'DELETE' });
}

export async function addConfession(
  childId: string,
  confessionAt: string,
  notes?: string
): Promise<void> {
  await invokeFunction(`children/${childId}/confessions`, {
    method: 'POST',
    body: { confession_at: confessionAt, notes: notes ?? '' },
  });
}

export async function fetchConfessions(childId: string): Promise<ApiConfessionRecord[]> {
  const res = await invokeFunction<{ data: ApiConfessionRecord[] }>(`children/${childId}/confessions`);
  return res.data ?? [];
}

export async function addOperation(
  childId: string,
  type: string,
  operationDate: string,
  note?: string
): Promise<ApiOperation> {
  const res = await invokeFunction<{ success: boolean; data: ApiOperation }>(
    `children/${childId}/operations`,
    {
      method: 'POST',
      body: { type, operation_date: operationDate, note: note ?? '' },
    }
  );
  return res.data;
}

export async function fetchStages(): Promise<ApiStage[]> {
  const res = await invokeFunction<{ data: ApiStage[] }>('stages');
  return res.data ?? [];
}

export { mapApiStage };
