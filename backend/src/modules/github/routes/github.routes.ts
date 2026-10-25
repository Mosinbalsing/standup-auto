import { Router } from 'express';
import type { Context } from '../../../types/context.ts';
import { githubController } from '../controllers/github.controller.ts';
export function githubRoutes(context: Context) {
  const r = Router(),
    c = githubController(context);
  r.post('/repositories/refresh', c.refresh);
  r.put('/repositories', c.select);
  r.post('/sync', c.sync);
  r.get('/jobs/:id', c.job);
  return r;
}
