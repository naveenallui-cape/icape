"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;

  return (
    <Button
      type="button"
      variant="accent"
      size="default"
      onClick={() => router.back()}
      className="no-print shrink-0 rounded-xl px-3 text-sm sm:px-4 sm:text-base"
    >
      <ArrowLeft className="size-4 sm:size-5" aria-hidden />
      Back
    </Button>
  );
}
