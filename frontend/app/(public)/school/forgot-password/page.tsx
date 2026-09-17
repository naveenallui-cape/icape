"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SchoolAuthShell } from "@/components/school/school-auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  schoolForgotPassword,
  schoolResetPassword,
} from "@/lib/school-api";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const resetSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter the 4-digit OTP"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function SchoolForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", password: "", confirm: "" },
  });

  async function onSendOtp(values: EmailFormValues) {
    setError("");
    setMessage("");
    const res = await schoolForgotPassword(values.email);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setEmail(values.email.trim().toLowerCase());
    setStep("otp");
    setMessage(
      "If an account exists for that email, a 4-digit OTP has been sent.",
    );
  }

  async function onReset(values: ResetFormValues) {
    setError("");
    setMessage("");
    const res = await schoolResetPassword({
      email,
      otp: values.otp,
      password: values.password,
    });
    if (!res.success) {
      setError(res.message);
      return;
    }
    router.replace("/school/login");
  }

  async function onResendOtp() {
    setError("");
    setMessage("");
    const res = await schoolForgotPassword(email);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMessage("A new OTP has been sent if the account exists.");
  }

  if (step === "otp") {
    return (
      <SchoolAuthShell
        title="Enter OTP"
        description="Check your email for the 4-digit code, then set a new password."
        footer={
          <button
            type="button"
            className="font-semibold text-brand hover:underline"
            onClick={() => {
              setStep("email");
              setError("");
              setMessage("");
            }}
          >
            Use a different email
          </button>
        }
      >
        <form
          className="space-y-4"
          onSubmit={resetForm.handleSubmit(onReset)}
          noValidate
        >
          <p className="text-sm text-muted">
            OTP sent to <span className="font-semibold text-brand">{email}</span>
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand">
              4-digit OTP
            </label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              {...resetForm.register("otp")}
            />
            {resetForm.formState.errors.otp ? (
              <p className="mt-1 text-sm text-red-600">
                {resetForm.formState.errors.otp.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand">
              New password
            </label>
            <PasswordInput
              autoComplete="new-password"
              {...resetForm.register("password")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand">
              Confirm password
            </label>
            <PasswordInput
              autoComplete="new-password"
              {...resetForm.register("confirm")}
            />
            {resetForm.formState.errors.confirm ? (
              <p className="mt-1 text-sm text-red-600">
                {resetForm.formState.errors.confirm.message}
              </p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-brand">{message}</p> : null}
          <Button
            type="submit"
            className="w-full"
            disabled={resetForm.formState.isSubmitting}
          >
            {resetForm.formState.isSubmitting
              ? "Updating…"
              : "Update password"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void onResendOtp()}
          >
            Resend OTP
          </Button>
        </form>
      </SchoolAuthShell>
    );
  }

  return (
    <SchoolAuthShell
      title="Forgot password"
      description="Enter your school account email. We will send a 4-digit OTP if it exists."
      footer={
        <Link
          href="/school/login"
          className="font-semibold text-brand hover:underline"
        >
          Back to login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={emailForm.handleSubmit(onSendOtp)}
        noValidate
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            Email
          </label>
          <Input
            type="email"
            autoComplete="email"
            {...emailForm.register("email")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-brand">{message}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={emailForm.formState.isSubmitting}
        >
          {emailForm.formState.isSubmitting ? "Sending…" : "Send OTP"}
        </Button>
      </form>
    </SchoolAuthShell>
  );
}
