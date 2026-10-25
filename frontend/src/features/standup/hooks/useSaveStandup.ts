import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveStandup } from '../api/standup.api';
export function useSaveStandup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveStandup,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['workspace'] });
      await client.invalidateQueries({ queryKey: ['weekly'] });
    },
  });
}
