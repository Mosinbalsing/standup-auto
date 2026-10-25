export function Loader() {
  return (
    <div role="status" className="p-8">
      <span className="sr-only">Loading workspace</span>
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-current opacity-10" />
      <div className="h-40 animate-pulse rounded-2xl bg-current opacity-5" />
    </div>
  );
}
