import { beginOAuth, finishOAuth, demoLogin } from '../services/auth.service.ts';
import { setCookie, requireOrigin } from '../../../utils/security.ts';
import { requireValue } from '../../../utils/errors.ts';
import { account, type Context, type Controller } from '../../../types/context.ts';

export function authController({
  db,
  config,
  request,
  throttle,
}: Context): Record<string, Controller> {
  return {
    me: (_req, res) =>
      res.json({
        user: res.locals.account?.user || null,
        csrf: res.locals.account?.csrf || null,
        demoAllowed: config.allowDemo,
        githubConfigured: !!(config.githubClient && config.githubSecret),
        privateRepoScope: config.githubScope.includes('repo'),
      }),
    begin: (req, res) => {
      throttle(`login:${req.socket.remoteAddress}`, 15);
      return beginOAuth(db, res, config);
    },
    callback: (req, res) =>
      finishOAuth(db, req, res, new URL(req.originalUrl, config.origin), config, request),
    demo: async (req, res) => {
      requireOrigin(req, config);
      throttle(`demo:${req.socket.remoteAddress}`, 10);
      if (res.locals.account) return res.json({ user: account(res).user, csrf: account(res).csrf });
      res.status(201).json(await demoLogin(db, res, config));
    },
    logout: async (_req, res) => {
      const auth = account(res);
      await db.remove('session', auth.sessionId, auth.user.id);
      setCookie(res, 'sa_session', '', config, 0);
      res.json({ ok: true });
    },
    reconnect: async (_req, res) => {
      const { user } = account(res);
      requireValue(user.mode === 'demo', 'Use GitHub sign-in to reconnect this account.');
      await db.put('integration', user.id, user.id, { connected: true, demo: true });
      res.json({ ok: true });
    },
  };
}
