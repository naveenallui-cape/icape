import { BackButton } from "@/components/layout/back-button";

type PageShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  hideHeroOnPrint?: boolean;
};

export function PageShell({
  title,
  eyebrow,
  description,
  action,
  children,
  hideHeroOnPrint = false,
}: PageShellProps) {
  return (
    <>
      {/* Page hero — back + heading always side by side */}
      <section
        className={
          hideHeroOnPrint
            ? "no-print border-b border-border bg-surface pb-6 pt-4 sm:pb-7 sm:pt-5"
            : "border-b border-border bg-surface pb-6 pt-4 sm:pb-7 sm:pt-5"
        }
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-row flex-nowrap items-start gap-3 sm:gap-4">
            <div className="shrink-0 pt-1">
              <BackButton />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-row flex-wrap items-start justify-between gap-3">
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
                </div>
                {action ? (
                  <div className="shrink-0">{action}</div>
                ) : null}
              </div>
              <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
              {description ? (
                <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {children ? (
        <section
          className={
            hideHeroOnPrint
              ? "bg-background py-12 print:bg-white print:py-4 sm:py-16"
              : "bg-background py-12 sm:py-16"
          }
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
        </section>
      ) : null}
    </>
  );
}
