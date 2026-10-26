import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { sqliteStore } from '../backend/src/config/database.ts';
import { encrypt } from '../backend/src/utils/security.ts';
import { forEachConcurrent } from '../backend/src/utils/concurrency.ts';
import { refreshRepositories, selectRepositories } from '../backend/src/modules/github/services/sync.service.ts';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('repository selection writes only changes, bounds I/O, and rejects foreign IDs', async () => {
  const db = sqliteStore(), user = { id: 'alice' };
  try {
    for (let i = 0; i < 42; i++) await db.put('repository', 'alice/' + i, user.id, { id: String(i), selected: false }, 0);
    const put = db.put.bind(db);
    let writes = 0, active = 0, peak = 0;
    db.put = async (...args) => {
      writes++; peak = Math.max(peak, ++active);
      try { await delay(4); return await put(...args); } finally { active--; }
    };
    await selectRepositories(db, user, Array.from({ length: 14 }, (_, i) => String(i)));
    assert.equal(writes, 14); assert.ok(peak > 1 && peak <= 6);
    writes = 0;
    await selectRepositories(db, user, Array.from({ length: 14 }, (_, i) => String(i)));
    assert.equal(writes, 0);
    await assert.rejects(selectRepositories(db, user, ['someone-elses-repository']), { status: 400 });
    assert.equal(writes, 0);
  } finally { db.close(); }
});

test('concurrent I/O waits for active workers before reporting failure', async () => {
  let active = 0;
  await assert.rejects(forEachConcurrent([0,1,2,3], async value => {
    active++; try { await delay(value === 0 ? 1 : 8); if (value === 0) throw new Error('rejected'); }
    finally { active--; }
  }, 2), /rejected/);
  assert.equal(active, 0);
});

test('repository refresh uses real HTTP, skips unchanged rows, and preserves concurrent selection', async () => {
  const db = sqliteStore(), user = { id: 'alice' }, config = { encryptionKey: randomBytes(32) };
  let title = 'owner/repo', calls = 0;
  const upstream = createServer((req, res) => {
    assert.equal(req.headers.authorization, 'Bearer fixture-token');
    assert.ok(req.url.startsWith('/user/repos?'));
    calls++; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify([{ id: 1, full_name: title, description: 'Code', private: false, default_branch: 'main' }]));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const request = (url, options) => fetch('http://127.0.0.1:' + upstream.address().port + new URL(url).pathname + new URL(url).search, options);
  try {
    await db.put('integration', user.id, user.id, { connected: true, token: encrypt('fixture-token', config.encryptionKey) });
    await db.put('repository', 'alice/1', user.id, { id: '1', fullName: title, description: 'Code', private: false, defaultBranch: 'main', selected: false });
    let row = await db.get('repository', 'alice/1', user.id);
    await refreshRepositories(db, user, config, request);
    assert.equal((await db.get('repository', 'alice/1', user.id)).version, row.version);
    title = 'owner/renamed';
    const list = db.list.bind(db);
    db.list = async (...args) => {
      const rows = await list(...args);
      if (args[0] === 'repository') {
        await db.put('repository', 'alice/1', user.id, { ...rows[0].payload, selected: true }, rows[0].version);
        db.list = list;
      }
      return rows;
    };
    await assert.rejects(refreshRepositories(db, user, config, request), { status: 409 });
    row = await db.get('repository', 'alice/1', user.id);
    assert.equal(row.payload.selected, true);
    await refreshRepositories(db, user, config, request);
    row = await db.get('repository', 'alice/1', user.id);
    assert.equal(row.payload.fullName, title); assert.equal(row.payload.selected, true); assert.equal(calls, 3);
  } finally { await new Promise(resolve => upstream.close(resolve)); db.close(); }
});
