import { api, setCsrf } from '@/services/api/client';
import type { Workspace } from '@/types/api';
export const getWorkspace = async (date?: string) => {
  const result = await api<Workspace>('/workspace' + (date ? '?date=' + date : ''));
  setCsrf(result.csrf);
  return result;
};
