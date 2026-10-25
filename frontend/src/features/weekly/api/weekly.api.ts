import { api, send } from '@/services/api/client';
import type { Recap } from '@/types/api';
export const getRecap = (start: string) => api<Recap>('/weekly?start=' + start);
export const saveRecap = (data: { start: string; version: number; text: string }) =>
  send('/weekly', 'PUT', data);
