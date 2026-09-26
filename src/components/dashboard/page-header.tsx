/** The title block every dashboard page starts with, so all pages line up. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[4.25rem] items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-3xl font-extrabold tracking-tight">{title}</h1>
        {description && <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">{description}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
