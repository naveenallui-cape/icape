import Image from "next/image";
import { Building2, QrCode } from "lucide-react";
import { PageShell } from "@/components/public/page-shell";

export default function RegistrationFeePage() {
  return (
    <PageShell
      title="School Registration Fee"
      description="Registration fee and payment details for i-CAPE Olympiads."
    >
      <div className="space-y-10">
        <div className="max-w-3xl space-y-4 text-base leading-relaxed text-foreground sm:text-lg">
          <p>
            Schools are required to remit a registration fee of{" "}
            <strong className="text-brand">
              INR 150 per student per Olympiad
            </strong>{" "}
            to i-CAPE (Innovative Talent Search Examination).
          </p>
          <p className="text-muted">
            Schools may charge a small additional amount per Olympiad to cover
            honorarium for the in-charge, guidance by teachers, and other related
            expenses, as applicable.
          </p>
          <p className="text-muted">
            Students with major physical disabilities, or Indian students whose
            parent(s) were martyred during defence operations, may be exempted
            from the registration fee — please contact i-CAPE for confirmation.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            Registration Process
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          <div className="mt-4 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              Participating schools should submit completed school and student
              registration forms along with payment to i-CAPE. Please quote your
              School Code (unique identifier assigned to each school) when
              remitting payment.
            </p>
            <p>
              If you are unsure about your school code, contact i-CAPE by phone
              or email using the details in the footer.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            Payment Modes
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          <ol className="mt-4 max-w-3xl list-decimal space-y-3 pl-5 text-base leading-relaxed text-muted sm:text-lg">
            <li>
              <strong className="text-foreground">QR code:</strong> Scan the QR
              code below and pay via UPI, Credit/Debit Card, Net Banking, or
              Wallet.
            </li>
            <li>
              <strong className="text-foreground">
                Online Transfer (NEFT/RTGS/IMPS):
              </strong>{" "}
              Transfer to the bank account listed below and share the transaction
              reference with your registration forms.
            </li>
          </ol>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-xl border border-accent/50 bg-background p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <QrCode className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-bold text-brand">Online Payment</h3>
                <p className="text-sm text-muted">
                  Scan the QR Code for Online Payment
                </p>
              </div>
            </div>
            <div className="max-w-[220px] overflow-hidden rounded-lg border border-border bg-white p-2">
              <Image
                src="/brand/payment-qr.png"
                alt="Scan this QR code for online payment"
                width={400}
                height={400}
                className="h-auto w-full"
              />
            </div>
          </article>

          <article className="rounded-xl border border-accent/50 bg-background p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Building2 className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-bold text-brand">Bank Transfer</h3>
                <p className="text-sm text-muted">IDFC FIRST BANK</p>
              </div>
            </div>

            <dl className="space-y-3 text-base">
              <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted">Bank</dt>
                <dd className="font-semibold text-brand">IDFC FIRST BANK</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted">IFSC</dt>
                <dd className="font-semibold text-brand">IDFB0080243</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted">Account type</dt>
                <dd className="font-semibold text-brand">Current</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted">A/C No.</dt>
                <dd className="font-semibold text-brand">10249756617</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted">Branch</dt>
                <dd className="font-semibold text-brand">Begumpet</dd>
              </div>
            </dl>
          </article>
        </div>
      </div>
    </PageShell>
  );
}
