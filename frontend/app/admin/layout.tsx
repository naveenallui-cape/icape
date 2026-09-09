import { ReactNode } from "react";
import { AdminRootLayout } from "@/components/admin/admin-root-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminRootLayout>{children}</AdminRootLayout>;
}
