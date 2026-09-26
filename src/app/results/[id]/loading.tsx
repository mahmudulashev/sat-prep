export default function ResultLoading() {
  return (
    <div className="min-h-screen pb-20" data-page-scale="app" aria-busy="true" aria-label="Loading score report">
      <div className="mx-auto h-16 max-w-6xl px-4 sm:px-6" />
      <div className="mx-auto grid max-w-6xl animate-pulse gap-5 px-4 sm:px-6 lg:grid-cols-[23.75rem_1fr]">
        <div className="h-[28rem] rounded-3xl bg-surface shadow-card" />
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-surface shadow-card" />
            ))}
          </div>
          <div className="h-72 rounded-3xl bg-surface shadow-card" />
        </div>
      </div>
    </div>
  );
}
