import { api, send } from '@/services/api/client';
import type { Standup } from '@/types/api';
export const saveStandup = (draft: Standup) =>
  send<Standup>('/standups/' + draft.date, 'PUT', draft);
export const exportStandup = (date: string, format: string) =>
  api<{ text: string }>('/export?date=' + date + '&format=' + format);
export const dismissBlocker = (activityId: string) =>
  send('/blockers/dismiss', 'POST', { activityId });
