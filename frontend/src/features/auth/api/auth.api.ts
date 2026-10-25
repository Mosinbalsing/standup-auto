import { api, send, setCsrf } from '@/services/api/client';
import type { Session } from '@/types/api';
export const getSession = async () => {
  const session = await api<Session>('/me');
  setCsrf(session.csrf);
  return session;
};
export const loginDemo = async () => {
  const result = await send<Session>('/demo/login', 'POST');
  setCsrf(result.csrf);
  return result;
};
export const logout = () => send('/logout', 'POST');
