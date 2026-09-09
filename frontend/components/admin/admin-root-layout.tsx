"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export function AdminRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return children;
  }
  return <AdminShell>{children}</AdminShell>;
}
