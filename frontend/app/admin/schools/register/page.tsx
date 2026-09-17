"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { computeRegistrationFee, PAYMENT_METHODS, paymentReferenceField, type PaymentMethod } from "@/lib/payment-details";
import { toTitleCaseInput } from "@/lib/title-case";
import { cn } from "@/lib/utils";
import { PaymentFeeSummary } from "@/components/school/payment-fee-summary";
import {
  ensureStudentsForGrade,
  gradeStudentIndices,
  GradeSwitchButtons,
  isStudentGrade,
  namedCountByGrade,
  type StudentGrade,
} from "@/components/school/grade-switch-buttons";

const INITIAL_STUDENT_ROWS = 30;
const phoneRegex = /^[0-9+\-\s]{10,15}$/;

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "School details" },
  { id: 3, label: "Students" },
  { id: 4, label: "Payment" },
] as const;

const accountSchema = z.object({
  name: z.string().trim().min(2, "School name is required"),
  email: z.string().trim().email("Enter a valid email"),
  mobile: z
    .string()
    .trim()
    .min(10, "Enter a valid mobile number")
    .regex(phoneRegex, "Enter a valid mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const schoolSchema = z
  .object({
    schoolName: z.string().trim().min(2, "School name is required"),
    address: z.string().trim().min(5, "School address is required"),
    city: z.string().trim().min(2, "City is required"),
    district: z.string().trim().min(2, "District is required"),
    state: z.string().trim().min(2, "State is required"),
    pincode: z.string().trim().min(4, "Pin code is required").max(12),
    country: z.enum(["India", "Other"]),
    countryOther: z.string().trim().max(80),
    website: z.string().trim().max(200),
    affiliation: z.enum(["CBSE", "ICSE", "STATE_BOARD", "OTHER"]),
    affiliationOther: z.string().trim().max(80),
    trustName: z.string().trim().min(2, "Trust / Society name is required"),
    schoolMobile: z
      .string()
      .trim()
      .regex(phoneRegex, "Enter a valid school mobile"),
    landline: z.string().trim().max(20),
    stdCode: z.string().trim().max(10),
    email: z.string().trim().email("Enter a valid school email"),
    principalName: z.string().trim().min(2, "Principal name is required"),
    principalMobile: z
      .string()
      .trim()
      .regex(phoneRegex, "Enter a valid principal mobile"),
    principalEmail: z.string().trim().email("Enter a valid principal email"),
    contactName: z.string().trim().min(2, "Incharge name is required"),
    phone: z.string().trim().regex(phoneRegex, "Enter a valid incharge mobile"),
    inchargeEmail: z.string().trim().email("Enter a valid incharge email"),
  })
  .superRefine((data, ctx) => {
    if (data.country === "Other" && !data.countryOther.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country name is required",
        path: ["countryOther"],
      });
    }
    if (data.affiliation === "OTHER" && !data.affiliationOther.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please mention affiliation",
        path: ["affiliationOther"],
      });
    }
  });

type AccountFormValues = z.infer<typeof accountSchema>;
type SchoolFormValues = z.infer<typeof schoolSchema>;

type StudentRow = {
  id?: string;
  clientKey?: string;
  registrationNumber?: string;
  name: string;
  grade: number;
  section: string;
  mobile: string;
  imo: boolean;
  iso: boolean;
  ieo: boolean;
};

type RegistrationPayload = {
  id: string;
  schoolCode: string;
  schoolName: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  countryOther?: string;
  website?: string;
  affiliation?: string;
  affiliationOther?: string;
  trustName?: string;
  schoolMobile?: string;
  landline?: string;
  stdCode?: string;
  email?: string;
  principalName?: string;
  principalMobile?: string;
  principalEmail?: string;
  contactName?: string;
  phone?: string;
  inchargeEmail?: string;
  gradeCounts?: Record<string, number>;
  feeExpected: number;
  status: string;
  currentStep?: number;
  students: StudentRow[];
  olympiadYear: { label: string; code: string };
  payment?: {
    utr: string;
    paymentMethod?: PaymentMethod;
    status?: string;
    adminNote: string | null;
  } | null;
  locked?: boolean;
};

const RESUME_KEY = "icape-admin-register-account";

function rememberAccount(accountId: string) {
  try {
    sessionStorage.setItem(RESUME_KEY, accountId);
  } catch {
    /* ignore */
  }
}

function clearRememberedAccount() {
  try {
    sessionStorage.removeItem(RESUME_KEY);
  } catch {
    /* ignore */
  }
}

function adminStepStorageKey(accountId: string) {
  return `icape:admin-register-step:${accountId}`;
}

function readStoredAdminStep(accountId: string): number | null {
  try {
    const raw = sessionStorage.getItem(adminStepStorageKey(accountId));
    const n = Number(raw);
    if (n >= 1 && n <= 4) return n;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredAdminStep(accountId: string, step: number) {
  try {
    sessionStorage.setItem(adminStepStorageKey(accountId), String(step));
  } catch {
    /* ignore */
  }
}

function resolveResumeStep(
  reg: RegistrationPayload,
  accountId?: string,
) {
  if (
    reg.status === "UNDER_REVIEW" ||
    reg.status === "APPROVED" ||
    reg.status === "REJECTED"
  ) {
    return 4;
  }
  if (!isSchoolDetailsSaved(reg)) {
    const storedEarly = accountId ? readStoredAdminStep(accountId) : null;
    if (storedEarly === 1 || storedEarly === 2) return storedEarly;
    return 2;
  }
  const namedStudents = (reg.students || []).filter((s) => s.name?.trim());
  const stored = accountId ? readStoredAdminStep(accountId) : null;
  if (namedStudents.length === 0) {
    if (stored === 2 || stored === 3) return stored;
    return 3;
  }
  // Honor the step the admin was on (Students vs Payment).
  if (stored === 2 || stored === 3 || stored === 4) {
    if (stored === 4 && (reg.payment?.utr || (reg.currentStep ?? 0) >= 3)) {
      return 4;
    }
    if (stored === 3 || stored === 2) return stored;
  }
  // Unpaid draft with students: stay on Students — don't auto-open Payment.
  if (!reg.payment?.utr && !reg.payment?.status) return 3;
  if ((reg.currentStep ?? 0) >= 3 || reg.payment?.utr || reg.payment?.status) {
    return 4;
  }
  return 3;
}

/** School details count as saved only when required fields are filled — not just a draft name. */
function isSchoolDetailsSaved(
  reg: Partial<
    Pick<
      RegistrationPayload,
      | "schoolName"
      | "address"
      | "city"
      | "district"
      | "state"
      | "pincode"
      | "trustName"
      | "schoolMobile"
      | "email"
      | "principalName"
      | "principalMobile"
      | "principalEmail"
      | "contactName"
      | "phone"
      | "inchargeEmail"
    >
  >,
) {
  return Boolean(
    reg.schoolName?.trim() &&
      reg.address?.trim() &&
      reg.city?.trim() &&
      reg.district?.trim() &&
      reg.state?.trim() &&
      reg.pincode?.trim() &&
      reg.trustName?.trim() &&
      reg.schoolMobile?.trim() &&
      reg.email?.trim() &&
      reg.principalName?.trim() &&
      reg.principalMobile?.trim() &&
      reg.principalEmail?.trim() &&
      reg.contactName?.trim() &&
      reg.phone?.trim() &&
      reg.inchargeEmail?.trim(),
  );
}

/** Highest step that was actually saved — not just visited. */
function resolveCompletedThrough(
  reg: RegistrationPayload | null | undefined,
  hasAccount: boolean,
) {
  if (!hasAccount) return 0;
  if (!reg) return 1;
  if (reg.status === "APPROVED" || reg.status === "UNDER_REVIEW") return 4;
  const named = (reg.students || []).filter((s) => s.name?.trim()).length;
  if (named > 0) return 3;
  if (isSchoolDetailsSaved(reg)) return 2;
  return 1;
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        className={cn(
          "mb-1.5 block text-sm font-semibold",
          error ? "text-red-600" : "text-brand",
        )}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

let studentKeySeq = 0;
function nextStudentKey() {
  studentKeySeq += 1;
  return `s-${studentKeySeq}`;
}

function emptyStudent(grade = 0): StudentRow {
  return {
    clientKey: nextStudentKey(),
    name: "",
    grade,
    section: "",
    mobile: "",
    imo: false,
    iso: false,
    ieo: false,
  };
}

function createEmptyStudents(count: number, grade = 0): StudentRow[] {
  return Array.from({ length: count }, () => emptyStudent(grade));
}

function AdminRegisterSchoolPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdFromUrl = searchParams.get("accountId")?.trim() || "";

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingResume, setLoadingResume] = useState(Boolean(accountIdFromUrl));
  const [accountId, setAccountId] = useState(accountIdFromUrl);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [activeGrade, setActiveGrade] = useState<StudentGrade>(3);
  const [studentRowErrors, setStudentRowErrors] = useState<Record<number, string>>(
    {},
  );
  const [utr, setUtr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [adminNote, setAdminNote] = useState("");
  const [approveNow, setApproveNow] = useState(false);
  const [done, setDone] = useState<RegistrationPayload | null>(null);
  const [completedThrough, setCompletedThrough] = useState(0);
  const stepReadyRef = useRef(false);

  useEffect(() => {
    if (!accountId || !stepReadyRef.current) return;
    writeStoredAdminStep(accountId, step);
  }, [accountId, step]);

  function goToStep(next: number, forAccountId = accountId) {
    stepReadyRef.current = true;
    setStep(next);
    if (forAccountId) writeStoredAdminStep(forAccountId, next);
  }

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", email: "", mobile: "", password: "" },
  });

  const schoolForm = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      schoolName: "",
      address: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      country: "India",
      countryOther: "",
      website: "",
      affiliation: "CBSE",
      affiliationOther: "",
      trustName: "",
      schoolMobile: "",
      landline: "",
      stdCode: "",
      email: "",
      principalName: "",
      principalMobile: "",
      principalEmail: "",
      contactName: "",
      phone: "",
      inchargeEmail: "",
    },
  });

  const feeExpected = useMemo(
    () => computeRegistrationFee(students.filter((s) => s.name.trim())),
    [students],
  );

  const watchedSchoolName = schoolForm.watch("schoolName");
  const displaySchoolName =
    (watchedSchoolName || accountName || "").trim() || "—";
  const displayEmail = (accountEmail || "").trim() || "—";
  const displaySchoolCode = (schoolCode || "").trim() || "—";

  function applyAccountUrl(id: string) {
    rememberAccount(id);
    router.replace(`/admin/schools/register?accountId=${encodeURIComponent(id)}`);
  }

  function exitToRegisterHome() {
    clearRememberedAccount();
    setAccountId("");
    setAccountEmail("");
    setAccountName("");
    setSchoolCode("");
    setError("");
    setDone(null);
    setStep(1);
    setCompletedThrough(0);
    setStudents([]);
    setUtr("");
    setAdminNote("");
    accountForm.reset();
    schoolForm.reset({
      schoolName: "",
      address: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      country: "India",
      countryOther: "",
      website: "",
      affiliation: "CBSE",
      affiliationOther: "",
      trustName: "",
      schoolMobile: "",
      landline: "",
      stdCode: "",
      email: "",
      principalName: "",
      principalMobile: "",
      principalEmail: "",
      contactName: "",
      phone: "",
      inchargeEmail: "",
    });
    router.replace("/admin/incomplete-registrations");
  }

  function hydrateFromRegistration(
    account: { id: string; email: string; name: string },
    reg: RegistrationPayload,
  ) {
    if (reg.status === "APPROVED" || reg.status === "UNDER_REVIEW") {
      setError(
        reg.status === "APPROVED"
          ? "This school registration is already approved and cannot be edited."
          : "This registration is under review. Use Payment verification to approve or reject it.",
      );
      setAccountId(account.id);
      setAccountEmail(account.email);
      setAccountName(account.name);
      setSchoolCode(reg.schoolCode || "");
      setCompletedThrough(resolveCompletedThrough(reg, true));
      setLoadingResume(false);
      return;
    }

    setAccountId(account.id);
    setAccountEmail(account.email);
    setAccountName(account.name);
    setSchoolCode(reg.schoolCode || "");
    setCompletedThrough(resolveCompletedThrough(reg, true));
    rememberAccount(account.id);

    const affiliation =
      reg.affiliation === "ICSE" ||
      reg.affiliation === "STATE_BOARD" ||
      reg.affiliation === "OTHER"
        ? reg.affiliation
        : "CBSE";

    schoolForm.reset({
      schoolName: reg.schoolName || "",
      address: reg.address || "",
      city: reg.city || "",
      district: reg.district || "",
      state: reg.state || "",
      pincode: reg.pincode || "",
      country: reg.country === "Other" ? "Other" : "India",
      countryOther: reg.countryOther || "",
      website: reg.website || "",
      affiliation,
      affiliationOther: reg.affiliationOther || "",
      trustName: reg.trustName || "",
      schoolMobile: reg.schoolMobile || "",
      landline: reg.landline || "",
      stdCode: reg.stdCode || "",
      email: reg.email || account.email,
      principalName: reg.principalName || "",
      principalMobile: reg.principalMobile || "",
      principalEmail: reg.principalEmail || "",
      contactName: reg.contactName || "",
      phone: reg.phone || "",
      inchargeEmail: reg.inchargeEmail || "",
    });

    const named = (reg.students || [])
      .filter((s) => s.name?.trim())
      .map((s) => ({
        id: s.id,
        registrationNumber: s.registrationNumber,
        name: s.name,
        grade: s.grade,
        section: s.section || "",
        mobile: s.mobile || "",
        imo: Boolean(s.imo),
        iso: Boolean(s.iso),
        ieo: Boolean(s.ieo),
      }));
    setStudents(
      named.length
        ? ensureStudentsForGrade(
            named.map((s) => ({
              ...s,
              clientKey: s.id ? undefined : nextStudentKey(),
            })),
            activeGrade,
            emptyStudent,
            INITIAL_STUDENT_ROWS,
          )
        : [],
    );

    if (reg.payment?.utr) setUtr(reg.payment.utr);
    if (reg.payment?.paymentMethod) setPaymentMethod(reg.payment.paymentMethod);
    if (reg.payment?.adminNote) setAdminNote(reg.payment.adminNote);

    stepReadyRef.current = true;
    const resumeStep = resolveResumeStep(reg, account.id);
    setStep(resumeStep);
    if (account.id) writeStoredAdminStep(account.id, resumeStep);
    setDone(null);
    setError("");
    setLoadingResume(false);
  }

  async function loadAccount(id: string) {
    setLoadingResume(true);
    setError("");
    const res = await apiRequest<{
      account: { id: string; email: string; name: string };
      registration: RegistrationPayload;
    }>(`/admin/school-registrations/accounts/${id}`);
    if (!res.success || !res.data) {
      setError(res.message || "Could not resume this registration");
      setLoadingResume(false);
      return;
    }
    hydrateFromRegistration(res.data.account, res.data.registration);
  }

  useEffect(() => {
    if (accountIdFromUrl) {
      void loadAccount(accountIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountIdFromUrl]);

  useEffect(() => {
    if (step !== 3) return;
    setStudents((prev) =>
      ensureStudentsForGrade(
        prev,
        activeGrade,
        emptyStudent,
        INITIAL_STUDENT_ROWS,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering the step
  }, [step]);

  const gradeIndices = useMemo(
    () => gradeStudentIndices(students, activeGrade),
    [students, activeGrade],
  );
  const gradeCounts = useMemo(() => namedCountByGrade(students), [students]);

  function switchGrade(grade: StudentGrade) {
    if (grade === activeGrade) return;
    setStudentRowErrors({});
    setStudents((prev) =>
      ensureStudentsForGrade(
        prev,
        grade,
        emptyStudent,
        INITIAL_STUDENT_ROWS,
      ),
    );
    setActiveGrade(grade);
  }

  function titleCaseField(name: keyof SchoolFormValues | keyof AccountFormValues) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const next = toTitleCaseInput(e.target.value);
      e.target.value = next;
      if (name in accountForm.getValues()) {
        accountForm.setValue(name as keyof AccountFormValues, next as never, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      if (name in schoolForm.getValues()) {
        schoolForm.setValue(name as keyof SchoolFormValues, next as never, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    };
  }

  async function onCreateAccount(values: AccountFormValues) {
    setError("");
    setSaving(true);
    const res = await apiRequest<{
      account: { id: string; email: string; name: string };
      registration: RegistrationPayload;
    }>("/admin/school-registrations/accounts", {
      method: "POST",
      body: values,
    });
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    setAccountId(res.data.account.id);
    setAccountEmail(res.data.account.email);
    setAccountName(res.data.account.name);
    setSchoolCode(res.data.registration.schoolCode || "");
    setCompletedThrough(1);
    schoolForm.setValue("email", values.email);
    schoolForm.setValue("schoolName", values.name);
    schoolForm.setValue("schoolMobile", values.mobile);
    goToStep(2, res.data.account.id);
    applyAccountUrl(res.data.account.id);
  }

  async function onSaveSchool(values: SchoolFormValues) {
    setError("");
    setSaving(true);
    const res = await apiRequest<RegistrationPayload>(
      `/admin/school-registrations/accounts/${accountId}/step/1`,
      {
        method: "PUT",
        body: values,
      },
    );
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    setSchoolCode(res.data.schoolCode || schoolCode);
    setCompletedThrough((prev) => Math.max(prev, 2));
    goToStep(3);
  }

  async function onSaveStudents() {
    setError("");
    const rowErrors: Record<number, string> = {};
    const cleaned = students.filter((s) => s.name.trim());
    if (cleaned.length === 0) {
      students.forEach((s, i) => {
        if (!s.name.trim()) rowErrors[i] = "Student name is required";
      });
      setStudentRowErrors(rowErrors);
      setError("Enter at least one student name");
      return;
    }
    for (const [i, s] of students.entries()) {
      if (!s.name.trim()) continue;
      if (!isStudentGrade(s.grade) || (!s.imo && !s.iso && !s.ieo)) {
        rowErrors[i] = "Select at least one olympiad";
      }
    }
    if (Object.keys(rowErrors).length > 0) {
      setStudentRowErrors(rowErrors);
      const firstIndex = Object.keys(rowErrors)
        .map(Number)
        .sort((a, b) => a - b)[0];
      const errorGrade = students[firstIndex]?.grade;
      if (isStudentGrade(errorGrade) && errorGrade !== activeGrade) {
        setActiveGrade(errorGrade);
      }
      return;
    }
    setStudentRowErrors({});
    setSaving(true);
    const res = await apiRequest<RegistrationPayload>(
      `/admin/school-registrations/accounts/${accountId}/step/2`,
      {
        method: "PUT",
        body: {
          draft: false,
          students: cleaned.map((s) => ({
            id: s.id,
            registrationNumber: s.registrationNumber,
            name: s.name.trim().toUpperCase(),
            grade: s.grade,
            section: (s.section || "").trim().toUpperCase(),
            mobile: (s.mobile || "").trim(),
            imo: Boolean(s.imo),
            iso: Boolean(s.iso),
            ieo: Boolean(s.ieo),
          })),
        },
      },
    );
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    setStudents(
      res.data.students.map((s) => ({
        id: s.id,
        registrationNumber: s.registrationNumber,
        name: s.name,
        grade: s.grade,
        section: s.section || "",
        mobile: s.mobile || "",
        imo: Boolean(s.imo),
        iso: Boolean(s.iso),
        ieo: Boolean(s.ieo),
      })),
    );
    setCompletedThrough((prev) => Math.max(prev, 3));
    goToStep(4);
  }

  async function onSubmitPayment() {
    setError("");
    const incomplete: string[] = [];
    if (!isSchoolDetailsSaved({
      schoolName: schoolForm.getValues("schoolName"),
      address: schoolForm.getValues("address"),
      city: schoolForm.getValues("city"),
      district: schoolForm.getValues("district"),
      state: schoolForm.getValues("state"),
      pincode: schoolForm.getValues("pincode"),
      trustName: schoolForm.getValues("trustName"),
      schoolMobile: schoolForm.getValues("schoolMobile"),
      email: schoolForm.getValues("email"),
      principalName: schoolForm.getValues("principalName"),
      principalMobile: schoolForm.getValues("principalMobile"),
      principalEmail: schoolForm.getValues("principalEmail"),
      contactName: schoolForm.getValues("contactName"),
      phone: schoolForm.getValues("phone"),
      inchargeEmail: schoolForm.getValues("inchargeEmail"),
    })) {
      incomplete.push("School details");
    }
    const named = students.filter((s) => s.name.trim());
    const studentsIncomplete =
      named.length === 0 ||
      named.some(
        (s) => !isStudentGrade(s.grade) || (!s.imo && !s.iso && !s.ieo),
      );
    if (studentsIncomplete) {
      incomplete.push("Students");
    }
    if (incomplete.length > 0) {
      const label =
        incomplete.length === 1
          ? incomplete[0]
          : incomplete.join(" and ");
      setError(
        `${label} ${incomplete.length === 1 ? "is" : "are"} incomplete. Complete ${incomplete.length === 1 ? "this step" : "these steps"} before submitting for verification.`,
      );
      goToStep(incomplete[0] === "School details" ? 2 : 3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      setError("Select payment method");
      return;
    }
    const selectedPaymentMethod = paymentMethod as PaymentMethod;
    const paymentReference = paymentReferenceField(selectedPaymentMethod);
    if (!approveNow && utr.trim().length < 6) {
      setError(`${paymentReference.requiredError} (min 6 characters)`);
      return;
    }
    setSaving(true);
    const res = await apiRequest<RegistrationPayload>(
      `/admin/school-registrations/accounts/${accountId}/step/3`,
      {
        method: "PUT",
        body: {
          paymentMethod: selectedPaymentMethod,
          utr: utr.trim(),
          approve: approveNow,
          adminNote: adminNote.trim() || undefined,
        },
      },
    );
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    setDone(res.data);
    setCompletedThrough(4);
    clearRememberedAccount();
  }

  if (loadingResume) {
    return (
      <div className="rounded-2xl border border-border bg-white px-4 py-10 text-center text-sm text-muted">
        Loading registration…
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-green-600 text-white">
              <Check className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold text-brand">
                School registered successfully
              </h1>
              <p className="mt-1 text-sm text-muted">
                {done.schoolName} · Code {done.schoolCode} · Status{" "}
                {done.status.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-sm text-brand">
                {done.students.length} student
                {done.students.length === 1 ? "" : "s"} · Fee ₹
                {Number(done.feeExpected || feeExpected).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/schools"
            className={buttonVariants({ variant: "accent" })}
          >
            Back to schools
          </Link>
          <Link
            href="/admin/students"
            className={buttonVariants({ variant: "outline" })}
          >
            View students
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearRememberedAccount();
              setDone(null);
              exitToRegisterHome();
            }}
          >
            Register another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {accountId ? (
            <button
              type="button"
              className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand"
              onClick={() => exitToRegisterHome()}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </button>
          ) : null}
          <h1 className="text-2xl font-bold text-brand">
            {accountId ? "Continue school registration" : "Register school"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Same flow as the school portal — account, school details, students,
            then payment. Incomplete work appears under Incomplete
            registrations.
          </p>
          {accountId ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[1.05rem] leading-snug text-muted">
              <p>
                School Name:{" "}
                <span className="font-semibold text-brand">
                  {displaySchoolName}
                </span>
              </p>
              <p>
                Email:{" "}
                <span className="font-semibold text-brand">{displayEmail}</span>
              </p>
              <p>
                School Code:{" "}
                <span className="font-mono text-[1.05rem] font-bold tracking-wider text-brand">
                  {displaySchoolCode}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Registration steps"
        className="w-full overflow-x-auto rounded-2xl border border-border bg-white px-3 py-4 sm:px-6"
      >
        <ol className="flex min-w-[720px] items-center justify-between gap-1 sm:min-w-0">
          {STEPS.map((item, index) => {
            const state =
              item.id === step
                ? "current"
                : item.id <= completedThrough
                  ? "completed"
                  : item.id < step
                    ? "incomplete"
                    : "pending";
            const canJump = Boolean(accountId) || item.id === 1;
            return (
              <li key={item.id} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={() => {
                    if (!canJump) return;
                    setError("");
                    goToStep(item.id);
                  }}
                  className={cn(
                    "flex w-full min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left",
                    canJump ? "cursor-pointer" : "cursor-default opacity-70",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                      state === "completed" &&
                        "border-green-600 bg-green-600 text-white",
                      state === "current" && "border-brand bg-brand text-white",
                      state === "incomplete" &&
                        "border-amber-500 bg-amber-50 text-amber-800",
                      state === "pending" &&
                        "border-border bg-white text-muted",
                    )}
                    aria-hidden
                  >
                    {state === "completed" ? (
                      <Check className="size-5" strokeWidth={3} />
                    ) : (
                      item.id
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-bold sm:text-base",
                        state === "current" && "text-brand",
                        state === "completed" && "text-green-700",
                        state === "incomplete" && "text-amber-800",
                        state === "pending" && "text-muted",
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "block text-xs font-semibold uppercase tracking-wide",
                        state === "completed" && "text-green-600",
                        state === "current" && "text-accent",
                        state === "incomplete" && "text-amber-600",
                        state === "pending" && "text-muted",
                      )}
                    >
                      {state === "completed"
                        ? "Completed"
                        : state === "current"
                          ? "In progress"
                          : state === "incomplete"
                            ? "Incomplete"
                            : "Not started"}
                    </span>
                  </span>
                </button>
                {index < STEPS.length - 1 ? (
                  <ChevronRight
                    className={cn(
                      "mx-1 size-6 shrink-0 sm:mx-2",
                      state === "completed"
                        ? "text-green-600"
                        : state === "incomplete"
                          ? "text-amber-500"
                          : "text-border",
                    )}
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        accountId ? (
          <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-brand">Portal account</h2>
            <p className="text-sm text-muted">
              Account already created. Continue with school details.
            </p>
            <div className="rounded-xl border border-border bg-brand-soft/40 p-4 text-[1.05rem] leading-snug">
              <p className="text-muted">
                School Name:{" "}
                <span className="font-semibold text-brand">
                  {displaySchoolName}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Email:{" "}
                <span className="font-semibold text-brand">{displayEmail}</span>
              </p>
              <p className="mt-1 text-muted">
                School Code:{" "}
                <span className="font-mono text-[1.05rem] font-bold tracking-wider text-brand">
                  {displaySchoolCode}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="accent"
                onClick={() => goToStep(2)}
                disabled={Boolean(error)}
              >
                Continue to school details
              </Button>
            </div>
          </div>
        ) : (
          <>
            <form
              onSubmit={accountForm.handleSubmit(onCreateAccount)}
              className="space-y-4 rounded-2xl border border-border bg-white p-5"
              noValidate
            >
              <h2 className="text-lg font-bold text-brand">Portal account</h2>
              <p className="text-sm text-muted">
                Create login credentials the school can use later.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="School name *"
                  error={accountForm.formState.errors.name?.message}
                >
                  <Input
                    {...accountForm.register("name", {
                      onChange: titleCaseField("name"),
                    })}
                  />
                </Field>
                <Field
                  label="Email *"
                  error={accountForm.formState.errors.email?.message}
                >
                  <Input type="email" {...accountForm.register("email")} />
                </Field>
                <Field
                  label="Mobile number *"
                  error={accountForm.formState.errors.mobile?.message}
                >
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    {...accountForm.register("mobile")}
                  />
                </Field>
                <Field
                  label="Password *"
                  error={accountForm.formState.errors.password?.message}
                >
                  <Input type="text" {...accountForm.register("password")} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="accent" disabled={saving}>
                  {saving ? "Creating…" : "Create account & continue"}
                </Button>
              </div>
            </form>
          </>
        )
      ) : null}

      {step === 2 ? (
        <form
          onSubmit={schoolForm.handleSubmit(onSaveSchool)}
          className="space-y-5 rounded-2xl border border-border bg-white p-5"
          noValidate
        >
          <h2 className="text-lg font-bold text-brand">School details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="School name *"
              error={schoolForm.formState.errors.schoolName?.message}
            >
              <Input
                {...schoolForm.register("schoolName", {
                  onChange: titleCaseField("schoolName"),
                })}
              />
            </Field>
            <Field
              label="Trust / Society *"
              error={schoolForm.formState.errors.trustName?.message}
            >
              <Input
                {...schoolForm.register("trustName", {
                  onChange: titleCaseField("trustName"),
                })}
              />
            </Field>
            <Field
              label="Address *"
              error={schoolForm.formState.errors.address?.message}
              className="sm:col-span-2"
            >
              <Input {...schoolForm.register("address")} />
            </Field>
            <Field label="City *" error={schoolForm.formState.errors.city?.message}>
              <Input
                {...schoolForm.register("city", {
                  onChange: titleCaseField("city"),
                })}
              />
            </Field>
            <Field
              label="District *"
              error={schoolForm.formState.errors.district?.message}
            >
              <Input
                {...schoolForm.register("district", {
                  onChange: titleCaseField("district"),
                })}
              />
            </Field>
            <Field
              label="State *"
              error={schoolForm.formState.errors.state?.message}
            >
              <Input
                {...schoolForm.register("state", {
                  onChange: titleCaseField("state"),
                })}
              />
            </Field>
            <Field
              label="Pin code *"
              error={schoolForm.formState.errors.pincode?.message}
            >
              <Input {...schoolForm.register("pincode")} />
            </Field>
            <Field label="Country *">
              <select
                className="h-9 w-full rounded-md border border-border px-3 text-sm"
                {...schoolForm.register("country")}
              >
                <option value="India">India</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            {schoolForm.watch("country") === "Other" ? (
              <Field
                label="Country name *"
                error={schoolForm.formState.errors.countryOther?.message}
              >
                <Input
                  {...schoolForm.register("countryOther", {
                    onChange: titleCaseField("countryOther"),
                  })}
                />
              </Field>
            ) : null}
            <Field label="Website">
              <Input {...schoolForm.register("website")} />
            </Field>
            <Field label="Affiliation *">
              <select
                className="h-9 w-full rounded-md border border-border px-3 text-sm"
                {...schoolForm.register("affiliation")}
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="STATE_BOARD">State Board</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            {schoolForm.watch("affiliation") === "OTHER" ? (
              <Field
                label="Affiliation other *"
                error={schoolForm.formState.errors.affiliationOther?.message}
              >
                <Input
                  {...schoolForm.register("affiliationOther", {
                    onChange: titleCaseField("affiliationOther"),
                  })}
                />
              </Field>
            ) : null}
            <Field
              label="School mobile *"
              error={schoolForm.formState.errors.schoolMobile?.message}
            >
              <Input {...schoolForm.register("schoolMobile")} />
            </Field>
            <Field label="STD code">
              <Input {...schoolForm.register("stdCode")} />
            </Field>
            <Field label="Landline">
              <Input {...schoolForm.register("landline")} />
            </Field>
            <Field
              label="School email *"
              error={schoolForm.formState.errors.email?.message}
            >
              <Input type="email" {...schoolForm.register("email")} />
            </Field>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="text-base font-bold text-brand">Principal</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Name *"
                error={schoolForm.formState.errors.principalName?.message}
              >
                <Input
                  {...schoolForm.register("principalName", {
                    onChange: titleCaseField("principalName"),
                  })}
                />
              </Field>
              <Field
                label="Mobile no. *"
                error={schoolForm.formState.errors.principalMobile?.message}
              >
                <Input {...schoolForm.register("principalMobile")} />
              </Field>
              <Field
                label="E-mail *"
                error={schoolForm.formState.errors.principalEmail?.message}
              >
                <Input
                  type="email"
                  {...schoolForm.register("principalEmail")}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="text-base font-bold text-brand">
              School Olympiad Incharge
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Name *"
                error={schoolForm.formState.errors.contactName?.message}
              >
                <Input
                  {...schoolForm.register("contactName", {
                    onChange: titleCaseField("contactName"),
                  })}
                />
              </Field>
              <Field
                label="Mobile no. *"
                error={schoolForm.formState.errors.phone?.message}
              >
                <Input {...schoolForm.register("phone")} />
              </Field>
              <Field
                label="E-mail *"
                error={schoolForm.formState.errors.inchargeEmail?.message}
              >
                <Input
                  type="email"
                  {...schoolForm.register("inchargeEmail")}
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue to students"}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand">Student details</h2>
            </div>
            <GradeSwitchButtons
              activeGrade={activeGrade}
              onChange={switchGrade}
              counts={gradeCounts}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="bg-brand-stats text-white">
                <tr>
                  <th className="px-2 py-3 text-center font-semibold">Sr.</th>
                  <th className="px-2 py-3 text-center font-semibold">
                    Reg. No.
                  </th>
                  <th className="min-w-[16rem] px-3 py-3 text-left font-semibold sm:min-w-[20rem]">
                    Name of the student
                  </th>
                  <th className="px-2 py-3 text-center font-semibold">Grade</th>
                  <th className="w-14 px-1 py-3 text-center font-semibold">
                    Sec
                  </th>
                  <th className="px-2 py-3 text-center font-semibold">
                    WhatsApp / Mobile
                  </th>
                  <th className="px-2 py-3 text-center font-semibold">
                    English
                  </th>
                  <th className="px-2 py-3 text-center font-semibold">
                    Science
                  </th>
                  <th className="px-2 py-3 text-center font-semibold">Maths</th>
                  <th className="px-2 py-3 text-center font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {gradeIndices.map((absoluteIndex, displayIndex) => {
                  const student = students[absoluteIndex];
                  if (!student) return null;
                  const rowError = studentRowErrors[absoluteIndex];
                  const showOlympiadError =
                    rowError === "Select at least one olympiad";
                  return (
                    <tr
                      key={student.id || student.clientKey || `row-${absoluteIndex}`}
                      className={cn(
                        "border-t bg-white",
                        rowError
                          ? "border-red-300 bg-red-50/40"
                          : "border-border",
                      )}
                    >
                      <td className="px-2 py-2 text-center align-middle text-muted">
                        {String(displayIndex + 1).padStart(2, "0")}
                      </td>
                      <td className="px-2 py-2 text-center align-middle">
                        <span className="font-mono text-xs font-bold tracking-wide text-brand">
                          {student.registrationNumber || "—"}
                        </span>
                      </td>
                      <td className="min-w-[16rem] px-3 py-2 align-middle sm:min-w-[20rem]">
                        <Input
                          value={student.name}
                          placeholder="IN BLOCK LETTERS"
                          aria-invalid={Boolean(rowError)}
                          className="h-9 w-full uppercase"
                          onChange={(e) => {
                            const next = e.target.value.toUpperCase();
                            setStudentRowErrors((prev) => {
                              if (!prev[absoluteIndex]) return prev;
                              const copy = { ...prev };
                              delete copy[absoluteIndex];
                              return copy;
                            });
                            setStudents((prev) =>
                              ensureStudentsForGrade(
                                prev.map((row, i) =>
                                  i === absoluteIndex
                                    ? { ...row, name: next, grade: activeGrade }
                                    : row,
                                ),
                                activeGrade,
                                emptyStudent,
                                INITIAL_STUDENT_ROWS,
                              ),
                            );
                          }}
                        />
                        {rowError ? (
                          <p className="mt-1 text-[11px] font-medium text-red-600">
                            {rowError}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 text-center align-middle">
                        <span className="inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-md border border-border bg-slate-50 px-2 text-sm font-semibold text-brand">
                          {activeGrade}
                        </span>
                      </td>
                      <td className="w-14 px-1 py-2 align-middle">
                        <Input
                          value={student.section}
                          placeholder=""
                          maxLength={3}
                          className="h-9 w-12 px-1 text-center uppercase"
                          onChange={(e) =>
                            setStudents((prev) =>
                              prev.map((row, i) =>
                                i === absoluteIndex
                                  ? {
                                      ...row,
                                      section: e.target.value.toUpperCase(),
                                      grade: activeGrade,
                                    }
                                  : row,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <Input
                          value={student.mobile}
                          placeholder="WhatsApp / Mobile"
                          className="h-9 w-full"
                          onChange={(e) =>
                            setStudents((prev) =>
                              prev.map((row, i) =>
                                i === absoluteIndex
                                  ? {
                                      ...row,
                                      mobile: e.target.value,
                                      grade: activeGrade,
                                    }
                                  : row,
                              ),
                            )
                          }
                        />
                      </td>
                      {(
                        [
                          ["ieo", "English"],
                          ["iso", "Science"],
                          ["imo", "Maths"],
                        ] as const
                      ).map(([key]) => (
                        <td
                          key={key}
                          className={cn(
                            "px-2 py-2 text-center align-middle",
                            showOlympiadError && "bg-red-100/80",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={student[key]}
                            aria-invalid={showOlympiadError}
                            title={
                              showOlympiadError
                                ? "Select at least one olympiad"
                                : undefined
                            }
                            className={cn(
                              "size-4 accent-brand",
                              showOlympiadError &&
                                "rounded outline outline-2 outline-offset-2 outline-red-500",
                            )}
                            onChange={(e) =>
                              setStudents((prev) =>
                                prev.map((row, i) =>
                                  i === absoluteIndex
                                    ? {
                                        ...row,
                                        [key]: e.target.checked,
                                        grade: activeGrade,
                                      }
                                    : row,
                                ),
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center align-middle">
                        <button
                          type="button"
                          className="inline-flex text-red-600 hover:underline disabled:opacity-40"
                          aria-label="Remove student"
                          onClick={() =>
                            setStudents((prev) =>
                              ensureStudentsForGrade(
                                prev.filter((_, i) => i !== absoluteIndex),
                                activeGrade,
                                emptyStudent,
                                INITIAL_STUDENT_ROWS,
                              ),
                            )
                          }
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setStudents((prev) =>
                  ensureStudentsForGrade(
                    [...prev, emptyStudent(activeGrade)],
                    activeGrade,
                    emptyStudent,
                    INITIAL_STUDENT_ROWS,
                  ),
                )
              }
            >
              <Plus className="size-4" aria-hidden />
              Add row
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setStudents((prev) =>
                  ensureStudentsForGrade(
                    [...prev, ...createEmptyStudents(10, activeGrade)],
                    activeGrade,
                    emptyStudent,
                    INITIAL_STUDENT_ROWS,
                  ),
                )
              }
            >
              Add 10 rows
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setStudents((prev) =>
                  ensureStudentsForGrade(
                    [...prev, ...createEmptyStudents(30, activeGrade)],
                    activeGrade,
                    emptyStudent,
                    INITIAL_STUDENT_ROWS,
                  ),
                )
              }
            >
              Add 30 rows
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setStudents((prev) =>
                  ensureStudentsForGrade(
                    [...prev, ...createEmptyStudents(50, activeGrade)],
                    activeGrade,
                    emptyStudent,
                    INITIAL_STUDENT_ROWS,
                  ),
                )
              }
            >
              Add 50 rows
            </Button>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="accent"
              disabled={saving}
              onClick={() => void onSaveStudents()}
            >
              {saving ? "Saving…" : "Save & continue to payment"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-bold text-brand">Payment</h2>
          <PaymentFeeSummary
            students={students.filter((s) => s.name.trim())}
          />
          <Field label="Payment method *">
            <select
              value={paymentMethod}
              className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod | "")
              }
            >
              <option value="" disabled>
                Select payment method
              </option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              paymentMethod
                ? approveNow
                  ? `${paymentReferenceField(paymentMethod).label.replace(" *", "")} (optional)`
                  : paymentReferenceField(paymentMethod).label
                : approveNow
                  ? "Payment reference number (optional)"
                  : "Payment reference number *"
            }
          >
            <Input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder={
                paymentMethod
                  ? paymentReferenceField(paymentMethod).placeholder
                  : "Select payment method first"
              }
            />
          </Field>
          <Field label="Admin note (optional)">
            <Input
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Cash collected at office"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm font-semibold text-brand">
            <input
              type="checkbox"
              className="mt-1"
              checked={approveNow}
              onChange={(e) => setApproveNow(e.target.checked)}
            />
            <span>
              Approve immediately
              <span className="mt-0.5 block font-normal text-muted">
                Check to approve now, or leave unchecked for payment verification.
              </span>
            </span>
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="accent"
              disabled={saving}
              onClick={() => void onSubmitPayment()}
            >
              {saving
                ? "Submitting…"
                : approveNow
                  ? "Register & approve"
                  : "Submit for verification"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminRegisterSchoolPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-white px-4 py-10 text-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <AdminRegisterSchoolPageInner />
    </Suspense>
  );
}
