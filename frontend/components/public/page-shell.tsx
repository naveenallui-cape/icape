type PageShellProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <>
      {/* Page hero — compact height (~40% less padding) */}
      <section className="border-b border-border bg-surface pb-6 pt-2 sm:pb-7 sm:pt-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
            {title}
          </h1>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          {description ? (
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </section>

      {children ? (
        <section className="bg-background py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
        </section>
      ) : null}
    </>
  );
}
