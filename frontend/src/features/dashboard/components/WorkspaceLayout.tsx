import { useTheme } from '@/theme/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, LogOut } from 'lucide-react';
import { Brand } from '@/components/Header/Brand';
import { Sidebar, navigation } from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Loader } from '@/components/Loader/Loader';
import { logout } from '@/features/auth/api/auth.api';
import { useSync } from '@/features/github/hooks/useSync';
import { useWorkspace } from '../hooks/useWorkspace';
import type { Workspace } from '@/types/api';
export interface WorkspaceContext {
  workspace: Workspace;
  setDate: (date: string) => void;
  sync: ReturnType<typeof useSync>;
}
export const useWorkspaceContext = () => useOutletContext<WorkspaceContext>();
export function WorkspaceLayout() {
  const { theme, setTheme } = useTheme();
  const [date, setDate] = useState<string>(),
    [menu, setMenu] = useState(false),
    query = useWorkspace(date),
    sync = useSync(),
    location = useLocation(),
    client = useQueryClient();
  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      client.clear();
      window.location.assign('/login');
    },
  });
  const title = navigation.find((n) => n.path === location.pathname)?.name || 'Today';
  if (query.isPending) return <Loader />;
  if (query.isError)
    return (
      <main className="loading-screen">
        <h1>Unable to open the workspace</h1>
        <p role="alert">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Retry</Button>
      </main>
    );
  const workspace = query.data;
  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">
        <Brand />
        <Sidebar />
        <div className="workspace-account">
          <strong>{workspace.user.name}</strong>
          <p>
            @{workspace.user.login} ·{' '}
            {workspace.user.mode === 'demo' ? 'Sample account' : 'GitHub connected account'}
          </p>
          <Button disabled={signOut.isPending} onClick={() => signOut.mutate()}>
            <LogOut size={16} />
            Sign out
          </Button>
          {signOut.error && <p role="alert">{signOut.error.message}</p>}
        </div>
      </aside>
      <div className="min-w-0">
        <header className="workspace-mobile">
          <Brand />
          <Button size="icon" aria-label="Open navigation" onClick={() => setMenu(true)}>
            <Menu />
          </Button>
        </header>
        <main id="main" className="workspace-main">
          <div className="workspace-breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <span>{title}</span>
            <Button
              size="icon"
              className="theme-toggle"
              aria-label={theme === 'light' ? 'Use dark mode' : 'Use light mode'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </Button>
            <span className="badge">
              {workspace.user.mode === 'demo' ? 'Sample-data account' : 'Your GitHub data'}
            </span>
          </div>
          {sync.error && (
            <div className="workspace-error" role="alert">
              {sync.error.message}
            </div>
          )}
          {sync.pending && (
            <div className="workspace-job" role="status">
              Collecting repository activity…
            </div>
          )}
          {sync.status === 'partial' && (
            <div className="workspace-error" role="alert">
              Some repositories failed. Check sync status and retry.
            </div>
          )}
          <Outlet context={{ workspace, setDate, sync } satisfies WorkspaceContext} />
        </main>
      </div>
      <Modal open={menu} onOpenChange={setMenu} title="Navigation">
        <Sidebar onNavigate={() => setMenu(false)} />
        <Button onClick={() => signOut.mutate()}>Sign out</Button>
      </Modal>
    </div>
  );
}
