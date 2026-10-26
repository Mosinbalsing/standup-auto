import type { Context, Controller } from '../../../types/context.ts';
import { account } from '../../../types/context.ts';
import { AppError } from '../../../utils/errors.ts';
import { refreshRepositories, selectRepositories } from '../services/sync.service.ts';
import { startSyncJob, waitForJobs } from '../../../jobs/dailyStandup.job.ts';
import { repositorySelectionSchema } from '../schemas/github.schema.ts';
export function githubController({
  db,
  config,
  request,
  throttle,
  serverless,
}: Context): Record<string, Controller> {
  return {
    refresh: async (_req, res) => {
      const { user } = account(res);
      throttle(`refresh:${user.id}`, 4);
      if (user.mode !== 'demo') await refreshRepositories(db, user, config, request);
      res.json({ ok: true });
    },
    select: async (req, res) => {
      const { user } = account(res);
      const data = repositorySelectionSchema.parse(req.body);
      await selectRepositories(db, user, data.selected);
      res.json({ ok: true });
    },
    sync: async (_req, res) => {
      const { user } = account(res);
      throttle(`sync:${user.id}`, 3);
      const job = await startSyncJob(db, user, config);
      // A serverless invocation must finish work before its response can freeze execution.
      if (serverless) await waitForJobs();
      res.status(202).json({ id: job.payload.id });
    },
    job: async (req, res) => {
      const { user } = account(res),
        job = await db.get('job', `${user.id}/${req.params.id}`, user.id);
      if (!job) throw new AppError(404, 'Job not found.');
      res.json(job.payload);
    },
  };
}
