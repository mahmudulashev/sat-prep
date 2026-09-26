/** Shown instantly while the Tests page loads. */
export default function TestsLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="flex min-h-[4.25rem] flex-col justify-center gap-2">
        <div className="h-8 w-32 rounded-xl bg-line" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-line/70" />
      </div>
      <div className="mt-6 h-12 w-md max-w-full rounded-2xl bg-surface shadow-card" />
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-80 rounded-3xl bg-surface shadow-card" />
        ))}
      </div>
    </div>
  );
}
