import { Router } from 'express';
import type { Context } from '../../../types/context.ts';
import { weeklyController } from '../controllers/weekly.controller.ts';
export function weeklyRoutes(context: Context) {
  const r = Router(),
    c = weeklyController(context);
  r.get('/weekly', c.get);
  r.put('/weekly', c.save);
  return r;
}
