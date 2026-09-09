type PageShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageShell({
  title,
  eyebrow,
  description,
  action,
  children,
}: PageShellProps) {
  return (
    <>
      {/* Page hero — compact height (~40% less padding) */}
      <section className="border-b border-border bg-surface pb-6 pt-2 sm:pb-7 sm:pt-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  {eyebrow}
                </p>
              ) : null}
              <h1
                className={
                  eyebrow
                    ? "mt-2 text-2xl font-bold tracking-tight text-brand sm:text-3xl"
                    : "text-2xl font-bold tracking-tight text-brand sm:text-3xl"
                }
              >
                {title}
              </h1>
              <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
              {description ? (
                <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {action ? (
              <div className="shrink-0 pt-1 sm:pt-0">{action}</div>
            ) : null}
          </div>
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
