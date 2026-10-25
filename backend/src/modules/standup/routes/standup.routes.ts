import { Router } from 'express';
import type { Context } from '../../../types/context.ts';
import { standupController } from '../controllers/standup.controller.ts';
export function standupRoutes(context: Context) {
  const r = Router(),
    c = standupController(context);
  r.get('/standups/:date', c.get);
  r.put('/standups/:date', c.save);
  r.get('/export', c.export);
  r.post('/blockers/dismiss', c.dismiss);
  return r;
}
