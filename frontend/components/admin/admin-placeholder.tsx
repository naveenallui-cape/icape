export function AdminPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-8">
      <h1 className="text-2xl font-bold text-brand">{title}</h1>
      <p className="mt-2 text-muted">
        This module is scaffolded in the admin navigation and will be expanded
        in the next phase.
      </p>
    </div>
  );
}
