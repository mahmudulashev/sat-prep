export default function ExamLoading() {
  return (
    <div className="min-h-screen" data-page-scale="app" aria-busy="true" aria-label="Loading test">
      <div className="mx-auto h-16 max-w-6xl px-4 sm:px-6" />
      <div className="mx-auto grid max-w-6xl animate-pulse gap-6 px-4 pt-4 sm:px-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="h-[32rem] rounded-3xl bg-surface shadow-card" />
        <div className="h-96 rounded-3xl bg-ink/90" />
      </div>
    </div>
  );
}
