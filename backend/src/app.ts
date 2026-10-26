import express from 'express';
import { createServer } from 'node:http';
import type { Dependencies, Context } from './types/context.ts';
import { apiRoutes } from './routes/index.ts';
import { errorMiddleware } from './middleware/error.middleware.ts';
import { AppError } from './utils/errors.ts';

export function createExpressApp(dependencies: Dependencies) {
  const app = express(),
    limits = new Map<string, { count: number; until: number }>();
  const context: Context = {
    ...dependencies,
    request: dependencies.request || fetch,
    throttle(key, maximum) {
      const now = Date.now();
      let value = limits.get(key);
      if (!value || value.until < now) {
        value = { count: 0, until: now + 60000 };
        limits.set(key, value);
      }
      if (++value.count > maximum)
        throw new AppError(429, 'Too many requests. Wait a minute and retry.');
      if (limits.size > 5000) for (const [id, v] of limits) if (v.until < now) limits.delete(id);
    },
  };
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self'${context.config.production ? '' : " 'unsafe-inline'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'${context.config.production ? '' : ' ws: wss:'}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
    );
    if (context.config.production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  app.use('/api', express.json({ limit: 150000 }), apiRoutes(context), errorMiddleware);
  return app;
}
// Tests use an ephemeral HTTP server without starting Vite or opening a disk database.
export function createApp(dependencies: Dependencies) {
  return createServer(createExpressApp(dependencies));
}
