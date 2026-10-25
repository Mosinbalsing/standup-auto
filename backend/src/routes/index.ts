import { Router } from 'express';
import type { Context } from '../types/context.ts';
import { readSession, requireAccount } from '../middleware/auth.middleware.ts';
import { publicAuthRoutes, privateAuthRoutes } from '../modules/auth/routes/auth.routes.ts';
import { dashboardRoutes } from '../modules/dashboard/routes/dashboard.routes.ts';
import { githubRoutes } from '../modules/github/routes/github.routes.ts';
import { standupRoutes } from '../modules/standup/routes/standup.routes.ts';
import { weeklyRoutes } from '../modules/weekly/routes/weekly.routes.ts';
import { settingsRoutes } from '../modules/settings/routes/settings.routes.ts';
import { syncDue, waitForJobs } from '../jobs/dailyStandup.job.ts';
import { equal } from '../utils/security.ts';
import { AppError } from '../utils/errors.ts';
export function apiRoutes(context: Context) {
  const router = Router();
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    context.throttle(`api:${req.socket.remoteAddress}`, 300);
    next();
  });
  router.get('/health', (_req, res) => res.json({ ok: true }));
  router.post('/jobs/run', async (req, res) => {
    if (
      !context.config.jobSecret ||
      !equal(req.headers.authorization, `Bearer ${context.config.jobSecret}`)
    )
      throw new AppError(401, 'A valid scheduler credential is required.');
    const result = await syncDue(context.db, context.config);
    if (context.serverless) await waitForJobs();
    res.json(result);
  });
  router.use(readSession(context), publicAuthRoutes(context), requireAccount(context));
  router.use(
    privateAuthRoutes(context),
    dashboardRoutes(context),
    githubRoutes(context),
    standupRoutes(context),
    weeklyRoutes(context),
    settingsRoutes(context),
  );
  router.use(() => {
    throw new AppError(404, 'API endpoint not found.');
  });
  return router;
}
