export interface User {
  id: string;
  name: string;
  login: string;
  mode: 'demo' | 'github';
  timezone: string;
  standupTime: string;
  workingDays: number[];
  activityWindow: 'yesterday' | 'previous-working-day';
  scheduledSync: boolean;
}
export interface Session {
  user: User | null;
  csrf: string | null;
  demoAllowed: boolean;
  githubConfigured: boolean;
  privateRepoScope: boolean;
}
export interface Repository {
  id: string;
  fullName: string;
  description: string;
  private: boolean;
  selected: boolean;
  defaultBranch: string;
}
export interface Activity {
  id: string;
  repositoryId: string;
  repository: string;
  type: 'commit' | 'pull_request' | 'review';
  title: string;
  status?: string;
  sourceUrl: string | null;
  occurredAt: string;
  number?: number;
  sha?: string;
}
export type Section = 'yesterday' | 'today' | 'blockers';
export interface Bullet {
  id: string;
  text: string;
  manual: boolean;
  sourceIds: string[];
}
export interface Standup {
  date: string;
  version: number;
  reviewed: boolean;
  items: Record<Section, Bullet[]>;
}
export interface SyncResult {
  partial: boolean;
  repositories: {
    id: string;
    name: string;
    status: 'success' | 'failed';
    message?: string;
    count?: number;
  }[];
}
export interface Workspace {
  user: User;
  csrf: string;
  date: string;
  repositories: Repository[];
  activity: Activity[];
  standup: Standup | null;
  connected: boolean;
  sync: SyncResult | null;
  blockers: { id: string; title: string; ageDays: number; reason: string }[];
}
export interface Recap {
  start: string;
  days: { date: string; status: string }[];
  highlights: (Bullet & { date: string })[];
  reviewedCount: number;
  edited: string | null;
  version: number;
}
export interface SyncJob {
  id: string;
  status: 'running' | 'succeeded' | 'partial' | 'failed';
  message?: string;
  result?: SyncResult;
}
