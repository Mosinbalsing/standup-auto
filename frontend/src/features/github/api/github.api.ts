import { api, send } from '@/services/api/client';
import type { SyncJob } from '@/types/api';
export const refreshRepositories = () => send('/repositories/refresh', 'POST');
export const saveRepositories = (selected: string[]) => send('/repositories', 'PUT', { selected });
export const startSync = () => send<{ id: string }>('/sync', 'POST');
export const getJob = (id: string) => api<SyncJob>('/jobs/' + encodeURIComponent(id));
