import type { Context, Controller } from '../../../types/context.ts';
import { account } from '../../../types/context.ts';
import { requireValue } from '../../../utils/errors.ts';
import { validateTimezone } from '../../../utils/dates.ts';
import { setCookie } from '../../../utils/security.ts';
import { settingsSchema } from '../schemas/settings.schema.ts';
export function settingsController({ db, config }: Context): Record<string, Controller> {
  return {
    save: async (req, res) => {
      const { user } = account(res),
        data = settingsSchema.parse(req.body),
        updated = {
          ...user,
          ...data,
          timezone: validateTimezone(data.timezone),
          workingDays: [...new Set(data.workingDays)],
        };
      await db.put('user', user.id, user.id, updated);
      res.json({ user: updated });
    },
    disconnect: async (_req, res) => {
      const { user } = account(res);
      await db.put('integration', user.id, user.id, { connected: false });
      res.json({
        ok: true,
        message:
          'Collection stopped and stored token removed. Revoke app authorization in GitHub to revoke upstream access.',
      });
    },
    delete: async (req, res) => {
      const { user } = account(res);
      requireValue(req.body.confirm === 'DELETE', 'Type DELETE to confirm.');
      await db.deleteOwner(user.id);
      setCookie(res, 'sa_session', '', config, 0);
      res.json({
        ok: true,
        message:
          'Active application data deleted. Host-managed backups follow the hosting retention policy.',
      });
    },
  };
}
