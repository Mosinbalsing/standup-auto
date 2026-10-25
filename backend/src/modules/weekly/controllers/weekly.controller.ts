import type { Context, Controller } from '../../../types/context.ts';
import { account } from '../../../types/context.ts';
import { dateString, shortText, requireValue } from '../../../utils/errors.ts';
import { localDate, monday } from '../../../utils/dates.ts';
import { weekly } from '../../standup/services/standup.service.ts';
export function weeklyController({ db }: Context): Record<string, Controller> {
  return {
    get: async (req, res) => {
      const { user } = account(res),
        start = dateString(req.query.start || monday(localDate(user.timezone))),
        edited = await db.get('recap', `${user.id}/${start}`, user.id);
      res.json({
        ...(await weekly(db, user, start)),
        edited: edited?.payload.text || null,
        version: edited?.version || 0,
      });
    },
    save: async (req, res) => {
      const { user } = account(res),
        data = req.body,
        start = dateString(data.start);
      requireValue(
        Number.isInteger(data.version) && data.version >= 0,
        'Provide the recap version.',
      );
      const saved = await db.put(
        'recap',
        `${user.id}/${start}`,
        user.id,
        { text: shortText(data.text, 'Recap', 20000) },
        data.version,
      );
      res.json({ text: saved.payload.text, version: saved.version });
    },
  };
}
