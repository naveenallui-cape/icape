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
import { schoolLogin } from "@/lib/school-api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function SchoolLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setError("");
    const res = await schoolLogin(values.email, values.password);
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
            autoComplete="current-password"
            placeholder="Password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in…" : "Login"}
          </Button>
          <Link href="/school/forgot-password" className="w-full">
            <Button type="button" variant="outline" className="w-full">
              Forgot Password
            </Button>
          </Link>
        </div>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/school/register"
          className="font-semibold text-brand hover:underline"
        >
          Create Login Account
        </Link>
      </p>
    </>
  );
}
