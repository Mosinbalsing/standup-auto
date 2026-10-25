import express from 'express';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { configuration } from './config/env.ts';
import { openStore } from './config/database.ts';
import { createExpressApp, frontendRoot } from './app.ts';
import { waitForJobs } from './jobs/dailyStandup.job.ts';
import { errorMiddleware } from './middleware/error.middleware.ts';

const config = configuration(),
  db = openStore(config),
  app = createExpressApp({ config, db }),
  server = createServer(app);
let vite: { close: () => Promise<void> } | undefined;
if (config.production) {
  app.use(express.static(resolve(frontendRoot, 'dist'), { index: false }));
  app.use((req, res, next) => {
    if (
      !['GET', 'HEAD'].includes(req.method) ||
      req.path.startsWith('/api') ||
      /\.[a-z0-9]+$/i.test(req.path)
    )
      return next();
    res.sendFile(resolve(frontendRoot, 'dist/index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const development = await createViteServer({
    root: frontendRoot,
    configFile: resolve(frontendRoot, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: { server } },
    appType: 'spa',
  });
  vite = development;
  app.use(development.middlewares);
}
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});
app.use(errorMiddleware);
server.listen(config.port, config.host, () =>
  console.log(
    `Standup Auto: ${config.origin}\nFrontend: React + Vite\nBackend: Express\nGitHub sign-in: ${config.githubClient && config.githubSecret ? 'configured' : 'not configured — sample mode available'}`,
  ),
);
const stop = () =>
  server.close(async () => {
    await waitForJobs();
    await vite?.close();
    db.close();
    process.exit(0);
  });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
