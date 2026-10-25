import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
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
    [repository, setRepository] = useState('all');
  const events = workspace.activity.filter(
    (event) =>
      (event.title + ' ' + event.repository).toLowerCase().includes(search.toLowerCase()) &&
      (type === 'all' || event.type === type) &&
      (repository === 'all' || event.repositoryId === repository),
  );
  return (
    <>
      <PageHeading
        title="Your work, with the evidence."
        subtitle="Inspect collected commits, pull requests, and reviews."
        actions={
          <Button disabled={sync.pending} onClick={sync.start}>
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
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="sr-only" htmlFor="activity-type">
          Activity type
        </label>
        <Select
          id="activity-type"
          label="Activity type"
          value={type}
          onValueChange={setType}
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
          onValueChange={setRepository}
          options={[
            { value: 'all', label: 'All repositories' },
            ...workspace.repositories.map((repo) => ({ value: repo.id, label: repo.fullName })),
          ]}
        />
      </div>
      <Card>
        {events.map((event) => (
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
      <div className="info-banner">
        <Info size={17} />
        Collection covers commits on default branches, authored pull requests, and submitted
        reviews. It is not time tracking.
      </div>
    </>
  );
}
