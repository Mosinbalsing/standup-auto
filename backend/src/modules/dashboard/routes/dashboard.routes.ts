import { Router } from 'express';
import type { Context } from '../../../types/context.ts';
import { workspaceController } from '../controllers/dashboard.controller.ts';
export function dashboardRoutes(context: Context) {
  return Router().get('/workspace', workspaceController(context));
}
