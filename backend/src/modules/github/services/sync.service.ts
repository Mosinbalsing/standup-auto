import { randomUUID } from 'node:crypto';
import { GitHub, accessToken, collectRepository } from './github.service.ts';
import { localDate, shiftDate, workDate } from '../../../utils/dates.ts';
import { ensureStandup } from '../../standup/services/standup.service.ts';
import { AppError } from '../../../utils/errors.ts';

const running = new Map();
export async function syncUser(db, user, config, request = fetch) {
  if (running.has(user.id)) return running.get(user.id);
  const promise = performSync(db, user, config, request).finally(() => running.delete(user.id));
  running.set(user.id, promise);
  return promise;
}
async function performSync(db, user, config, request) {
  const integration = await db.get('integration', user.id, user.id);
  if (!integration?.payload.connected) throw new AppError(409, 'Reconnect GitHub before syncing.');
  const repos = (await db.list('repository', user.id))
    .filter((r) => r.payload.selected)
    .map((r) => r.payload);
  if (!repos.length) throw new AppError(400, 'Select at least one repository before syncing.');
  const date = localDate(user.timezone),
    day = workDate(date, user);
  const start = shiftDate(day, -1) + 'T00:00:00Z',
    end = shiftDate(date, 1) + 'T23:59:59Z';
  const status = {
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    completedAt: null as string | null,
    repositories: [] as {
      id: string;
      name: string;
      status: string;
      count?: number;
      message?: string;
    }[],
    partial: false,
    scope:
      'Commits on each selected repository’s default branch; authored PRs and submitted reviews.',
  };
  const client =
    user.mode === 'demo'
      ? null
      : new GitHub(await accessToken(db, user.id, config, request), request);
  for (const repo of repos) {
    try {
      const items = client
        ? await collectRepository(client, repo, user, start, end)
        : demoActivity(repo, day);
      // Disconnect or delete during a slow upstream request must prevent late writes.
      const stillConnected = await db.get('integration', user.id, user.id);
      if (!stillConnected?.payload.connected)
        throw new AppError(409, 'Account disconnected during sync.');
      for (const item of items) await db.put('activity', `${user.id}/${item.id}`, user.id, item);
      status.repositories.push({
        id: repo.id,
        name: repo.fullName,
        status: 'success',
        count: items.length,
      });
    } catch (error) {
      status.partial = true;
      status.repositories.push({
        id: repo.id,
        name: repo.fullName,
        status: 'failed',
        message: error.status ? error.message : 'Unable to collect activity. Retry sync.',
      });
    }
  }
  if (!(await db.get('user', user.id, user.id)))
    throw new AppError(401, 'Account deleted during sync.');
  status.completedAt = new Date().toISOString();
  await db.put('sync', user.id, user.id, status);
  // A sync never replaces an existing draft, including user deletions.
  if (status.repositories.some((r) => r.status === 'success')) await ensureStandup(db, user, date);
  return status;
}
export function demoActivity(repo, day) {
  const stamp = new Date(day + 'T12:00:00Z').toISOString();
  return [
    {
      id: `${repo.id}:pr:42`,
      repositoryId: repo.id,
      repository: repo.fullName,
      type: 'pull_request',
      title: repo.id === 'demo-web' ? 'Login validation improvements' : 'Pagination improvements',
      status: 'merged',
      occurredAt: stamp,
      createdAt: stamp,
      sourceUrl: null,
      commitShas: ['demo-sha'],
      number: 42,
    },
    {
      id: `${repo.id}:commit:demo-sha`,
      repositoryId: repo.id,
      repository: repo.fullName,
      type: 'commit',
      title: 'Improve validation',
      occurredAt: stamp,
      sha: 'demo-sha',
      sourceUrl: null,
    },
    {
      id: `${repo.id}:review:45`,
      repositoryId: repo.id,
      repository: repo.fullName,
      type: 'review',
      title: 'Password reset flow',
      occurredAt: stamp,
      status: 'APPROVED',
      number: 45,
      sourceUrl: null,
    },
    {
      id: `${repo.id}:pr:48`,
      repositoryId: repo.id,
      repository: repo.fullName,
      type: 'pull_request',
      title: 'Review requested for follow-up changes',
      occurredAt: shiftDate(day, -4) + 'T12:00:00Z',
      createdAt: shiftDate(day, -4) + 'T12:00:00Z',
      status: 'open',
      number: 48,
      sourceUrl: null,
    },
  ];
}
export async function refreshRepositories(db, user, config, request = fetch) {
  const client = new GitHub(await accessToken(db, user.id, config, request), request);
  const available = await client.repositories();
  const old = await db.list('repository', user.id),
    oldById = new Map<string, any>(old.map((r) => [r.payload.id, r]));
  const ids = new Set();
  for (const repo of available) {
    const id = String(repo.id);
    ids.add(id);
    await db.put('repository', `${user.id}/${id}`, user.id, {
      id,
      fullName: repo.full_name,
      description: repo.description || '',
      private: repo.private,
      defaultBranch: repo.default_branch,
      selected: oldById.get(id)?.payload.selected || false,
    });
  }
  for (const row of old)
    if (!ids.has(row.payload.id)) await db.remove('repository', row.id, user.id);
}
