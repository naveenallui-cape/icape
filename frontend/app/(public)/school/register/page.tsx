import { SchoolAuthShell } from "@/components/school/school-auth-shell";
import { SchoolRegisterForm } from "@/components/school/school-register-form";

export default function SchoolRegisterPage() {
  return (
    <SchoolAuthShell
      title="Create Login Account"
      description="Register with your school name, mobile, email, and password"
    >
      <SchoolRegisterForm />
    </SchoolAuthShell>
  );
}
