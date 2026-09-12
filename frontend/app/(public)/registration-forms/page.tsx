import Link from "next/link";
import { Download, FileText, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import { WHATSAPP_APP_HREF } from "@/lib/registration-announcement";

const forms = [
  {
    title: "School Registration Form",
    description:
      "School details and olympiad participation for Olympiad Year 2026-27.",
    href: "/forms/School_Registration_Form_2026-27.pdf",
    fileName: "School_Registration_Form_2026-27.pdf",
  },
  {
    title: "Student Registration Form",
    description:
      "Student details for each participant for Olympiad Year 2026-27.",
    href: "/forms/Student_Registration_Form_2026-27.pdf",
    fileName: "Student_Registration_Form_2026-27.pdf",
  },
] as const;

const registerPoints = [
  "Download both the School Registration Form and the Student Registration Form from this page.",
  "Fill in all school details on the school form carefully.",
  "Fill student details clearly for every participant on the student form (name, class, olympiad choices).",
  "Pay the registration fee of INR 150 per student per Olympiad and keep the payment proof.",
  "Send the filled school form, student form(s), and payment proof to i-CAPE on WhatsApp.",
] as const;

export default function RegistrationFormsPage() {
  return (
    <PageShell
      title="Download Registration Forms"
      description="Download school and student registration forms for Olympiad Year 2026-27, then submit with payment."
    >
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            Download forms
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {forms.map((form) => (
              <a
                key={form.title}
                href={form.href}
                download={form.fileName}
                className="flex flex-col rounded-xl border border-accent/50 bg-surface p-6 shadow-[0_1px_2px_rgba(13,23,59,0.04)]"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <FileText className="size-6" aria-hidden />
                </div>
                <h3 className="text-xl font-bold text-brand">{form.title}</h3>
                <p className="mt-2 flex-1 text-base leading-relaxed text-muted">
                  {form.description}
                </p>
                <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-base font-semibold text-brand shadow-sm transition hover:bg-accent-hover">
                  <Download className="size-4" aria-hidden />
                  Download PDF
                </span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            How to register
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          <ol className="mt-6 max-w-3xl list-decimal space-y-3 pl-5 text-base leading-relaxed text-muted sm:text-lg">
            {registerPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>

          <a
            href={WHATSAPP_APP_HREF}
            className="mt-6 flex max-w-xl flex-col rounded-xl border border-accent/50 bg-surface p-5"
          >
            <MessageCircle className="mb-3 size-6 text-accent" aria-hidden />
            <h3 className="text-lg font-bold text-brand">Submit on WhatsApp</h3>
            <p className="mt-2 text-base leading-relaxed text-muted">
              Send clear photos or PDFs of the filled forms and payment proof to:
            </p>
            <span className="mt-3 inline-flex text-lg font-semibold text-brand">
              +91 80745 63902
            </span>
          </a>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
            Payment details (QR code and bank account) are on the{" "}
            <Link
              href="/registration-fee"
              className="font-semibold text-brand underline underline-offset-2"
            >
              Registration Fee
            </Link>{" "}
            page.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
