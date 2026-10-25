import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from 'node:crypto';
import { AppError } from './errors.ts';

export const secret = () => randomBytes(32).toString('base64url');
export const hash = (value) => createHash('sha256').update(value).digest('hex');
export const equal = (a, b) =>
  typeof a === 'string' &&
  typeof b === 'string' &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function encrypt(value, key) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((x) => x.toString('base64url')).join('.');
}
export function decrypt(value, key) {
  const [iv, tag, data] = value.split('.').map((x) => Buffer.from(x, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
export function cookies(req) {
  const result: Record<string, string> = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) result[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return result;
}
export function setCookie(res, name, value, config, seconds = 604800) {
  const cookie = `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${seconds}${config.production ? '; Secure' : ''}`;
  res.appendHeader('Set-Cookie', cookie);
}
export async function createSession(db, res, user, config) {
  const token = secret(),
    csrf = secret(),
    expires = Date.now() + 7 * 86400000;
  await db.put('session', hash(token), user.id, { userId: user.id, csrf, expires });
  setCookie(res, 'sa_session', token, config);
  return { csrf, expires };
}
export async function session(db, req) {
  const token = cookies(req).sa_session;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const record = await db.findSession(hash(token));
  if (!record || record.payload.expires <= Date.now()) return null;
  const user = await db.get('user', record.owner, record.owner);
  return user ? { user: user.payload, csrf: record.payload.csrf, sessionId: record.id } : null;
}
export function requireOrigin(req, config) {
  if (req.headers.origin !== config.origin)
    throw new AppError(403, 'Request must come from this application.', 'ORIGIN_REJECTED');
}
export function requireCsrf(req, auth, config) {
  requireOrigin(req, config);
  if (!equal(req.headers['x-csrf-token'], auth.csrf))
    throw new AppError(403, 'Reload the page and try again.', 'CSRF_REJECTED');
}
