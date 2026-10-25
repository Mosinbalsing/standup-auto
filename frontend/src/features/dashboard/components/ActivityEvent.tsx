import { useState } from 'react';
import { GitCommitHorizontal, GitPullRequest, MessageSquare } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { SourceLinks } from '@/features/standup/components/SourceLinks';
import type { Activity } from '@/types/api';
export function ActivityEvent({ event }: { event: Activity }) {
  const [open, setOpen] = useState(false),
    Icon =
      event.type === 'commit'
        ? GitCommitHorizontal
        : event.type === 'pull_request'
          ? GitPullRequest
          : MessageSquare;
  return (
    <>
      <button className="workspace-event" onClick={() => setOpen(true)}>
        <span className={'event-symbol ' + (event.type === 'pull_request' ? 'pr' : event.type)}>
          <Icon size={18} />
        </span>
        <span className="grow min-w-0">
          <strong>{event.title}</strong>
          <p>
            {event.repository} · {event.status || event.type}
          </p>
        </span>
        <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleDateString()}</time>
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={event.title}
        description={`${event.repository} · ${event.status || event.type}`}
      >
        <p className="my-4 text-sm text-pretty">
          Recorded {new Date(event.occurredAt).toLocaleString()} in your browser timezone.
        </p>
        <SourceLinks sourceIds={[event.id]} activity={[event]} />
      </Modal>
    </>
  );
}
