import { useState } from 'react';
import { GitCommitHorizontal, GitPullRequest, MessageSquare, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { SourceLinks } from '@/features/standup/components/SourceLinks';
import type { Activity } from '@/types/api';

export function ActivityEvent({ event }: { event: Activity }) {
  const [open, setOpen] = useState(false);
  const Icon = event.type === 'commit' ? GitCommitHorizontal : event.type === 'pull_request' ? GitPullRequest : MessageSquare;
  const type = event.type === 'commit' ? 'Commit' : event.type === 'pull_request' ? 'Pull request' : 'Review';
  const reference = event.sha?.slice(0, 7) || (event.number ? '#' + event.number : null);
  const date = new Date(event.occurredAt);
  const time = date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <>
      <button type="button" className="workspace-event activity-card" onClick={() => setOpen(true)}
        aria-label={`Inspect ${type.toLowerCase()}: ${event.title}`}>
        <span className={'event-symbol ' + (event.type === 'pull_request' ? 'pr' : event.type)}><Icon size={18} aria-hidden="true" /></span>
        <span className="activity-main">
          <span className="activity-meta"><span>{event.repository}</span>{reference && <code>{reference}</code>}</span>
          <strong>{event.title}</strong>
          <span className="activity-meta"><span className="activity-kind">{type}{event.status ? ' · ' + event.status : ''}</span><time dateTime={event.occurredAt}>{time}</time></span>
        </span>
        <ChevronRight size={16} aria-hidden="true" className="activity-chevron" />
      </button>
      <Modal open={open} onOpenChange={setOpen} title={event.title} description={`${type} · ${event.repository}`}>
        <dl className="activity-details">
          <div><dt>Repository</dt><dd>{event.repository}</dd></div>
          {reference && <div><dt>{event.sha ? 'Commit' : 'Pull request'}</dt><dd><code>{reference}</code></dd></div>}
          <div><dt>Recorded</dt><dd><time dateTime={event.occurredAt}>{date.toLocaleString()}</time></dd></div>
        </dl>
        <p className="tiny muted">Times are shown in your browser timezone. Open the original source to review the change.</p>
        <SourceLinks sourceIds={[event.id]} activity={[event]} />
      </Modal>
    </>
  );
}
