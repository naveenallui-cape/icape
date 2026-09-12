"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ANNOUNCEMENT_OLYMPIADS,
  INTRO_POPUP_STORAGE_KEY,
  OLYMPIAD_YEAR_LABEL,
  REGISTRATION_DEADLINE_LABEL,
} from "@/lib/registration-announcement";
import { cn } from "@/lib/utils";

const WHATSAPP_E164 = "918074563902";

const leadSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required"),
  contactName: z.string().trim().min(2, "Contact name is required"),
  mobile: z
    .string()
    .trim()
    .min(10, "Enter a valid mobile number")
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email"),
  schoolAddress: z.string().trim().min(5, "School address is required"),
});

type LeadFormValues = z.infer<typeof leadSchema>;
type LeadIntent = "registration" | "enquiry";

function buildWhatsAppUrl(intent: LeadIntent, values: LeadFormValues) {
  const intentLabel =
    intent === "registration"
      ? "Online School Registration"
      : "School Enquiry";

  const message = [
    `i-CAPE ${intentLabel} — Olympiad Year ${OLYMPIAD_YEAR_LABEL}`,
    "",
    `School name: ${values.schoolName}`,
    `Contact name: ${values.contactName}`,
    `Mobile: ${values.mobile}`,
    `Email: ${values.email}`,
    `School address: ${values.schoolAddress}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

export function WelcomeOlympiadPopup() {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"home" | "form">("home");
  const [intent, setIntent] = useState<LeadIntent>("registration");

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      schoolName: "",
      contactName: "",
      mobile: "",
      email: "",
      schoolAddress: "",
    },
  });

  useEffect(() => {
    try {
      if (window.localStorage.getItem(INTRO_POPUP_STORAGE_KEY) === "1") {
        return;
      }
    } catch {
      // private mode — still show once this session
    }

    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function dismiss(remember: boolean) {
    setOpen(false);
    setStep("home");
    form.reset();
    if (remember) {
      try {
        window.localStorage.setItem(INTRO_POPUP_STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }
  }

  function openForm(nextIntent: LeadIntent) {
    setIntent(nextIntent);
    setStep("form");
    form.clearErrors();
  }

  function onSubmit(values: LeadFormValues) {
    const url = buildWhatsAppUrl(intent, values);
    window.open(url, "_blank", "noopener,noreferrer");
    dismiss(true);
  }

  const formTitle =
    intent === "registration"
      ? "Online school registration"
      : "School enquiry";

  return (
    <AnimatePresence>
      {open ? (
        <div className="no-print fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close announcement"
            className="absolute inset-0 bg-[#0d173b]/55 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => dismiss(false)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className={cn(
              "relative z-[1] flex max-h-[min(92vh,42rem)] w-full max-w-lg flex-col overflow-hidden",
              "rounded-2xl border border-border bg-surface shadow-[0_24px_64px_rgba(13,23,59,0.28)]",
            )}
            initial={
              reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="relative border-b border-accent/40 bg-gradient-to-br from-brand to-brand-hover px-5 pb-5 pt-5 text-white sm:px-6">
              <button
                ref={closeRef}
                type="button"
                onClick={() => dismiss(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              {step === "home" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Olympiad Year {OLYMPIAD_YEAR_LABEL}
                  </p>
                  <h2
                    id={titleId}
                    className="mt-2 max-w-[20ch] text-2xl font-bold tracking-tight sm:text-[1.7rem]"
                  >
                    i-CAPE Olympiad Registration Open
                  </h2>
                  <p id={descId} className="mt-2 max-w-md text-sm text-white/85">
                    Register your school for IMO, ISO and IEO before the last
                    date.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-bold text-brand shadow-sm">
                    <Clock3 className="size-4 shrink-0" aria-hidden />
                    Last date: {REGISTRATION_DEADLINE_LABEL}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("home")}
                    className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/85 transition hover:text-white"
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </button>
                  <h2
                    id={titleId}
                    className="max-w-[22ch] text-2xl font-bold tracking-tight sm:text-[1.7rem]"
                  >
                    {formTitle}
                  </h2>
                  <p id={descId} className="mt-2 text-sm text-white/85">
                    Fill the details below. We will open WhatsApp to send your
                    request to i-CAPE.
                  </p>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              {step === "home" ? (
                <ul className="space-y-2.5">
                  {ANNOUNCEMENT_OLYMPIADS.map((item) => (
                    <li key={item.code}>
                      <Link
                        href={item.href}
                        onClick={() => dismiss(true)}
                        className="group flex items-start gap-3 rounded-xl border border-border bg-[#f7f9fc] px-3.5 py-3 transition hover:border-brand/30 hover:bg-brand-soft/50"
                      >
                        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
                          {item.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-brand group-hover:underline">
                            {item.name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                            <CalendarDays
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            Exam: {item.examDate}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  {(
                    [
                      {
                        name: "schoolName" as const,
                        label: "School name",
                        placeholder: "Enter school name",
                      },
                      {
                        name: "contactName" as const,
                        label: "Contact name",
                        placeholder: "Enter contact person name",
                      },
                      {
                        name: "mobile" as const,
                        label: "Mobile no.",
                        placeholder: "10-digit mobile number",
                        type: "tel",
                      },
                      {
                        name: "email" as const,
                        label: "Email",
                        placeholder: "school@email.com",
                        type: "email",
                      },
                    ] as const
                  ).map((field) => (
                    <div key={field.name}>
                      <label className="mb-1.5 block text-sm font-semibold text-brand">
                        {field.label}
                      </label>
                      <Input
                        type={"type" in field ? field.type : "text"}
                        placeholder={field.placeholder}
                        aria-invalid={Boolean(
                          form.formState.errors[field.name],
                        )}
                        {...form.register(field.name)}
                      />
                      {form.formState.errors[field.name] ? (
                        <p className="mt-1 text-xs text-red-600">
                          {form.formState.errors[field.name]?.message}
                        </p>
                      ) : null}
                    </div>
                  ))}

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand">
                      School address
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Full school address"
                      className={cn(
                        "flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-brand shadow-sm transition-colors",
                        "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                      )}
                      aria-invalid={Boolean(
                        form.formState.errors.schoolAddress,
                      )}
                      {...form.register("schoolAddress")}
                    />
                    {form.formState.errors.schoolAddress ? (
                      <p className="mt-1 text-xs text-red-600">
                        {form.formState.errors.schoolAddress.message}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    className="mt-1 w-full"
                  >
                    Continue on WhatsApp
                  </Button>
                </form>
              )}
            </div>

            {step === "home" ? (
              <div className="flex flex-row gap-2 border-t border-border bg-[#f3f6fb] px-5 py-4 sm:px-6">
                <Button
                  type="button"
                  variant="accent"
                  className="min-w-0 flex-1 text-xs sm:text-sm"
                  onClick={() => openForm("registration")}
                >
                  Online school registration
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-0 flex-1 text-xs sm:text-sm"
                  onClick={() => openForm("enquiry")}
                >
                  Enquiry
                </Button>
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
