import { randomUUID } from 'node:crypto';
import { localDate, workDate, shiftDate } from '../../../utils/dates.ts';
import { requireValue, shortText } from '../../../utils/errors.ts';

export function generateItems(activity, date, user) {
  const day = workDate(date, user);
  const matches = activity.filter((a) => localDate(user.timezone, new Date(a.occurredAt)) === day);
  const mergedShas = new Set(
    matches.filter((a) => a.status === 'merged').flatMap((a) => a.commitShas || []),
  );
  const yesterday = matches
    .filter((a) => !(a.type === 'commit' && mergedShas.has(a.sha)))
    .map((a) => ({
      id: `generated:${a.id}`,
      text: `${a.type === 'commit' ? 'Committed changes: ' : a.type === 'review' ? 'Reviewed: ' : a.status === 'merged' ? 'Merged: ' : 'Opened PR: '}${a.title}`,
      manual: false,
      sourceIds: [a.id],
    }));
  return { yesterday, today: [], blockers: [] };
}
export function validateItems(input, previous, activity) {
  requireValue(
    input && typeof input === 'object' && !Array.isArray(input),
    'Provide standup sections.',
  );
  const existing = new Map<string, any>(
    (Object.values(previous).flat() as any[]).map((i) => [i.id, i]),
  );
  const sources = new Set(activity.map((a) => a.id));
  const ids = new Set();
  const result = {};
  for (const section of ['yesterday', 'today', 'blockers']) {
    requireValue(
      Array.isArray(input[section]) && input[section].length <= 100,
      'Each section supports at most 100 items.',
    );
    result[section] = input[section].map((item) => {
      requireValue(item && typeof item === 'object', 'Provide a valid standup item.');
      const id = shortText(item.id, 'Item ID', 300);
      requireValue(!ids.has(id), 'Each standup item needs a unique ID.');
      ids.add(id);
      const old = existing.get(id);
      // Sources are assigned by the server, never invented by browser input.
      return {
        id,
        text: shortText(item.text, 'Bullet', 2000),
        manual: old?.manual ?? true,
        sourceIds: (old?.sourceIds || []).filter((id) => sources.has(id)),
      };
    });
  }
  return result;
}
export async function ensureStandup(db, user, date) {
  const id = `${user.id}/${date}`;
  const saved = await db.get('standup', id, user.id);
  if (saved) return saved;
  const selected = new Set(
    (await db.list('repository', user.id))
      .filter((r) => r.payload.selected)
      .map((r) => r.payload.id),
  );
  const activity = (await db.list('activity', user.id))
    .map((r) => r.payload)
    .filter((a) => selected.has(a.repositoryId));
  const payload = {
    date,
    timezone: user.timezone,
    items: generateItems(activity, date, user),
    reviewed: false,
    updatedAt: new Date().toISOString(),
  };
  try {
    return await db.put('standup', id, user.id, payload, 0);
  } catch (error) {
    if (error.status === 409) return db.get('standup', id, user.id);
    throw error;
  }
}
export function blockerCandidates(activity, dismissed: string[] = []) {
  return activity
    .filter(
      (a) =>
        a.type === 'pull_request' &&
        a.status === 'open' &&
        Date.now() - +new Date(a.createdAt) >= 3 * 86400000 &&
        !dismissed.includes(a.id),
    )
    .map((a) => ({
      id: a.id,
      title: a.title,
      ageDays: Math.floor((Date.now() - +new Date(a.createdAt)) / 86400000),
      reason: 'Open PR for at least 3 days. Confirm whether this blocks your work.',
      sourceUrl: a.sourceUrl,
    }));
}
export async function weekly(db, user, start) {
  const days = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      db.get('standup', `${user.id}/${shiftDate(start, i)}`, user.id),
    ),
  );
  const reviewed = days.filter((r) => r?.payload.reviewed);
  const seen = new Set(),
    highlights: any[] = [];
  for (const row of reviewed)
    for (const item of row.payload.items.yesterday) {
      const key = item.sourceIds?.length
        ? [...item.sourceIds].sort().join('|')
        : item.text.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        highlights.push({ ...item, date: row.payload.date });
      }
    }
  return {
    start,
    days: Array.from({ length: 5 }, (_, i) => ({
      date: shiftDate(start, i),
      status: !days[i] ? 'missing' : days[i].payload.reviewed ? 'reviewed' : 'draft',
    })),
    highlights,
    reviewedCount: reviewed.length,
  };
}
export function formatStandup(standup, format = 'plain') {
  const marker = format === 'plain' ? '' : '*';
  return ['yesterday', 'today', 'blockers']
    .map(
      (section) =>
        `${marker}${section[0].toUpperCase() + section.slice(1)}${marker}\n` +
        (standup.items[section].map((item) => `• ${item.text}`).join('\n') || '• None reported.'),
    )
    .join('\n\n');
}
export function newManualItem(text) {
  return { id: randomUUID(), text, manual: true, sourceIds: [] };
}
