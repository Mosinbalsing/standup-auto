import { Textarea } from '@/components/ui/input';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, Pencil } from 'lucide-react';
import { PageHeading } from '@/components/Header/PageHeading';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Loader } from '@/components/Loader/Loader';
import { useWorkspaceContext } from '@/features/dashboard/components/WorkspaceLayout';
import { SourceLinks } from '@/features/standup/components/SourceLinks';
import { useRecap, useSaveRecap } from '../hooks/useRecap';
import { useToast } from '@/hooks/useToast';
import { monday, shortDate } from '@/utils/dates';
export function WeeklyScreen() {
  const { workspace, setDate } = useWorkspaceContext(),
    [start, setStart] = useState(() => monday(workspace.date)),
    query = useRecap(start),
    save = useSaveRecap(),
    [edit, setEdit] = useState(false),
    [text, setText] = useState(''),
    [fallback, setFallback] = useState(false),
    toast = useToast();
  if (query.isPending) return <Loader />;
  if (query.isError)
    return (
      <p className="workspace-error" role="alert">
        {query.error.message}
        <Button onClick={() => query.refetch()}>Retry</Button>
      </p>
    );
  const recap = query.data,
    body =
      recap.edited ||
      recap.highlights.map((i) => '• ' + i.text).join('\n') ||
      'No reviewed updates.',
    output = `Weekly recap · ${start}\n\n${body}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      toast('Copied. Nothing was sent.');
    } catch {
      setFallback(true);
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain' })),
      a = document.createElement('a');
    a.href = url;
    a.download = `standup-recap-${start}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageHeading
        title="Your week, clearly told."
        subtitle="Built only from daily standups you marked reviewed."
        actions={
          <Button variant="default" onClick={copy}>
            <Copy size={16} />
            Copy recap
          </Button>
        }
      />
      <div className="field-row mb-6">
        <label htmlFor="week-date">Week starting</label>
        <Input
          id="week-date"
          type="date"
          className="date-control"
          value={start}
          onChange={(e) => {
            if (e.target.value) setStart(monday(e.target.value));
          }}
        />
        <span className="badge green">{recap.reviewedCount} reviewed days</span>
      </div>
      <div className="workspace-two">
        <Card>
          <CardHeader>
            <h2>Weekly highlights</h2>
            <div className="row flex-wrap">
              <Button
                onClick={() => {
                  setText(body);
                  setEdit(true);
                }}
              >
                <Pencil size={16} />
                Edit recap
              </Button>
              <Button onClick={download}>
                <Download size={16} />
                Download .txt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recap.edited ? (
              <>
                <p className="workspace-recap">{recap.edited}</p>
                <p className="tiny muted mt-5">
                  Edited recap. Open the daily updates to inspect the supporting sources.
                </p>
              </>
            ) : recap.highlights.length ? (
              recap.highlights.map((item) => (
                <div className="highlight" key={item.id}>
                  <div>
                    <p>{item.text}</p>
                    <span className="badge">{shortDate(item.date)}</span>
                    <SourceLinks sourceIds={item.sourceIds} activity={workspace.activity} />
                  </div>
                </div>
              ))
            ) : (
              <div className="workspace-empty">
                <h2>No reviewed updates this week</h2>
                <p>Save a daily standup with “Reviewed and ready for weekly recap” selected.</p>
                <Link className="btn" to="/today">
                  Open Today
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <h2>Daily standups</h2>
          </CardHeader>
          {recap.days.map((day) => (
            <Link
              key={day.date}
              className="workspace-day"
              to="/today"
              onClick={() => setDate(day.date)}
            >
              <span>{shortDate(day.date)}</span>
              <span className={'badge ' + (day.status === 'reviewed' ? 'green' : '')}>
                {day.status}
              </span>
              <span>→</span>
            </Link>
          ))}
        </Card>
      </div>
      <Modal
        open={edit}
        onOpenChange={setEdit}
        title="Edit weekly recap"
        description="Keep the recap grounded in your reviewed daily updates."
        actions={
          <Button
            variant="default"
            loading={save.isPending} loadingText="Saving recap…"
            onClick={async () => {
              try {
                await save.mutateAsync({ start, version: recap.version, text });
                setEdit(false);
                toast('Weekly recap saved on the server.');
              } catch {}
            }}
          >
            Save recap
          </Button>
        }
      >
        <label className="sr-only" htmlFor="weekly-editor">
          Weekly recap text
        </label>
        <Textarea
          id="weekly-editor"
          className="min-h-56"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {save.error && (
          <p role="alert" className="modal-error">
            {save.error.message}
          </p>
        )}
      </Modal>
      <Modal open={fallback} onOpenChange={setFallback} title="Copy weekly recap">
        <Textarea
          readOnly
          aria-label="Text to copy"
          value={output}
          onFocus={(e) => e.target.select()}
        />
      </Modal>
    </>
  );
}
