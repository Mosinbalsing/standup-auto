import { Router } from 'express';
import type { Context } from '../../../types/context.ts';
import { settingsController } from '../controllers/settings.controller.ts';
export function settingsRoutes(context: Context) {
  const r = Router(),
    c = settingsController(context);
  r.patch('/settings', c.save);
  r.post('/disconnect', c.disconnect);
  r.delete('/me/data', c.delete);
  return r;
}
