"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { schoolRegister } from "@/lib/school-api";
import { toTitleCaseInput } from "@/lib/title-case";

const schema = z.object({
  name: z.string().trim().min(2, "School name is required"),
  mobile: z
    .string()
    .trim()
    .min(10, "Enter a valid mobile number")
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function SchoolRegisterForm() {
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
    router.replace("/school/portal");
  }

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            School name
          </label>
          <Input
            placeholder="School name"
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
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            Mobile
          </label>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            {...form.register("mobile")}
          />
          {form.formState.errors.mobile ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.mobile.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            Registered Email ID
          </label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="Registered Email ID"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand">
            Password
          </label>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Password (min. 6 characters)"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating…" : "Create Login Account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/school/login"
          className="font-semibold text-brand hover:underline"
        >
          School login
        </Link>
      </p>
    </>
  );
}
