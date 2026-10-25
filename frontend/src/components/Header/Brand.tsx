import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
export function Brand() {
  return (
    <Link className="workspace-brand" to="/">
      <span className="brand-mark">
        <FileText size={21} />
      </span>
      Standup Auto
    </Link>
  );
}
