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
import { schoolResetPassword } from "@/lib/school-api";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
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

type FormValues = z.infer<typeof schema>;

export default function SchoolResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", otp: "", password: "", confirm: "" },
  });

  async function onSubmit(values: FormValues) {
    setError("");
    const res = await schoolResetPassword({
      email: values.email,
      otp: values.otp,
      password: values.password,
    });
    if (!res.success) {
      setError(res.message);
      return;
    }
    router.replace("/school/login");
  }

  return (
    <SchoolAuthShell
      title="Set new password"
      description="Enter your email, the 4-digit OTP from your inbox, and a new password."
      footer={
        <Link
          href="/school/forgot-password"
          className="font-semibold text-brand hover:underline"
        >
          Request a new OTP
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            Email
          </label>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            4-digit OTP
          </label>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            {...form.register("otp")}
          />
          {form.formState.errors.otp ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.otp.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            New password
          </label>
          <PasswordInput
            autoComplete="new-password"
            {...form.register("password")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            Confirm password
          </label>
          <PasswordInput
            autoComplete="new-password"
            {...form.register("confirm")}
          />
          {form.formState.errors.confirm ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.confirm.message}
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving…" : "Update password"}
        </Button>
      </form>
    </SchoolAuthShell>
  );
}
