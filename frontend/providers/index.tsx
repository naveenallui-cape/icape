"use client";

import { ServerStatusProvider } from "@/components/server-status-provider";
import { QueryProvider } from "@/providers/query-provider";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ServerStatusProvider>{children}</ServerStatusProvider>
    </QueryProvider>
  );
}
