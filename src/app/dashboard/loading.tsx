/** Shown instantly while a dashboard page loads; the sidebar and header stay in place. */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-line" />
        <div className="h-4 w-72 rounded-lg bg-line/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-surface shadow-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-80 rounded-3xl bg-surface shadow-card" />
        <div className="h-80 rounded-3xl bg-surface shadow-card" />
      </div>
    </div>
  );
}
