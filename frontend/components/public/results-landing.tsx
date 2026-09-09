"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GraduationCap, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RESULT_GRADES } from "@/lib/results";
import { apiRequest } from "@/lib/api";

export function ResultsLanding() {
  const router = useRouter();
  const [regNo, setRegNo] = useState("");
  const [grade, setGrade] = useState("");
  const [studentError, setStudentError] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);

  const [schoolQ, setSchoolQ] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [schoolLoading, setSchoolLoading] = useState(false);

  async function onStudentSubmit(e: FormEvent) {
    e.preventDefault();
    setStudentError("");
    if (!regNo.trim()) {
      setStudentError("Registration number is required.");
      return;
    }
    if (!grade) {
      setStudentError("Grade is required.");
      return;
    }
    setStudentLoading(true);
    const params = new URLSearchParams({
      registrationNumber: regNo.trim(),
      grade,
    });
    const res = await apiRequest(`/results/student?${params.toString()}`);
    setStudentLoading(false);
    if (!res.success) {
      setStudentError(res.message);
      return;
    }
    router.push(
      `/results/student?registrationNumber=${encodeURIComponent(regNo.trim())}&grade=${grade}`,
    );
  }

  async function onSchoolSubmit(e: FormEvent) {
    e.preventDefault();
    setSchoolError("");
    if (!schoolQ.trim()) {
      setSchoolError("Enter School ID or School Name.");
      return;
    }
    setSchoolLoading(true);
    const params = new URLSearchParams({ q: schoolQ.trim() });
    const res = await apiRequest<{
      schools: Array<{ id: string; schoolCode: string; name: string }>;
    }>(`/results/school/search?${params.toString()}`);
    setSchoolLoading(false);
    if (!res.success) {
      setSchoolError(res.message);
      return;
    }
    const schools = res.data?.schools ?? [];
    if (schools.length === 0) {
      setSchoolError("School not found. Please verify the School ID or name.");
      return;
    }
    const first = schools[0];
    router.push(
      `/results/school?schoolCode=${encodeURIComponent(first.schoolCode)}&q=${encodeURIComponent(schoolQ.trim())}`,
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_40px_rgba(13,23,59,0.06)] sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand text-accent">
            <GraduationCap className="size-6" aria-hidden />
          </div>
          <h3 className="mt-5 text-2xl font-bold text-brand">Student Result</h3>
          <p className="mt-2 text-base text-muted">
            View your Olympiad results
          </p>

          <form className="mt-6 space-y-4" onSubmit={onStudentSubmit}>
            <div>
              <label
                htmlFor="reg-no"
                className="mb-1.5 block text-sm font-semibold text-brand"
              >
                Registration Number
              </label>
              <Input
                id="reg-no"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. REG10001"
                autoComplete="off"
              />
            </div>
            <div>
              <label
                htmlFor="grade"
                className="mb-1.5 block text-sm font-semibold text-brand"
              >
                Grade / Class
              </label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-brand shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <option value="">Select grade</option>
                {RESULT_GRADES.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            {studentError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {studentError}
              </p>
            ) : null}
            <Button type="submit" variant="accent" className="w-full" disabled={studentLoading}>
              {studentLoading ? "Checking…" : "View Result"}
            </Button>
          </form>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_40px_rgba(13,23,59,0.06)] sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand text-accent">
            <School className="size-6" aria-hidden />
          </div>
          <h3 className="mt-5 text-2xl font-bold text-brand">School Result</h3>
          <p className="mt-2 text-base text-muted">
            View school-wide results
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSchoolSubmit}>
            <div>
              <label
                htmlFor="school-q"
                className="mb-1.5 block text-sm font-semibold text-brand"
              >
                School ID or School Name
              </label>
              <Input
                id="school-q"
                value={schoolQ}
                onChange={(e) => setSchoolQ(e.target.value)}
                placeholder="e.g. ICAPE-HYD-001"
                autoComplete="off"
              />
            </div>
            {schoolError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {schoolError}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="accent"
              className="w-full"
              disabled={schoolLoading}
            >
              {schoolLoading ? "Searching…" : "Continue"}
            </Button>
          </form>
        </article>
      </div>
    </div>
  );
}
