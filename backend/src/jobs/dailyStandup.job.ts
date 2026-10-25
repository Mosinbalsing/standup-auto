import { randomUUID } from 'node:crypto';
import { syncUser } from '../modules/github/services/sync.service.ts';
import { localDate } from '../utils/dates.ts';

const tasks = new Set();
export async function startSyncJob(db, user, config, id = randomUUID()) {
  const payload = { id, status: 'running', createdAt: new Date().toISOString(), finishedAt: null };
  const job = await db.put('job', `${user.id}/${id}`, user.id, payload, 0);
  const task = (async () => {
    try {
      const result = await syncUser(db, user, config);
      if (!(await db.get('user', user.id, user.id))) return;
      await db.put('job', job.id, user.id, {
        ...payload,
        status: result.partial ? 'partial' : 'succeeded',
        result,
        finishedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (!(await db.get('user', user.id, user.id))) return;
      await db.put('job', job.id, user.id, {
        ...payload,
        status: 'failed',
        message: error.status ? error.message : 'Sync failed. Retry after checking GitHub access.',
        finishedAt: new Date().toISOString(),
      });
    }
  })()
    .catch(() => {})
    .finally(() => tasks.delete(task));
  tasks.add(task);
  return job;
}
export async function waitForJobs() {
  await Promise.allSettled([...tasks]);
}

export async function syncDue(db, config, now = new Date()) {
  let started = 0;
  for (const record of await db.users()) {
    const user = record.payload;
    if (!user.scheduledSync) continue;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: user.timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const part = (key) => parts.find((p) => p.type === key)!.value;
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday'));
    if (
      !user.workingDays.includes(weekday) ||
      `${part('hour')}:${part('minute')}` < user.standupTime
    )
      continue;
    let id;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = `daily:${localDate(user.timezone, now)}:${attempt}`;
      const old = await db.get('job', `${user.id}/${candidate}`, user.id);
      if (!old) {
        id = candidate;
        break;
      }
      if (old.payload.status === 'succeeded' || old.payload.status === 'running') break;
    }
    if (!id) continue;
    if (!(await db.get('integration', user.id, user.id))?.payload.connected) continue;
    try {
      await startSyncJob(db, user, config, id);
      started++;
    } catch (e) {
      if (e.status !== 409) throw e;
    }
  }
  return { started };
}
