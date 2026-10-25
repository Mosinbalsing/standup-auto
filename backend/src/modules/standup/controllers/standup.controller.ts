import type { Context, Controller } from '../../../types/context.ts';
import { account } from '../../../types/context.ts';
import { AppError, dateString, requireValue, shortText } from '../../../utils/errors.ts';
import { localDate } from '../../../utils/dates.ts';
import { ensureStandup, validateItems, formatStandup } from '../services/standup.service.ts';
import { standupSaveSchema } from '../schemas/standup.schema.ts';
export function standupController({ db }: Context): Record<string, Controller> {
  return {
    get: async (req, res) => {
      const { user } = account(res),
        date = dateString(req.params.date),
        row = await ensureStandup(db, user, date);
      res.json({ ...row.payload, version: row.version });
    },
    save: async (req, res) => {
      const { user } = account(res),
        date = dateString(req.params.date),
        data = standupSaveSchema.parse(req.body),
        id = `${user.id}/${date}`;
      const old = await db.get('standup', id, user.id),
        activity = (await db.list('activity', user.id)).map((r) => r.payload);
      const items = validateItems(
        data.items,
        old?.payload.items || { yesterday: [], today: [], blockers: [] },
        activity,
      );
      const saved = await db.put(
        'standup',
        id,
        user.id,
        {
          date,
          timezone: user.timezone,
          items,
          reviewed: data.reviewed,
          updatedAt: new Date().toISOString(),
        },
        data.version,
      );
      res.json({ ...saved.payload, version: saved.version });
    },
    export: async (req, res) => {
      const { user } = account(res),
        date = dateString(req.query.date || localDate(user.timezone)),
        row = await db.get('standup', `${user.id}/${date}`, user.id);
      if (!row) throw new AppError(404, 'Save a standup before exporting.');
      const format = String(req.query.format || 'plain');
      requireValue(
        ['plain', 'slack', 'whatsapp'].includes(format),
        'Choose plain, slack, or whatsapp.',
      );
      res.json({ text: formatStandup(row.payload, format) });
    },
    dismiss: async (req, res) => {
      const { user } = account(res),
        id = shortText(req.body.activityId, 'Activity ID', 300);
      requireValue(
        !!(await db.get('activity', `${user.id}/${id}`, user.id)),
        'Activity not found.',
        404,
      );
      await db.put('dismissal', `${user.id}/${id}`, user.id, { activityId: id });
      res.json({ ok: true });
    },
  };
}
