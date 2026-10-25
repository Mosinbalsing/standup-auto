import type { Context, Controller } from '../../../types/context.ts';
import { account } from '../../../types/context.ts';
import { dateString } from '../../../utils/errors.ts';
import { localDate } from '../../../utils/dates.ts';
import { blockerCandidates } from '../../standup/services/standup.service.ts';
export function workspaceController({ db }: Context): Controller {
  return async (req, res) => {
    const auth = account(res),
      user = auth.user,
      date = dateString(req.query.date || localDate(user.timezone));
    const [repos, activity, standup, integration, sync, dismissals] = await Promise.all([
      db.list('repository', user.id),
      db.list('activity', user.id),
      db.get('standup', `${user.id}/${date}`, user.id),
      db.get('integration', user.id, user.id),
      db.get('sync', user.id, user.id),
      db.list('dismissal', user.id),
    ]);
    res.json({
      user,
      csrf: auth.csrf,
      date,
      repositories: repos.map((r) => r.payload),
      activity: activity
        .map((r) => r.payload)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      standup: standup ? { ...standup.payload, version: standup.version } : null,
      connected: !!integration?.payload.connected,
      sync: sync?.payload || null,
      blockers: blockerCandidates(
        activity
          .map((r) => r.payload)
          .filter((a) => repos.some((r) => r.payload.selected && r.payload.id === a.repositoryId)),
        dismissals.map((r) => r.payload.activityId),
      ),
    });
  };
}
