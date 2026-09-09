"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;

  return (
    <div className="w-full bg-surface px-5 pt-4 sm:px-8 lg:px-10">
      <Button
        type="button"
        variant="accent"
        size="lg"
        onClick={() => router.back()}
        className="rounded-xl px-5 text-base sm:px-6 sm:text-lg"
      >
        <ArrowLeft className="size-5 sm:size-6" aria-hidden />
        Back
      </Button>
    </div>
  );
}
