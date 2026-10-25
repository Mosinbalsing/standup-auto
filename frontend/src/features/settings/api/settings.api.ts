import { send } from '@/services/api/client';
import type { User } from '@/types/api';
export type Preferences = Pick<
  User,
  'timezone' | 'standupTime' | 'workingDays' | 'activityWindow' | 'scheduledSync'
>;
export const savePreferences = (data: Preferences) =>
  send<{ user: User }>('/settings', 'PATCH', data);
export const disconnect = () => send('/disconnect', 'POST');
export const reconnectDemo = () => send('/demo/reconnect', 'POST');
export const deleteAccount = (confirm: string) => send('/me/data', 'DELETE', { confirm });
