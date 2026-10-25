import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecap, saveRecap } from '../api/weekly.api';
export const useRecap = (start: string) =>
  useQuery({ queryKey: ['weekly', start], queryFn: () => getRecap(start) });
export function useSaveRecap() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveRecap,
    onSuccess: () => client.invalidateQueries({ queryKey: ['weekly'] }),
  });
}
