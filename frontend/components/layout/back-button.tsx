"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;

  return (
    <div className="w-full bg-surface px-5 pt-3 sm:px-8 lg:px-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-accent sm:text-base"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </button>
    </div>
  );
}
