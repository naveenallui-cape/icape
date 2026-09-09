export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Dashboard</h1>
        <p className="mt-1 text-muted">
          Manage olympiad results, uploads, and published records.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Upload Results",
            href: "/admin/results/upload",
            text: "Bulk import Excel result files",
          },
          {
            title: "Update Results",
            href: "/admin/results/update",
            text: "Edit by student ID or school ID/name",
          },
          {
            title: "Manage Results",
            href: "/admin/results",
            text: "Search, filter, or delete results",
          },
          {
            title: "Public Results",
            href: "/results",
            text: "Open the public result lookup pages",
          },
        ].map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-accent/50"
          >
            <h2 className="text-lg font-bold text-brand">{card.title}</h2>
            <p className="mt-2 text-sm text-muted">{card.text}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
