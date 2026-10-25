import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { AppError } from '../utils/errors.ts';

// One record shape for both stores. Ownership is explicit at every read and write.
export function sqliteStore(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS records (
      kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT NOT NULL,
      payload TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (kind, id)
    );
    CREATE INDEX IF NOT EXISTS records_owner ON records(owner, kind);`);
  const decode = (row) => row && { ...row, payload: JSON.parse(row.payload) };
  return {
    async get(kind, id, owner) {
      return decode(
        db.prepare('SELECT * FROM records WHERE kind=? AND id=? AND owner=?').get(kind, id, owner),
      );
    },
    async findSession(id) {
      return decode(db.prepare("SELECT * FROM records WHERE kind='session' AND id=?").get(id));
    },
    async list(kind, owner) {
      return db
        .prepare('SELECT * FROM records WHERE kind=? AND owner=?')
        .all(kind, owner)
        .map(decode);
    },
    async put(kind, id, owner, payload, expected?: number) {
      const json = JSON.stringify(payload);
      let row;
      if (expected === 0) {
        row = db
          .prepare('INSERT INTO records VALUES(?,?,?,?,1) ON CONFLICT DO NOTHING RETURNING *')
          .get(kind, id, owner, json);
      } else if (Number.isInteger(expected)) {
        row = db
          .prepare(
            'UPDATE records SET payload=?,version=version+1 WHERE kind=? AND id=? AND owner=? AND version=? RETURNING *',
          )
          .get(json, kind, id, owner, expected!);
      } else {
        row = db
          .prepare(
            `INSERT INTO records VALUES(?,?,?,?,1) ON CONFLICT(kind,id)
          DO UPDATE SET payload=excluded.payload,version=records.version+1 WHERE records.owner=excluded.owner RETURNING *`,
          )
          .get(kind, id, owner, json);
      }
      if (!row)
        throw new AppError(
          409,
          'This record changed. Reload before saving again.',
          'VERSION_CONFLICT',
        );
      return decode(row);
    },
    async remove(kind, id, owner) {
      db.prepare('DELETE FROM records WHERE kind=? AND id=? AND owner=?').run(kind, id, owner);
    },
    async deleteOwner(owner) {
      db.prepare('DELETE FROM records WHERE owner=?').run(owner);
    },
    async users() {
      return db.prepare("SELECT * FROM records WHERE kind='user'").all().map(decode);
    },
    close() {
      db.close();
    },
  };
}

export function supabaseStore(url, key, request = fetch) {
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY.');
  const base = new URL('/rest/v1/sa_records', url);
  if (base.protocol !== 'https:') throw new Error('Supabase requires HTTPS.');
  async function call(
    method,
    filters: Record<string, string> = {},
    body?: unknown,
    prefer = 'return=representation',
  ) {
    const target = new URL(base);
    for (const [k, v] of Object.entries(filters)) target.searchParams.set(k, v);
    const response = await request(target, {
      method,
      signal: AbortSignal.timeout(20000),
      headers: {
        apikey: key,
        ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }),
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 409)
      throw new AppError(409, 'Reload before saving again.', 'VERSION_CONFLICT');
    if (!response.ok)
      throw new AppError(
        503,
        'Database unavailable. Check server database configuration and retry.',
        'DATABASE_UNAVAILABLE',
      );
    return response.status === 204 ? [] : response.json();
  }
  async function readAll(filters) {
    const all: any[] = [];
    for (let offset = 0; offset < 10000; offset += 500) {
      const page = await call('GET', { ...filters, limit: '500', offset: String(offset) });
      all.push(...page);
      if (page.length < 500) return all;
    }
    throw new AppError(503, 'Too many records for one request. Contact the administrator.');
  }
  return {
    async get(kind, id, owner) {
      return (await call('GET', { kind: `eq.${kind}`, id: `eq.${id}`, owner: `eq.${owner}` }))[0];
    },
    async findSession(id) {
      return (await call('GET', { kind: 'eq.session', id: `eq.${id}` }))[0];
    },
    async list(kind, owner) {
      return readAll({ kind: `eq.${kind}`, owner: `eq.${owner}` });
    },
    async put(kind, id, owner, payload, expected?: number) {
      if (expected === undefined) {
        const old = await this.get(kind, id, owner);
        return this.put(kind, id, owner, payload, old?.version || 0);
      }
      const rows =
        expected === 0
          ? await call('POST', {}, { kind, id, owner, payload, version: 1 })
          : await call(
              'PATCH',
              {
                kind: `eq.${kind}`,
                id: `eq.${id}`,
                owner: `eq.${owner}`,
                version: `eq.${expected}`,
              },
              { payload, version: expected + 1 },
            );
      if (!rows[0])
        throw new AppError(
          409,
          'This record changed. Reload before saving again.',
          'VERSION_CONFLICT',
        );
      return rows[0];
    },
    async remove(kind, id, owner) {
      await call('DELETE', { kind: `eq.${kind}`, id: `eq.${id}`, owner: `eq.${owner}` });
    },
    async deleteOwner(owner) {
      await call('DELETE', { owner: `eq.${owner}` });
    },
    async users() {
      return readAll({ kind: 'eq.user' });
    },
    close() {},
  };
}

export function openStore(config) {
  if (config.databaseDriver === 'supabase')
    return supabaseStore(config.supabaseUrl, config.supabaseKey);
  if (config.databaseDriver !== 'sqlite')
    throw new Error('DATABASE_DRIVER must be sqlite or supabase.');
  return sqliteStore(resolve(config.dataDir, 'standup.sqlite'));
}
