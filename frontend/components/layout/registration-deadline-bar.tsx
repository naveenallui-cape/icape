import Link from "next/link";

const message =
  "Last date for registration: 24th August 2026 · Download forms, pay INR 150 per student per Olympiad, and submit on WhatsApp +91 80745 63902";

export function RegistrationDeadlineBar() {
  return (
    <div className="border-b border-accent/40 bg-accent-soft">
      <div className="flex items-center gap-3 px-2 py-2.5 sm:px-4">
        <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand sm:text-sm">
          Notice
        </span>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <p
                key={copy}
                className="text-sm font-semibold text-brand sm:text-base"
              >
                {message}
                <span className="mx-3 text-accent" aria-hidden>
                  ★
                </span>
                Olympiad Year 2026-27 · IMO · ISO · IEO
                <span className="mx-3 text-accent" aria-hidden>
                  ★
                </span>
              </p>
            ))}
          </div>
        </div>

        <Link
          href="/registration-forms"
          className="hidden shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-hover sm:inline-flex sm:text-sm"
        >
          Register now
        </Link>
      </div>
    </div>
  );
}
