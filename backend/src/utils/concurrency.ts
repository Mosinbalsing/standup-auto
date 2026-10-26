// Wait for in-flight writes before propagating a failure.
export async function forEachConcurrent<T>(items: T[], work: (item: T) => Promise<unknown>, limit = 6) {
  let cursor = 0, failed = false, failure: unknown;
  async function worker() {
    while (!failed) {
      const index = cursor++;
      if (index >= items.length) return;
      try { await work(items[index]); }
      catch (error) { failed = true; failure = error; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  if (failed) throw failure;
}
