import { SchoolShell } from "@/components/school/school-shell";

export default function SchoolAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SchoolShell>{children}</SchoolShell>;
}
