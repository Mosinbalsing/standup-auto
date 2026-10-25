import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

export function configuration(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const origin =
    env.APP_ORIGIN ||
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://127.0.0.1:5190');
  const url = new URL(origin);
  if (url.origin !== origin)
    throw new Error('APP_ORIGIN must be an origin without a path or trailing slash.');
  if (production && url.protocol !== 'https:')
    throw new Error('Production requires an HTTPS APP_ORIGIN.');
  const dataDir = resolve(env.DATA_DIR || '.data');
  if ((env.DATABASE_DRIVER || 'sqlite') === 'sqlite') mkdirSync(dataDir, { recursive: true });
  let key = env.TOKEN_ENCRYPTION_KEY;
  if (!key && production) throw new Error('Set TOKEN_ENCRYPTION_KEY before running in production.');
  if (!key) {
    const file = resolve(dataDir, 'encryption-key');
    if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString('base64'), { mode: 0o600 });
    key = readFileSync(file, 'utf8').trim();
  }
  if (Buffer.from(key, 'base64').length !== 32)
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64.');
  return {
    production,
    origin,
    port: Number(env.PORT || 5190),
    host: env.HOST || (production ? '0.0.0.0' : '127.0.0.1'),
    dataDir,
    allowDemo: env.ALLOW_DEMO === 'true' || (!production && env.ALLOW_DEMO !== 'false'),
    encryptionKey: Buffer.from(key, 'base64'),
    githubClient: env.GITHUB_CLIENT_ID || '',
    githubSecret: env.GITHUB_CLIENT_SECRET || '',
    githubScope: env.GITHUB_SCOPE || '',
    jobSecret: env.JOB_SECRET || '',
    databaseDriver: env.DATABASE_DRIVER || 'sqlite',
    supabaseUrl: env.SUPABASE_URL || '',
    supabaseKey: env.SUPABASE_SECRET_KEY || '',
  };
}
