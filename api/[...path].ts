import type { Request, Response } from 'express';
import { createExpressApp } from '../backend/src/app.ts';
import { configuration } from '../backend/src/config/env.ts';
import { openStore } from '../backend/src/config/database.ts';

let application: ReturnType<typeof createExpressApp> | undefined;
export default function handler(req: Request, res: Response) {
  if (!application) {
    try {
      const config = configuration();
      // Vercel instances have no durable local disk. Never silently use SQLite here.
      if (config.databaseDriver !== 'supabase') throw new Error('Persistent database required.');
      application = createExpressApp({ config, db: openStore(config), serverless: true });
    } catch {
      res
        .status(503)
        .json({
          error: 'The hosted API is awaiting server configuration. Please contact the app owner.',
          code: 'DEPLOYMENT_NOT_CONFIGURED',
        });
      return;
    }
  }
  application(req, res);
}
