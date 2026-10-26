import { Input } from '@/components/ui/input';
import { Github } from '@/components/ui/GithubIcon';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeading } from '@/components/Header/PageHeading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorkspaceContext } from '@/features/dashboard/components/WorkspaceLayout';
import { refreshRepositories, saveRepositories } from '../api/github.api';
import { useToast } from '@/hooks/useToast';
export function ConnectGithubScreen() {
  const { workspace, sync } = useWorkspaceContext();
  return (
    <RepositorySelector
      key={workspace.repositories.map((r) => r.id + ':' + r.selected).join(',')}
      workspace={workspace}
      sync={sync}
    />
  );
}
function RepositorySelector({
  workspace,
  sync,
}: Pick<ReturnType<typeof useWorkspaceContext>, 'workspace' | 'sync'>) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() =>
      workspace.repositories.filter((r) => r.selected).map((r) => r.id),
    ),
    client = useQueryClient(),
    navigate = useNavigate(),
    toast = useToast();
  const refresh = useMutation({
    mutationFn: refreshRepositories,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['workspace'] }); },
  });
  const save = useMutation({
    mutationFn: saveRepositories,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['workspace'] }); },
  });
  const matches = workspace.repositories.filter(repo =>
    (repo.fullName + ' ' + repo.description).toLowerCase().includes(search.trim().toLowerCase()));
  const allMatchingSelected = matches.length > 0 && matches.every(repo => selected.includes(repo.id));
  function toggleMatching() {
    const visible = new Set(matches.map(repo => repo.id));
    setSelected(current => allMatchingSelected
      ? current.filter(id => !visible.has(id))
      : [...new Set([...current, ...visible])]);
  }
  async function submit(andSync = false) {
    try {
      await save.mutateAsync(selected);
      toast('Repository selection saved.');
      if (andSync) {
        sync.start();
        navigate('/today');
      }
    } catch {}
  }
  return (
    <>
      <PageHeading
        title="Choose what goes into your standup."
        subtitle="Selected repositories are the only ones included in sync."
        actions={
          <Button variant="outline" loading={save.isPending} loadingText="Saving selection…" disabled={refresh.isPending} onClick={() => submit()}>
            Save selection
          </Button>
        }
      />
      <Card className="account-card">
        <span className="github-orb">
          <Github size={24} />
        </span>
        <div className="grow">
          <h2>{workspace.user.name}</h2>
          <p>
            @{workspace.user.login} · {workspace.connected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
        <Button loading={refresh.isPending} loadingText="Loading repositories…" disabled={save.isPending} onClick={() => refresh.mutate()}>
          <RefreshCw size={16} />
          Refresh repository list
        </Button>
      </Card>
      {(save.error || refresh.error) && (
        <div role="alert" className="workspace-error">
          {(save.error || refresh.error)?.message}
        </div>
      )}
      <div className="repository-toolbar">
        <label htmlFor="repository-search" className="sr-only">Search repositories</label>
        <Input id="repository-search" type="search" placeholder="Search repositories…" value={search} onChange={event => setSearch(event.target.value)} />
        <Button aria-pressed={allMatchingSelected} disabled={!matches.length || save.isPending || refresh.isPending} onClick={toggleMatching}>
          {allMatchingSelected ? 'Clear matching selection' : search.trim() ? 'Select all matching' : 'Select all'}
        </Button>
      </div>
      <div className="repository-summary" role="status"><strong>{selected.length} selected</strong><span>of {workspace.repositories.length} available repositories · {matches.length} matching</span></div>
      {refresh.isPending && <div className="workspace-job" role="status">Fetching your GitHub repositories. Your saved selection will be preserved.</div>}
      <Card aria-busy={refresh.isPending}>
        <table className="repo-table">
          <caption className="sr-only">Available repositories</caption>
          <thead>
            <tr>
              <th>Select</th>
              <th>Repository</th>
              <th className="optional">Visibility</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((repo) => (
              <tr key={repo.id}>
                <td>
                  <label>
                    <span className="sr-only">Include {repo.fullName}</span>
                    <Input
                      type="checkbox"
                      disabled={save.isPending || refresh.isPending}
                      checked={selected.includes(repo.id)}
                      onChange={(e) =>
                        setSelected((current) =>
                          e.target.checked
                            ? [...current, repo.id]
                            : current.filter((id) => id !== repo.id),
                        )
                      }
                    />
                  </label>
                </td>
                <td>
                  <strong>{repo.fullName}</strong>
                  <small>{repo.description}</small>
                </td>
                <td className="optional">
                  <span className="badge">{repo.private ? 'Private' : 'Public'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!matches.length && (
          <div className="workspace-empty">
            <h2>{workspace.repositories.length ? 'No matching repositories' : 'No repositories loaded'}</h2>
            <p>{workspace.repositories.length ? 'Try a different repository name or clear your search.' : 'Refresh the list after connecting GitHub.'}</p>
          </div>
        )}
      </Card>
      <div className="info-banner">
        <ShieldCheck size={18} />
        Only metadata is stored. No source code or diffs. Repository selection limits collection,
        not OAuth permission scope.
      </div>
      <div className="field-row mt-6">
        <Button
          variant="default"
          loading={save.isPending || sync.pending}
          loadingText={save.isPending ? "Saving selection…" : "Syncing activity…"}
          disabled={refresh.isPending || !selected.length}
          onClick={() => submit(true)}
        >
          <RefreshCw size={16} />
          Save and sync selected
        </Button>
        <Link className="text-link" to="/today">
          Open standup →
        </Link>
      </div>
    </>
  );
}
