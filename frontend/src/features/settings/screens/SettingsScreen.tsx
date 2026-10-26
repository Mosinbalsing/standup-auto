import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Github } from '@/components/ui/GithubIcon';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { PageHeading } from '@/components/Header/PageHeading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { useWorkspaceContext } from '@/features/dashboard/components/WorkspaceLayout';
import { useTheme } from '@/theme/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import {
  savePreferences,
  disconnect,
  reconnectDemo,
  deleteAccount,
  type Preferences,
} from '../api/settings.api';
export function SettingsScreen() {
  const { workspace } = useWorkspaceContext();
  return <SettingsForm key={JSON.stringify(workspace.user)} workspace={workspace} />;
}
function SettingsForm({
  workspace,
}: {
  workspace: ReturnType<typeof useWorkspaceContext>['workspace'];
}) {
  const [user, setUser] = useState<Preferences>(workspace.user),
    [confirm, setConfirm] = useState<'disconnect' | 'delete' | null>(null),
    [confirmation, setConfirmation] = useState(''),
    { appearance, setTheme, reduced, setReduced } = useTheme(),
    toast = useToast(),
    client = useQueryClient();
  const save = useMutation({
    mutationFn: savePreferences,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['workspace'] });
      await client.invalidateQueries({ queryKey: ['session'] });
      toast('Preferences saved on the server.');
    },
  });
  const connection = useMutation({
    mutationFn: (action: 'disconnect' | 'reconnect') =>
      action === 'disconnect' ? disconnect() : reconnectDemo(),
    onSuccess: async () => {
      setConfirm(null);
      await client.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
  const deletion = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      client.clear();
      window.location.assign('/');
    },
  });
  return (
    <>
      <PageHeading
        title="Make it work your way."
        subtitle="Preferences, appearance, and data controls."
      />
      <div className="workspace-two">
        <Card>
          <CardHeader>
            <h2>Standup preferences</h2>
          </CardHeader>
          <form
            className="panel-body workspace-settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(user);
            }}
          >
            <label>
              Timezone
              <Input
                required
                list="timezones"
                value={user.timezone}
                onChange={(e) => setUser({ ...user, timezone: e.target.value })}
              />
            </label>
            <datalist id="timezones">
              <option>Asia/Kolkata</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>UTC</option>
            </datalist>
            <label>
              Standup time
              <Input
                type="time"
                required
                value={user.standupTime}
                onChange={(e) => setUser({ ...user, standupTime: e.target.value })}
              />
            </label>
            <label>
              Activity window
              <Select
                label="Activity window"
                value={user.activityWindow}
                onValueChange={(value) =>
                  setUser({ ...user, activityWindow: value as Preferences['activityWindow'] })
                }
                options={[
                  { value: 'previous-working-day', label: 'Previous working day' },
                  { value: 'yesterday', label: 'Yesterday' },
                ]}
              />
            </label>
            <fieldset className="border-0 p-0">
              <legend className="mb-3 text-sm">Working days</legend>
              <div className="days">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <button
                    type="button"
                    key={day}
                    aria-label={day}
                    aria-pressed={user.workingDays.includes(index)}
                    onClick={() =>
                      setUser({
                        ...user,
                        workingDays: user.workingDays.includes(index)
                          ? user.workingDays.filter((d) => d !== index)
                          : [...user.workingDays, index],
                      })
                    }
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="review-label">
              <Input
                type="checkbox"
                checked={user.scheduledSync}
                onChange={(e) => setUser({ ...user, scheduledSync: e.target.checked })}
              />
              Enable daily sync preference
            </label>
            <p className="tiny muted">
              Automatic execution requires the server’s scheduled worker. Manual sync is always
              available when connected.
            </p>
            {save.error && (
              <p role="alert" className="modal-error">
                {save.error.message}
              </p>
            )}
            <Button variant="default" type="submit" loading={save.isPending} loadingText="Saving preferences…">
              {save.isPending ? 'Saving…' : 'Save preferences'}
            </Button>
          </form>
        </Card>
        <div className="stack">
          <Card>
            <CardContent>
              <h2>Appearance</h2>
              <div className="segmented mt-5" role="group" aria-label="Color theme">
                {(['system', 'light', 'dark'] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={appearance === value}
                    onClick={() => setTheme(value)}
                  >
                    {value === 'system' ? 'System' : value === 'light' ? 'Light' : 'Dark'}
                  </button>
                ))}
              </div>
              <label className="review-label mt-6">
                <Input
                  type="checkbox"
                  checked={reduced}
                  onChange={(e) => setReduced(e.target.checked)}
                />
                Reduce motion
              </label>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2>GitHub connection</h2>
              <p className="my-4 text-sm">
                {workspace.connected
                  ? 'Connected. Disconnecting stops collection and removes the stored token.'
                  : 'Disconnected. Your saved updates are still available.'}
              </p>
              {workspace.connected ? (
                <Button onClick={() => setConfirm('disconnect')}>
                  <Github size={16} />
                  Disconnect account
                </Button>
              ) : workspace.user.mode === 'demo' ? (
                <Button
                  loading={connection.isPending} loadingText="Reconnecting…"
                  onClick={() => connection.mutate('reconnect')}
                >
                  Reconnect sample account
                </Button>
              ) : (
                <a className="btn" href="/api/auth/github">
                  Reconnect GitHub
                </a>
              )}
              <p className="tiny muted mt-4">
                You can also revoke authorization in GitHub Settings → Applications.
              </p>
              {connection.error && (
                <p className="modal-error" role="alert">
                  {connection.error.message}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="workspace-danger">
            <CardContent>
              <h2>Delete application data</h2>
              <p>
                Delete this account’s saved standups, activity, settings, and sessions. Host backups
                follow the hosting retention policy.
              </p>
              <Button onClick={() => setConfirm('delete')}>
                <Trash2 size={16} />
                Delete my data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
            setConfirmation('');
          }
        }}
        title={confirm === 'delete' ? 'Delete all application data?' : 'Disconnect this account?'}
        description={
          confirm === 'delete'
            ? 'This removes your account, saved standups, activity, and sessions. This cannot be undone.'
            : 'Activity collection will stop and the stored token will be removed. Saved standups remain. Revoke authorization separately in GitHub to revoke upstream access.'
        }
        confirmLabel={confirm === 'delete' ? 'Delete permanently' : 'Disconnect'}
        pending={connection.isPending || deletion.isPending}
        onConfirm={() => {
          if (confirm === 'delete') deletion.mutate(confirmation);
          else connection.mutate('disconnect');
        }}
      >
        {confirm === 'delete' && (
          <label className="mt-5 block">
            Type DELETE
            <Input
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
        )}
        {(connection.error || deletion.error) && (
          <p role="alert" className="modal-error">
            {(connection.error || deletion.error)?.message}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
