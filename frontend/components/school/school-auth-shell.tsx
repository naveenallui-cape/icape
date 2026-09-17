import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WhatsAppContactActions } from "@/components/school/whatsapp-contact-actions";
import { buttonVariants } from "@/components/ui/button";
import {
  OLYMPIAD_YEAR_LABEL,
  REGISTRATION_DEADLINE_LABEL,
  REGISTRATION_FEE_LABEL,
} from "@/lib/registration-announcement";
import { cn } from "@/lib/utils";

export function SchoolAuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex shrink-0",
              )}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to home
            </Link>
            <h1 className="min-w-0 flex-1 text-center text-lg font-bold tracking-tight text-brand sm:text-2xl md:text-3xl">
              ONLINE REGISTRATION FORM FOR SCHOOLS
            </h1>
            <div
              className="hidden w-[132px] shrink-0 sm:block"
              aria-hidden
            />
          </div>
          <p className="mt-2 text-center text-base font-semibold text-brand sm:text-lg">
            i-CAPE OLYMPIADS — {OLYMPIAD_YEAR_LABEL}
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <aside className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-center text-lg font-bold tracking-wide text-red-700">
              IMPORTANT NOTICE
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-red-800 sm:text-base">
              <p>
                This online registration is for{" "}
                <strong>schools only</strong>. School incharge / principal
                accounts can register students for i-CAPE Olympiads.
              </p>
              <p className="rounded-md bg-accent-soft px-3 py-2 font-bold text-red-800">
                This form is not for individual students.
              </p>
              <p>
                Fee: <strong>{REGISTRATION_FEE_LABEL}</strong>. Last date for
                registration: <strong>{REGISTRATION_DEADLINE_LABEL}</strong>.
              </p>
              <p>
                After creating an account, complete school details, student
                list, and payment proof. For help, WhatsApp:
              </p>
              <WhatsAppContactActions />
            </div>
          </aside>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(13,23,59,0.06)] sm:p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-brand sm:text-2xl">
                {title}
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-24 bg-accent" aria-hidden />
              {description ? (
                <p className="mt-3 text-sm text-muted sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-5 text-sm">{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
