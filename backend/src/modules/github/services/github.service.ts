import { AppError } from '../../../utils/errors.ts';
import { decrypt, encrypt } from '../../../utils/security.ts';

export class GitHub {
  token: string;
  request: typeof fetch;
  constructor(token, request = fetch) {
    this.token = token;
    this.request = request;
  }
  async get(path) {
    if (!path.startsWith('/') || path.startsWith('//'))
      throw new Error('Use a relative GitHub API path.');
    const res = await this.request(`https://api.github.com${path}`, {
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
        'User-Agent': 'Standup-Auto',
      },
    });
    if (res.status === 401)
      throw new AppError(
        401,
        'GitHub authorization expired. Reconnect your account.',
        'GITHUB_RECONNECT',
      );
    if ([403, 429].includes(res.status))
      throw new AppError(
        429,
        'GitHub access or rate limit reached. Check repository access, then retry later.',
        'GITHUB_LIMIT',
      );
    if (!res.ok)
      throw new AppError(
        502,
        'GitHub could not return this activity. Retry the sync.',
        'GITHUB_UNAVAILABLE',
      );
    return { data: await res.json(), next: !!res.headers.get('link')?.includes('rel="next"') };
  }
  async pages(path, search = false) {
    const all: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data, next } = await this.get(
        `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
      );
      if (search && data.incomplete_results)
        throw new AppError(502, 'GitHub search returned incomplete activity. Retry later.');
      all.push(...(search ? data.items : data));
      if (!next) return all;
    }
    throw new AppError(
      422,
      'This account has more activity than one sync can safely collect. Select fewer repositories.',
    );
  }
  repositories() {
    return this.pages(
      '/user/repos?sort=updated&affiliation=owner,collaborator,organization_member',
    );
  }
  search(query) {
    return this.pages('/search/issues?q=' + encodeURIComponent(query), true);
  }
}

export async function accessToken(db, userId, config, request = fetch) {
  const integration = await db.get('integration', userId, userId);
  if (!integration?.payload.connected)
    throw new AppError(409, 'Connect GitHub before syncing.', 'GITHUB_DISCONNECTED');
  const saved = integration.payload;
  if (saved.expiresAt && saved.expiresAt < Date.now() + 60000) {
    if (!saved.refreshToken)
      throw new AppError(401, 'Reconnect GitHub to refresh authorization.', 'GITHUB_RECONNECT');
    const response = await request('https://github.com/login/oauth/access_token', {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: config.githubClient,
        client_secret: config.githubSecret,
        grant_type: 'refresh_token',
        refresh_token: decrypt(saved.refreshToken, config.encryptionKey),
      }),
    });
    const token = await response.json();
    if (!response.ok || !token.access_token)
      throw new AppError(401, 'Reconnect GitHub to refresh authorization.', 'GITHUB_RECONNECT');
    saved.token = encrypt(token.access_token, config.encryptionKey);
    saved.refreshToken = token.refresh_token
      ? encrypt(token.refresh_token, config.encryptionKey)
      : saved.refreshToken;
    saved.expiresAt = token.expires_in ? Date.now() + token.expires_in * 1000 : null;
    await db.put('integration', userId, userId, saved, integration.version);
  }
  return decrypt(saved.token, config.encryptionKey);
}

export async function collectRepository(client, repo, user, start, end) {
  const name = repo.fullName;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(name))
    throw new AppError(400, 'Invalid GitHub repository name.');
  const encode = (value) => encodeURIComponent(value);
  const commits = await client.pages(
    `/repos/${name}/commits?author=${encode(user.login)}&sha=${encode(repo.defaultBranch)}&since=${encode(start)}&until=${encode(end)}`,
  );
  const issues = await client.search(
    `repo:${name} is:pr author:${user.login} updated:>=${start.slice(0, 10)}`,
  );
  const reviews = await client.search(
    `repo:${name} is:pr reviewed-by:${user.login} updated:>=${start.slice(0, 10)}`,
  );
  const items = commits.map((c) => ({
    id: `${repo.id}:commit:${c.sha}`,
    type: 'commit',
    title: c.commit.message.split('\n')[0],
    sourceUrl: c.html_url,
    repositoryId: repo.id,
    repository: name,
    occurredAt: c.commit.author.date,
    sha: c.sha,
  }));
  for (const issue of issues) {
    const { data: pr } = await client.get(`/repos/${name}/pulls/${issue.number}`);
    const includedCommits = pr.merged_at
      ? await client.pages(`/repos/${name}/pulls/${issue.number}/commits`)
      : [];
    items.push({
      id: `${repo.id}:pr:${pr.number}`,
      type: 'pull_request',
      title: pr.title,
      sourceUrl: pr.html_url,
      repositoryId: repo.id,
      repository: name,
      occurredAt: pr.merged_at || pr.created_at,
      status: pr.merged_at ? 'merged' : pr.state,
      number: pr.number,
      createdAt: pr.created_at,
      commitShas: includedCommits.map((c) => c.sha),
      reviewRequested: pr.requested_reviewers.length > 0,
    });
  }
  for (const issue of reviews) {
    const list = await client.pages(`/repos/${name}/pulls/${issue.number}/reviews`);
    for (const review of list.filter(
      (r) => String(r.user.id) === String(user.githubId) && r.submitted_at,
    )) {
      items.push({
        id: `${repo.id}:review:${review.id}`,
        type: 'review',
        title: issue.title,
        sourceUrl: review.html_url,
        repositoryId: repo.id,
        repository: name,
        occurredAt: review.submitted_at,
        status: review.state,
        number: issue.number,
      });
    }
  }
  // Stale open PRs need not have changed in the daily collection window.
  const open = await client.search(`repo:${name} is:pr is:open author:${user.login}`);
  for (const pr of open) {
    if (!items.some((item) => item.id === `${repo.id}:pr:${pr.number}`))
      items.push({
        id: `${repo.id}:pr:${pr.number}`,
        type: 'pull_request',
        title: pr.title,
        sourceUrl: pr.html_url,
        repositoryId: repo.id,
        repository: name,
        occurredAt: pr.created_at,
        createdAt: pr.created_at,
        status: 'open',
        number: pr.number,
        commitShas: [],
      });
  }
  return items;
}
