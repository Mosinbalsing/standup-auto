import type { Request, Response } from 'express';
import type { configuration } from '../config/env.ts';
import type { openStore } from '../config/database.ts';
import type { session } from '../utils/security.ts';

export interface Dependencies {
  serverless?: boolean;
  config: ReturnType<typeof configuration>;
  db: ReturnType<typeof openStore>;
  request?: typeof fetch;
}
export interface Context extends Dependencies {
  request: typeof fetch;
  throttle: (key: string, maximum: number) => void;
}
export type Controller = (req: Request, res: Response) => Promise<unknown> | unknown;
export const account = (res: Response) =>
  res.locals.account as NonNullable<Awaited<ReturnType<typeof session>>>;
