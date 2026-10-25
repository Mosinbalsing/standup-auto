import { ExternalLink, FileText } from 'lucide-react';
import type { Activity } from '@/types/api';
export function SourceLinks({
  sourceIds,
  activity,
}: {
  sourceIds: string[];
  activity: Activity[];
}) {
  return (
    <>
      {sourceIds.map((id) => {
        const source = activity.find((a) => a.id === id);
        if (!source) return null;
        let safe = false;
        try {
          const url = new URL(source.sourceUrl || '');
          safe = url.protocol === 'https:' && url.hostname === 'github.com';
        } catch {}
        const text = `${source.repository} · ${source.number ? '#' + source.number : source.sha?.slice(0, 7) || source.type}`;
        return safe ? (
          <a
            key={id}
            className="workspace-source"
            href={source.sourceUrl!}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={12} />
            {text}
          </a>
        ) : (
          <span className="workspace-source" key={id}>
            <FileText size={12} />
            Sample source · {text}
          </span>
        );
      })}
    </>
  );
}
