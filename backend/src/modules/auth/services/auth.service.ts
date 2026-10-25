import { randomUUID, createHash } from 'node:crypto';
import {
  secret,
  hash,
  equal,
  cookies,
  setCookie,
  encrypt,
  createSession,
} from '../../../utils/security.ts';
import { GitHub } from '../../github/services/github.service.ts';
import { AppError } from '../../../utils/errors.ts';

export const userDefaults = (id, profile: Record<string, any> = {}) => ({
  id,
  name: profile.name || profile.login || 'Developer',
  login: profile.login || '',
  githubId: profile.id || null,
  mode: 'github',
  timezone: 'Asia/Kolkata',
  standupTime: '08:30',
  workingDays: [1, 2, 3, 4, 5],
  activityWindow: 'previous-working-day',
  scheduledSync: false,
  createdAt: new Date().toISOString(),
});

export async function demoLogin(db, res, config) {
  if (!config.allowDemo) throw new AppError(404, 'Demo accounts are disabled on this server.');
  const id = `demo:${randomUUID()}`;
  const user = {
    ...userDefaults(id),
    name: 'Demo Developer',
    login: 'sample-developer',
    mode: 'demo',
  };
  await db.put('user', id, id, user);
  await db.put('integration', id, id, { connected: true, demo: true });
  for (const [repoId, name, description] of [
    ['demo-web', 'sample/web-app', 'Product frontend'],
    ['demo-api', 'sample/api-service', 'Backend services'],
  ]) {
    await db.put('repository', `${id}/${repoId}`, id, {
      id: repoId,
      fullName: name,
      description,
      private: true,
      defaultBranch: 'main',
      selected: false,
    });
  }
  const session = await createSession(db, res, user, config);
  return { user, ...session };
}

export async function beginOAuth(db, res, config) {
  if (!config.githubClient || !config.githubSecret)
    throw new AppError(
      503,
      'GitHub sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env, or try sample-data mode.',
      'OAUTH_NOT_CONFIGURED',
    );
  const state = secret(),
    verifier = secret(),
    id = hash(state);
  await db.put('oauth', id, id, { verifier, expires: Date.now() + 10 * 60000 });
  setCookie(res, 'sa_oauth', state, config, 600);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({
    client_id: config.githubClient,
    redirect_uri: `${config.origin}/api/auth/github/callback`,
    scope: config.githubScope,
    state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  }).toString();
  res.writeHead(302, { Location: url.href });
  res.end();
}

export async function finishOAuth(db, req, res, url, config, request = fetch) {
  const state = url.searchParams.get('state'),
    code = url.searchParams.get('code');
  if (!state || !code || !equal(state, cookies(req).sa_oauth))
    throw new AppError(400, 'Sign-in verification failed. Start GitHub sign-in again.');
  const id = hash(state),
    saved = await db.get('oauth', id, id);
  await db.remove('oauth', id, id);
  setCookie(res, 'sa_oauth', '', config, 0);
  if (!saved || saved.payload.expires < Date.now())
    throw new AppError(400, 'Sign-in expired. Start again.');
  const response = await request('https://github.com/login/oauth/access_token', {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.githubClient,
      client_secret: config.githubSecret,
      code,
      redirect_uri: `${config.origin}/api/auth/github/callback`,
      code_verifier: saved.payload.verifier,
    }),
  });
  const token = await response.json();
  if (!response.ok || !token.access_token)
    throw new AppError(401, 'GitHub did not authorize the account. Try sign-in again.');
  const { data: profile } = await new GitHub(token.access_token, request).get('/user');
  if (!profile.id || !profile.login)
    throw new AppError(502, 'GitHub returned an incomplete profile. Try again.');
  const userId = `github:${profile.id}`,
    existing = await db.get('user', userId, userId);
  const user = {
    ...(existing?.payload || userDefaults(userId, profile)),
    name: profile.name || profile.login,
    login: profile.login,
  };
  await db.put('user', userId, userId, user);
  await db.put('integration', userId, userId, {
    connected: true,
    token: encrypt(token.access_token, config.encryptionKey),
    refreshToken: token.refresh_token ? encrypt(token.refresh_token, config.encryptionKey) : null,
    expiresAt: token.expires_in ? Date.now() + token.expires_in * 1000 : null,
  });
  await createSession(db, res, user, config);
  res.writeHead(302, { Location: '/app#/repositories' });
  res.end();
}
