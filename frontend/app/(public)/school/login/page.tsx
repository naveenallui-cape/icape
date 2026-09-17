import { SchoolAuthShell } from "@/components/school/school-auth-shell";
import { SchoolLoginForm } from "@/components/school/school-login-form";

export default function SchoolLoginPage() {
  return (
    <SchoolAuthShell
      title="School login"
      description="Please enter your registered Email ID and Password"
    >
      <SchoolLoginForm />
    </SchoolAuthShell>
  );
}
