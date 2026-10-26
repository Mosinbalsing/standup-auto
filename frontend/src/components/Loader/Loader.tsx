export function Loader({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="workspace-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="loader-heading"><span className="loader-orbit" aria-hidden="true" /><span>{label}…</span></div>
      <div className="skeleton-line skeleton-title" aria-hidden="true" />
      <div className="loader-grid" aria-hidden="true">
        <div className="skeleton-panel">{[0, 1, 2].map(i => <div className="skeleton-row" key={i}><span className="skeleton-dot" /><div><span className="skeleton-line" /><span className="skeleton-line short" /></div></div>)}</div>
        <div className="skeleton-panel"><span className="skeleton-line" /><span className="skeleton-line short" /><span className="skeleton-line" /></div>
      </div>
    </div>
  );
}
