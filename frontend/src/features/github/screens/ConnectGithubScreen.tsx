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
  const [selected, setSelected] = useState(() =>
      workspace.repositories.filter((r) => r.selected).map((r) => r.id),
    ),
    client = useQueryClient(),
    navigate = useNavigate(),
    toast = useToast();
  const refresh = useMutation({
    mutationFn: refreshRepositories,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  });
  const save = useMutation({
    mutationFn: saveRepositories,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  });
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
          <Button variant="default" disabled={save.isPending} onClick={() => submit()}>
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
        <Button disabled={refresh.isPending} onClick={() => refresh.mutate()}>
          <RefreshCw size={16} />
          Refresh repository list
        </Button>
      </Card>
      {(save.error || refresh.error) && (
        <div role="alert" className="workspace-error">
          {(save.error || refresh.error)?.message}
        </div>
      )}
      <Card>
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
            {workspace.repositories.map((repo) => (
              <tr key={repo.id}>
                <td>
                  <label>
                    <span className="sr-only">Include {repo.fullName}</span>
                    <Input
                      type="checkbox"
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
        {!workspace.repositories.length && (
          <div className="workspace-empty">
            <h2>No repositories loaded</h2>
            <p>Refresh the list after connecting GitHub.</p>
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
          disabled={save.isPending || sync.pending || !selected.length}
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
