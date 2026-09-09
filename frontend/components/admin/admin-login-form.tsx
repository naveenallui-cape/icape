"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@icape.in");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
    });
    setLoading(false);
    if (!res.success) {
      setError(res.message || "Login failed");
      return;
    }
    router.replace("/admin/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070d22] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_25%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/brand/icape-logo.webp"
            alt="i-CAPE"
            width={72}
            height={72}
            className="h-16 w-auto object-contain"
            priority
          />
          <h1 className="mt-4 text-2xl font-bold text-white">Admin Login</h1>
          <p className="mt-1 text-sm text-white/70">
            i-CAPE Olympiad Administration Portal
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/85">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/20 bg-white/95 pl-9"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/85">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/20 bg-white/95 pl-9 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-brand/60 hover:text-brand"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
