import { Router } from 'express';
import type { Context } from '../../../types/context.ts';
import { authController } from '../controllers/auth.controller.ts';
export function publicAuthRoutes(context: Context) {
  const r = Router(),
    c = authController(context);
  r.get('/me', c.me);
  r.get('/auth/github', c.begin);
  r.get('/auth/github/callback', c.callback);
  r.post('/demo/login', c.demo);
  return r;
}
export function privateAuthRoutes(context: Context) {
  const r = Router(),
    c = authController(context);
  r.post('/logout', c.logout);
  r.post('/demo/reconnect', c.reconnect);
  return r;
}
