import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJob, startSync } from '../api/github.api';
export function useSync() {
  const client = useQueryClient(),
    [jobId, setJobId] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: startSync, onSuccess: (job) => setJobId(job.id) });
  const job = useQuery({
    queryKey: ['sync-job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) =>
      query.state.data?.status && query.state.data.status !== 'running' ? false : 1000,
  });
  useEffect(() => {
    if (job.data && job.data.status !== 'running') {
      void client.invalidateQueries({ queryKey: ['workspace'] });
    }
  }, [job.data, client]);
  return {
    start: () => mutation.mutate(),
    pending:
      mutation.isPending ||
      (!!jobId && (!job.data || job.data.status === 'running') && !job.isError),
    error:
      mutation.error ||
      job.error ||
      (job.data?.status === 'failed' ? new Error(job.data.message) : null),
    status: job.data?.status,
  };
}
