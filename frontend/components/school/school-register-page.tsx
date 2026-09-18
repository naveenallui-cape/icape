"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ClipboardList,
  School,
  University,
  WalletCards,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { schoolRegister } from "@/lib/school-api";
import { MOBILE_DIGITS_REGEX, MOBILE_ERROR } from "@/lib/mobile";
import {
  OLYMPIAD_YEAR_LABEL,
  REGISTRATION_DEADLINE_LABEL,
  REGISTRATION_FEE_LABEL,
} from "@/lib/registration-announcement";
import { toTitleCaseInput } from "@/lib/title-case";
import { cn } from "@/lib/utils";

const SCHOOL_HIGHLIGHTS = [
  {
    icon: School,
    title: "School registration",
    text: "Complete school details for the current Olympiad Year.",
  },
  {
    icon: ClipboardList,
    title: "Student entries",
    text: "Add students by grade and select olympiad subjects.",
  },
  {
    icon: WalletCards,
    title: "Payment & verification",
    text: "Submit fee proof online and track approval status.",
  },
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "School name is required"),
  mobile: z.string().trim().regex(MOBILE_DIGITS_REGEX, MOBILE_ERROR),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function SchoolRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", mobile: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setError("");
    const res = await schoolRegister(values);
    if (!res.success) {
      setError(res.message);
      return;
    }
    router.prefetch("/school/portal");
    window.location.assign("/school/portal?tab=dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.28),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <section className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
              <University className="size-3.5" aria-hidden />
              School portal access
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-source-serif)] text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
              i-CAPE Olympiad
              <span className="mt-1 block text-accent">School Portal</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              Create a school login to register students and submit payment for
              Olympiad Year {OLYMPIAD_YEAR_LABEL}.
            </p>
            <p className="mt-3 max-w-md text-sm text-white/60">
              Fee {REGISTRATION_FEE_LABEL}. Last date{" "}
              {REGISTRATION_DEADLINE_LABEL}.
            </p>
            <p className="mt-3 max-w-md rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
              For schools only — not for individual students.
            </p>

            <ul className="mt-8 space-y-4">
              {SCHOOL_HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="mt-0.5 text-sm text-white/65">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/brand/icape-logo.webp"
                alt="i-CAPE"
                width={80}
                height={80}
                className="h-16 w-auto object-contain sm:h-[4.5rem]"
                priority
              />
              <h2 className="mt-4 font-[family-name:var(--font-source-serif)] text-2xl font-bold text-brand sm:text-3xl">
                Create Login Account
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-24 bg-accent" aria-hidden />
              <p className="mt-3 text-sm text-muted sm:text-base">
                Register with school name, mobile, email, and password
              </p>
            </div>

            <form
              className="mt-8 space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <div>
                <label
                  htmlFor="school-reg-name"
                  className="mb-1.5 block text-sm font-semibold text-brand"
                >
                  School name
                </label>
                <Input
                  id="school-reg-name"
                  placeholder="School name"
                  autoComplete="organization"
                  {...form.register("name", {
                    onChange: (e) => {
                      const next = toTitleCaseInput(e.target.value);
                      e.target.value = next;
                      form.setValue("name", next, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    },
                  })}
                />
                {form.formState.errors.name ? (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="school-reg-mobile"
                  className="mb-1.5 block text-sm font-semibold text-brand"
                >
                  Mobile
                </label>
                <Input
                  id="school-reg-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  {...form.register("mobile")}
                />
                {form.formState.errors.mobile ? (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {form.formState.errors.mobile.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="school-reg-email"
                  className="mb-1.5 block text-sm font-semibold text-brand"
                >
                  Registered Email ID
                </label>
                <Input
                  id="school-reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Registered Email ID"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="school-reg-password"
                  className="mb-1.5 block text-sm font-semibold text-brand"
                >
                  Password
                </label>
                <PasswordInput
                  id="school-reg-password"
                  autoComplete="new-password"
                  placeholder="Password (min. 6 characters)"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="accent"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Creating…"
                  : "Create Login Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link
                href="/school/login"
                className="font-semibold text-brand hover:underline"
              >
                School login
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
