"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GraduationCap } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <article className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_40px_rgba(13,23,59,0.06)] sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand text-accent">
          <GraduationCap className="size-6" aria-hidden />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-brand">Student Result</h3>
        <p className="mt-2 text-base text-muted">
          View your Olympiad results with registration number and grade.
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
          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={studentLoading}
          >
            {studentLoading ? "Checking…" : "View Result"}
          </Button>
        </form>
      </article>

      <p className="text-center text-sm text-muted">
        Schools can view school-wide results after logging in to the{" "}
        <a
          href="/school/login"
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          school portal
        </a>
        .
      </p>
    </div>
  );
}
