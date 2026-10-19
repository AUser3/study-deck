export function Loading() {
  return (
    <div role="status" className="mx-auto max-w-3xl space-y-4 py-10" aria-label="Loading">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
