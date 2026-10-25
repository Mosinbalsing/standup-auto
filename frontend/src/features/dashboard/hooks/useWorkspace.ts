import { useQuery } from '@tanstack/react-query';
import { getWorkspace } from '../api/workspace.api';
export const useWorkspace = (date?: string) =>
  useQuery({ queryKey: ['workspace', date || 'current'], queryFn: () => getWorkspace(date) });
