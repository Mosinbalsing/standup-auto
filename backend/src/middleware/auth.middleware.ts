import type { RequestHandler } from 'express';
import type { Context } from '../types/context.ts';
import { session, requireCsrf } from '../utils/security.ts';
import { AppError } from '../utils/errors.ts';

export const readSession =
  ({ db }: Context): RequestHandler =>
  async (req, res, next) => {
    res.locals.account = await session(db, req);
    next();
  };
export const requireAccount =
  ({ config }: Context): RequestHandler =>
  (req, res, next) => {
    const auth = res.locals.account;
    if (!auth) throw new AppError(401, 'Sign in before opening the workspace.', 'SIGN_IN_REQUIRED');
    if (!['GET', 'HEAD'].includes(req.method)) requireCsrf(req, auth, config);
    next();
  };
