import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/input';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { Link, useBlocker, useBeforeUnload } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { PageHeading } from '@/components/Header/PageHeading';
import { useWorkspaceContext } from '@/features/dashboard/components/WorkspaceLayout';
import { ActivityEvent } from '@/features/dashboard/components/ActivityEvent';
import { useSaveStandup } from '../hooks/useSaveStandup';
import { dismissBlocker, exportStandup } from '../api/standup.api';
import { SourceLinks } from '../components/SourceLinks';
import { useToast } from '@/hooks/useToast';
import { shortDate } from '@/utils/dates';
import type { Section, Standup } from '@/types/api';

export function TodayScreen() {
  const context = useWorkspaceContext();
  return (
    <StandupEditor
      key={`${context.workspace.date}:${context.workspace.standup?.version || 0}`}
      {...context}
    />
  );
}
function StandupEditor({ workspace, setDate, sync }: ReturnType<typeof useWorkspaceContext>) {
  const [draft, setDraft] = useState<Standup>(() =>
      structuredClone(
        workspace.standup || {
          date: workspace.date,
          version: 0,
          reviewed: false,
          items: { yesterday: [], today: [], blockers: [] },
        },
      ),
    ),
    [dirty, setDirty] = useState(false),
    [format, setFormat] = useState(() => localStorage.getItem('sa-copy-format') || 'plain'),
    [clipboard, setClipboard] = useState<string | null>(null);
  const toast = useToast(),
    save = useSaveStandup(),
    client = useQueryClient(),
    blocker = useBlocker(dirty);
  const dismiss = useMutation({
    mutationFn: dismissBlocker,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace'] }),
  });
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  useEffect(() => {
    document.title = 'Today — Standup Auto';
  }, []);
  function edit(change: (next: Standup) => void) {
    setDraft((current) => {
      const next = structuredClone(current);
      change(next);
      return next;
    });
    setDirty(true);
  }
  function add(section: Section, text = '') {
    edit((next) =>
      next.items[section].push({ id: crypto.randomUUID(), text, manual: true, sourceIds: [] }),
    );
  }
  async function copy() {
    if (dirty) {
      toast('Save your draft before copying.');
      return;
    }
    try {
      const { text } = await exportStandup(workspace.date, format);
      try {
        await navigator.clipboard.writeText(text);
        toast('Copied. Nothing was sent.');
      } catch {
        setClipboard(text);
      }
    } catch (error) {
      toast((error as Error).message);
    }
  }
  async function saveDraft() {
    try {
      await save.mutateAsync(draft);
      setDirty(false);
      toast('Standup saved on the server.');
    } catch {}
  }
  function move(section: Section, index: number, direction: number) {
    edit((next) => {
      const items = next.items[section],
        target = index + direction;
      if (direction === 0) {
        const removed = items.splice(index, 1)[0];
        toast('Item removed. Save to keep the change.');
        setUndo({ section, item: removed, index });
      } else if (target >= 0 && target < items.length)
        [items[index], items[target]] = [items[target], items[index]];
    });
  }
  const [undo, setUndo] = useState<{
    section: Section;
    item: Standup['items']['today'][number];
    index: number;
  } | null>(null);
  return (
    <>
      <PageHeading
        title="Your daily standup"
        subtitle={`${shortDate(workspace.date)} · ${workspace.user.timezone}`}
        actions={
          <>
            <Button disabled={sync.pending || dirty} onClick={sync.start}>
              <RefreshCw size={16} className={sync.pending ? 'animate-spin' : ''} />
              {sync.pending ? 'Syncing…' : 'Sync activity'}
            </Button>
            <Button variant="default" disabled={dirty || save.isPending} onClick={copy}>
              <Copy size={16} />
              Copy saved standup
            </Button>
          </>
        }
      />
      <div className="field-row mb-6">
        <label htmlFor="standup-date" className="tiny muted">
          Standup date
        </label>
        <Input
          id="standup-date"
          className="date-control"
          type="date"
          value={workspace.date}
          onChange={(e) => {
            if (dirty) {
              toast('Save your draft before changing dates.');
              return;
            }
            if (e.target.value) setDate(e.target.value);
          }}
        />
        <span className="workspace-status m-0">
          {dirty ? 'Unsaved edits' : workspace.standup ? 'Saved on server' : 'New draft'}
        </span>
      </div>
      {save.error && (
        <div className="workspace-error" role="alert">
          {save.error.message}{' '}
          <Button
            onClick={() => {
              setDirty(false);
              void client.invalidateQueries({ queryKey: ['workspace'] });
            }}
          >
            Reload saved version
          </Button>
        </div>
      )}
      {undo && (
        <div className="workspace-job">
          Item removed.{' '}
          <Button
            size="sm"
            onClick={() => {
              edit((next) => next.items[undo.section].splice(undo.index, 0, undo.item));
              setUndo(null);
            }}
          >
            Undo
          </Button>
        </div>
      )}
      <div className="workspace-two">
        <div>
          <Card>
            <CardHeader>
              <h2 className="row">
                <FileText size={18} />
                Standup draft
              </h2>
              <span className="badge green">{draft.reviewed ? 'Reviewed' : 'Draft'}</span>
            </CardHeader>
            {(['yesterday', 'today', 'blockers'] as Section[]).map((section) => (
              <section className="editor-section" key={section}>
                <h3 className="section-title">{section}</h3>
                {draft.items[section].map((item, index) => (
                  <div className="workspace-bullet" key={item.id}>
                    <div className="grow min-w-0">
                      <label className="sr-only" htmlFor={'bullet-' + item.id}>
                        {section} item {index + 1}
                      </label>
                      <Textarea
                        id={'bullet-' + item.id}
                        className="editor-input"
                        rows={2}
                        data-section={section}
                        value={item.text}
                        onChange={(e) =>
                          edit((next) => {
                            next.items[section][index].text = e.target.value;
                          })
                        }
                      />
                      <SourceLinks sourceIds={item.sourceIds} activity={workspace.activity} />
                      {item.manual && <span className="badge">Manual</span>}
                    </div>
                    <div className="edit-tools">
                      {[
                        { Icon: ArrowUp, label: 'Move up', direction: -1, disabled: index === 0 },
                        {
                          Icon: ArrowDown,
                          label: 'Move down',
                          direction: 1,
                          disabled: index === draft.items[section].length - 1,
                        },
                        { Icon: Trash2, label: 'Remove', direction: 0, disabled: false },
                      ].map(({ Icon, label, direction, disabled }) => (
                        <button
                          key={label}
                          className="icon-btn"
                          aria-label={`${label} ${section} item ${index + 1}`}
                          disabled={disabled}
                          onClick={() => move(section, index, direction)}
                        >
                          <Icon size={15} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!draft.items[section].length && (
                  <p className="tiny muted">
                    {section === 'yesterday'
                      ? 'Sync activity, or add your own work update.'
                      : section === 'today'
                        ? 'Add your plans. GitHub cannot infer future intentions.'
                        : 'No confirmed blockers.'}
                  </p>
                )}
                <button className="add-item" onClick={() => add(section)}>
                  <Plus size={15} />
                  Add{' '}
                  {section === 'today'
                    ? 'a plan'
                    : section === 'blockers'
                      ? 'a blocker'
                      : 'an update'}
                </button>
              </section>
            ))}
            <div className="workspace-savebar">
              <label className="review-label">
                <Input
                  type="checkbox"
                  checked={draft.reviewed}
                  onChange={(e) =>
                    edit((next) => {
                      next.reviewed = e.target.checked;
                    })
                  }
                />
                Reviewed and ready for weekly recap
              </label>
              <Button variant="default" disabled={save.isPending} onClick={saveDraft}>
                <Check size={16} />
                {save.isPending ? 'Saving…' : 'Save standup'}
              </Button>
            </div>
          </Card>
          <Card className="workspace-format mt-5">
            <label htmlFor="copy-format">Copy format</label>
            <Select
              id="copy-format"
              label="Copy format"
              value={format}
              onValueChange={(value) => {
                setFormat(value);
                localStorage.setItem('sa-copy-format', value);
              }}
              options={[
                { value: 'plain', label: 'Plain text' },
                { value: 'slack', label: 'Slack' },
                { value: 'whatsapp', label: 'WhatsApp' },
              ]}
            />
            <span className="tiny muted">Nothing is auto-sent.</span>
          </Card>
        </div>
        <div className="stack">
          <Card>
            <CardHeader>
              <h2>Recent activity</h2>
              <Link className="text-link" to="/activity">
                View all →
              </Link>
            </CardHeader>
            {workspace.activity.slice(0, 3).map((event) => (
              <ActivityEvent event={event} key={event.id} />
            ))}
            {!workspace.activity.length && (
              <CardContent>
                <p className="tiny">Select repositories and sync to collect activity.</p>
                <Link className="text-link" to="/repositories">
                  Choose repositories →
                </Link>
              </CardContent>
            )}
          </Card>
          {workspace.blockers.slice(0, 3).map((candidate) => (
            <section className="blocker-card" key={candidate.id}>
              <h3 className="row">
                <TriangleAlert size={17} />
                Possible blocker
              </h3>
              <p>{candidate.title}</p>
              <small>
                Open {candidate.ageDays} days. {candidate.reason}
              </small>
              <div className="row flex-wrap">
                <Button onClick={() => add('blockers', 'Need help with: ' + candidate.title)}>
                  Add blocker
                </Button>
                <Button disabled={dismiss.isPending} onClick={() => dismiss.mutate(candidate.id)}>
                  Dismiss
                </Button>
              </div>
            </section>
          ))}
          {dismiss.error && <p role="alert">{dismiss.error.message}</p>}
          <Card>
            <CardContent>
              <h2>Sync status</h2>
              {workspace.sync?.repositories.map((repo) => (
                <div className="workspace-sync-row" key={repo.id}>
                  <span>
                    {repo.name}
                    {repo.message && <small className="block">{repo.message}</small>}
                  </span>
                  <span className={'badge ' + (repo.status === 'success' ? 'green' : 'amber')}>
                    {repo.status}
                  </span>
                </div>
              )) || <p className="tiny mt-4">No sync has run yet.</p>}
              <p className="tiny muted mt-4">New syncs preserve saved edits and deleted bullets.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title="Leave unsaved edits?"
        description="Your latest changes have not been saved. Save your draft first, or discard the edits to change screens."
        confirmLabel="Discard edits"
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
      <Modal
        open={clipboard !== null}
        onOpenChange={(open) => {
          if (!open) setClipboard(null);
        }}
        title="Copy your update"
      >
        <label className="sr-only" htmlFor="clipboard-fallback">
          Text to copy
        </label>
        <Textarea
          id="clipboard-fallback"
          value={clipboard || ''}
          readOnly
          onFocus={(e) => e.target.select()}
        />
      </Modal>
    </>
  );
}
