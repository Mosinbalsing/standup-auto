import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useDeferredValue } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeading } from '@/components/Header/PageHeading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorkspaceContext } from '../components/WorkspaceLayout';
import { ActivityEvent } from '../components/ActivityEvent';
export function ActivityScreen() {
  const { workspace, sync } = useWorkspaceContext(),
    [search, setSearch] = useState(''),
    [type, setType] = useState('all'),
    [repository, setRepository] = useState('all'),
    [visible, setVisible] = useState(30);
  const query = useDeferredValue(search.toLowerCase());
  const events = useMemo(() => workspace.activity.filter(
    (event) =>
      (event.title + ' ' + event.repository).toLowerCase().includes(query) &&
      (type === 'all' || event.type === type) &&
      (repository === 'all' || event.repositoryId === repository),
  ), [workspace.activity, query, type, repository]);
  return (
    <>
      <PageHeading
        title="Your work, with the evidence."
        subtitle="Inspect collected commits, pull requests, and reviews."
        actions={
          <Button loading={sync.pending} loadingText="Syncing activity…" onClick={sync.start}>
            <RefreshCw size={16} />
            Sync activity
          </Button>
        }
      />
      <div className="workspace-activity-filters">
        <label className="sr-only" htmlFor="activity-query">
          Search activity
        </label>
        <Input
          id="activity-query"
          type="search"
          placeholder="Search activity…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisible(30); }}
        />
        <label className="sr-only" htmlFor="activity-type">
          Activity type
        </label>
        <Select
          id="activity-type"
          label="Activity type"
          value={type}
          onValueChange={(value) => { setType(value); setVisible(30); }}
          options={[
            { value: 'all', label: 'All activity' },
            { value: 'commit', label: 'Commits' },
            { value: 'pull_request', label: 'Pull requests' },
            { value: 'review', label: 'Reviews' },
          ]}
        />
        <label className="sr-only" htmlFor="activity-repo">
          Repository
        </label>
        <Select
          id="activity-repo"
          label="Repository"
          value={repository}
          onValueChange={(value) => { setRepository(value); setVisible(30); }}
          options={[
            { value: 'all', label: 'All repositories' },
            ...workspace.repositories.map((repo) => ({ value: repo.id, label: repo.fullName })),
          ]}
        />
      </div>
      <div className="activity-overview" aria-label="Collected activity summary">
        <div><strong>{workspace.activity.filter(event => event.type === 'commit').length}</strong><span>Commits</span></div>
        <div><strong>{workspace.activity.filter(event => event.type === 'pull_request').length}</strong><span>Pull requests</span></div>
        <div><strong>{workspace.activity.filter(event => event.type === 'review').length}</strong><span>Reviews</span></div>
        <div><strong>{workspace.repositories.filter(repo => repo.selected).length}</strong><span>Selected repositories</span></div>
      </div>
      <p className="activity-result-count" role="status">{events.length} matching events · Select a change to inspect its source</p>
      <Card>
        {events.slice(0, visible).map((event) => (
          <ActivityEvent key={event.id} event={event} />
        ))}
        {!events.length && (
          <div className="workspace-empty">
            <h2>No matching activity</h2>
            <p>Change the filters, or select repositories and run sync.</p>
            <Link className="text-link" to="/repositories">
              Choose repositories →
            </Link>
          </div>
        )}
      </Card>
      {visible < events.length && <Button className="mt-5" onClick={() => setVisible(count => count + 30)}>Show more activity ({events.length - visible} remaining)</Button>}
      <div className="info-banner">
        <Info size={17} />
        Collection covers commits on default branches, authored pull requests, and submitted
        reviews. It is not time tracking.
      </div>
    </>
  );
}
