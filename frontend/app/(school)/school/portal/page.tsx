"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, CheckCircle2, ChevronRight, Clock, Plus, QrCode, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_DETAILS, PAYMENT_METHODS, paymentReferenceField, type PaymentMethod } from "@/lib/payment-details";
import { PaymentFeeSummary } from "@/components/school/payment-fee-summary";
import { SchoolApprovedStudents } from "@/components/school/school-approved-students";
import { SchoolResultsPanel } from "@/components/school/school-results-panel";
import {
  ensureStudentsForGrade,
  gradeStudentIndices,
  GradeSwitchButtons,
  isStudentGrade,
  namedCountByGrade,
  type StudentGrade,
} from "@/components/school/grade-switch-buttons";
import { GradeTableFrame } from "@/components/school/grade-table-frame";
import {
  fetchMyRegistration,
  importStudentsExcel,
  saveSchoolStep1,
  saveSchoolStep2,
  saveSchoolStep3,
  checkPaymentReference,
  studentTemplateUrl,
  uploadPaymentProofFile,
  MAX_STUDENTS_PER_REGISTRATION,
  type RegistrationStudent,
  type SchoolRegistration,
} from "@/lib/school-api";
import { cn } from "@/lib/utils";
import { toTitleCaseInput } from "@/lib/title-case";
import { LIVE_DATA_REFETCH_MS } from "@/lib/live-refresh";
import { MOBILE_DIGITS_REGEX, MOBILE_ERROR, sanitizeMobileDigits } from "@/lib/mobile";

const INITIAL_STUDENT_ROWS = 30;

const schoolSchema = z
  .object({
    schoolCode: z.string().trim().max(40).optional(),
    schoolName: z.string().trim().min(2, "School name is required"),
    address: z.string().trim().min(5, "School address is required"),
    city: z.string().trim().min(2, "City is required"),
    district: z.string().trim().min(2, "District is required"),
    state: z.string().trim().min(2, "State is required"),
    pincode: z.string().trim().min(4, "Pin code is required").max(12),
    country: z.enum(["India", "Other"]),
    countryOther: z.string().trim().max(80),
    website: z.string().trim().max(200),
    affiliation: z
      .string()
      .refine(
        (v) =>
          v === "CBSE" ||
          v === "ICSE" ||
          v === "STATE_BOARD" ||
          v === "OTHER",
        { message: "Select affiliation" },
      ),
    affiliationOther: z.string().trim().max(80),
    trustName: z.string().trim().min(2, "Trust / Society name is required"),
    schoolMobile: z.string().trim().regex(MOBILE_DIGITS_REGEX, MOBILE_ERROR),
    landline: z.string().trim().max(20),
    stdCode: z.string().trim().max(10),
    email: z.string().trim().email("Enter a valid school email"),
    principalName: z.string().trim().min(2, "Principal name is required"),
    principalMobile: z.string().trim().regex(MOBILE_DIGITS_REGEX, MOBILE_ERROR),
    principalEmail: z.string().trim().email("Enter a valid principal email"),
    contactName: z.string().trim().min(2, "Incharge name is required"),
    phone: z.string().trim().regex(MOBILE_DIGITS_REGEX, MOBILE_ERROR),
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

type SchoolFormValues = z.input<typeof schoolSchema>;
type SchoolFormOutput = z.output<typeof schoolSchema>;

const STEPS = [
  { id: 1, label: "School details" },
  { id: 2, label: "Student details" },
  { id: 3, label: "Payment" },
] as const;

function fieldBorder(invalid?: boolean) {
  return invalid
    ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/25"
    : undefined;
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

type StudentDraft = RegistrationStudent & { clientKey?: string };

let studentKeySeq = 0;
function nextStudentKey() {
  studentKeySeq += 1;
  return `s-${studentKeySeq}`;
}

function emptyStudent(grade = 0): StudentDraft {
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

function createEmptyStudents(
  count: number,
  grade = 0,
): StudentDraft[] {
  return Array.from({ length: count }, () => emptyStudent(grade));
}

function withTrailingEmptyRow(
  rows: StudentDraft[],
  defaultGrade = 0,
): StudentDraft[] {
  if (rows.length === 0) return createEmptyStudents(INITIAL_STUDENT_ROWS, defaultGrade);
  const last = rows[rows.length - 1];
  if (last.name.trim()) return [...rows, emptyStudent(defaultGrade)];
  return rows;
}

function normalizeStudent(s: RegistrationStudent): StudentDraft {
  return {
    id: s.id,
    clientKey: s.id ? undefined : nextStudentKey(),
    registrationNumber: s.registrationNumber,
    name: s.name || "",
    grade: s.grade,
    section: s.section || "",
    mobile: s.mobile || "",
    imo: Boolean(s.imo),
    iso: Boolean(s.iso),
    ieo: Boolean(s.ieo),
  };
}

function mergeStudentCodes(
  local: StudentDraft[],
  saved: RegistrationStudent[],
): StudentDraft[] {
  const queue = saved.map((s) => ({
    id: s.id,
    registrationNumber: s.registrationNumber,
    name: (s.name || "").trim().toUpperCase(),
    grade: s.grade,
    section: (s.section || "").trim().toUpperCase(),
  }));
  return local.map((row) => {
    let idx = -1;
    if (row.id) {
      idx = queue.findIndex((s) => s.id === row.id);
    }
    if (idx < 0 && row.name.trim()) {
      const name = row.name.trim().toUpperCase();
      const section = (row.section || "").trim().toUpperCase();
      idx = queue.findIndex(
        (s) =>
          s.name === name &&
          s.grade === row.grade &&
          (s.section || "") === section,
      );
    }
    if (idx < 0) return row;
    const [matched] = queue.splice(idx, 1);
    if (
      row.id === matched.id &&
      row.registrationNumber === matched.registrationNumber
    ) {
      return row;
    }
    return {
      ...row,
      id: matched.id,
      registrationNumber: matched.registrationNumber,
    };
  });
}

function isSchoolDetailsComplete(
  data: Pick<
    SchoolRegistration,
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
    | "affiliation"
    | "country"
  > | null | undefined,
) {
  if (!data) return false;
  return Boolean(
    data.schoolName?.trim() &&
      data.address?.trim() &&
      data.city?.trim() &&
      data.district?.trim() &&
      data.state?.trim() &&
      data.pincode?.trim() &&
      data.trustName?.trim() &&
      data.schoolMobile?.trim() &&
      data.email?.trim() &&
      data.principalName?.trim() &&
      data.principalMobile?.trim() &&
      data.principalEmail?.trim() &&
      data.contactName?.trim() &&
      data.phone?.trim() &&
      data.inchargeEmail?.trim() &&
      data.affiliation?.trim() &&
      data.country?.trim(),
  );
}

/** Progress unlocked by saved registration data — never by visiting a step. */
function resolveSavedThrough(data: SchoolRegistration | null | undefined) {
  if (!data) return 0;
  if (
    data.status === "UNDER_REVIEW" ||
    data.status === "APPROVED" ||
    data.status === "REJECTED"
  ) {
    return 3;
  }
  if (!isSchoolDetailsComplete(data)) return 1;
  if (!studentsReadyForSubmit(data.students || []).ok) return 2;
  return Math.min(3, Math.max(2, data.currentStep || 2));
}

function studentsReadyForSubmit(
  rows: Array<{
    name: string;
    grade: number;
    imo: boolean;
    iso: boolean;
    ieo: boolean;
  }>,
) {
  const named = rows.filter((s) => s.name.trim());
  if (named.length === 0) {
    return { ok: false as const, reason: "empty" as const };
  }
  const incomplete = named.some(
    (s) => !isStudentGrade(s.grade) || (!s.imo && !s.iso && !s.ieo),
  );
  if (incomplete) {
    return { ok: false as const, reason: "olympiad" as const };
  }
  return { ok: true as const };
}

function portalStepStorageKey(registrationId: string) {
  return `icape:school-portal-step:${registrationId}`;
}

function readStoredPortalStep(registrationId: string): number | null {
  try {
    const raw = sessionStorage.getItem(portalStepStorageKey(registrationId));
    const n = Number(raw);
    if (n === 1 || n === 2 || n === 3) return n;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredPortalStep(registrationId: string, step: number) {
  try {
    sessionStorage.setItem(portalStepStorageKey(registrationId), String(step));
  } catch {
    /* ignore */
  }
}

function resolvePortalStep(data: SchoolRegistration): number {
  if (
    data.status === "UNDER_REVIEW" ||
    data.status === "APPROVED" ||
    data.status === "REJECTED"
  ) {
    return 3;
  }
  const schoolOk = isSchoolDetailsComplete(data);
  if (!schoolOk) return 1;

  const studentsOk = studentsReadyForSubmit(data.students || []).ok;
  const maxAllowed = Math.min(3, Math.max(1, data.currentStep || 1));
  const stored = readStoredPortalStep(data.id);
  // Never open Payment without at least one student + olympiad
  if (stored === 3 && !studentsOk) {
    return Math.min(2, maxAllowed);
  }
  // Honor the step the user was actually on (Students / Payment / School).
  if (stored && stored >= 1 && stored <= maxAllowed) {
    if (stored >= 2 && !schoolOk) return 1;
    if (stored === 3 && !studentsOk) return 2;
    return stored;
  }
  // DRAFT + unpaid: never auto-land on Payment after refresh — stay on Students.
  if (data.status === "DRAFT" && maxAllowed >= 2 && !data.payment?.utr) {
    return 2;
  }
  if (maxAllowed >= 3 && !studentsOk) return 2;
  return maxAllowed;
}

function SchoolPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "registration";
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState<SchoolRegistration | null>(null);
  const [step, setStep] = useState(1);
  const [resubmitAfterReject, setResubmitAfterReject] = useState(false);
  const [students, setStudents] = useState<StudentDraft[]>([]);
  const [activeGrade, setActiveGrade] = useState<StudentGrade>(3);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [utr, setUtr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofPublicId, setProofPublicId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const submitSuccessTimerRef = useRef<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [importStatus, setImportStatus] = useState<
    "idle" | "importing" | "done" | "error"
  >("idle");
  const [importFileName, setImportFileName] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const importFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [studentRowErrors, setStudentRowErrors] = useState<
    Record<number, string>
  >({});
  const [paymentErrors, setPaymentErrors] = useState<{
    paymentMethod?: string;
    utr?: string;
    proof?: string;
  }>({});
  const skipNextDraftRef = useRef(true);
  const lastDraftPayloadRef = useRef("");
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regRef = useRef<SchoolRegistration | null>(null);
  const savingRef = useRef(false);
  const uploadingRef = useRef(false);
  const stepReadyRef = useRef(false);
  regRef.current = reg;
  savingRef.current = saving;
  uploadingRef.current = uploading;

  useEffect(() => {
    if (!reg?.id || !stepReadyRef.current) return;
    writeStoredPortalStep(reg.id, step);
  }, [reg?.id, step]);

  function goToStep(
    next: number,
    opts?: { regOverride?: SchoolRegistration | null },
  ) {
    const current = opts?.regOverride ?? reg;
    const terminal =
      current?.status === "UNDER_REVIEW" || current?.status === "APPROVED";
    if (next >= 2 && !terminal && !isSchoolDetailsComplete(current)) {
      setError("Fill and save all required school details before students.");
      stepReadyRef.current = true;
      setStep(1);
      if (current?.id) writeStoredPortalStep(current.id, 1);
      if (tab !== "registration") {
        router.replace(`/school/portal?tab=registration`, { scroll: false });
      }
      return;
    }
    if (next === 3) {
      const studentsOk = studentsReadyForSubmit(students).ok;
      if (!terminal && !studentsOk) {
        setError(
          "Add at least one student with at least one olympiad before payment.",
        );
        stepReadyRef.current = true;
        setStep(2);
        if (current?.id) writeStoredPortalStep(current.id, 2);
        if (tab !== "registration") {
          router.replace(`/school/portal?tab=registration`, { scroll: false });
        }
        return;
      }
    }
    setError("");
    stepReadyRef.current = true;
    setStep(next);
    if (current?.id) writeStoredPortalStep(current.id, next);
    if (tab !== "registration") {
      router.replace(`/school/portal?tab=registration`, { scroll: false });
    }
  }

  // Legacy sidebar tabs → single Registration flow
  useEffect(() => {
    if (tab === "school" || tab === "students" || tab === "payment") {
      const nextStep = tab === "school" ? 1 : tab === "students" ? 2 : 3;
      goToStep(nextStep);
      router.replace("/school/portal?tab=registration", { scroll: false });
    }
    if (tab === "help" || tab === "dashboard") {
      router.replace("/school/portal?tab=registration", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, router]);

  // If somehow on Students/Payment without school details, send back
  useEffect(() => {
    if (loading) return;
    if (step < 2) return;
    if (reg?.status === "UNDER_REVIEW" || reg?.status === "APPROVED") return;
    if (reg?.locked) return;
    if (!isSchoolDetailsComplete(reg)) {
      setError("Fill and save all required school details before students.");
      setStep(1);
      if (reg?.id) writeStoredPortalStep(reg.id, 1);
    }
  }, [loading, step, reg, reg?.locked, reg?.id, reg?.status]);

  // If somehow on Payment without valid students, send back to Students
  useEffect(() => {
    if (loading) return;
    if (step !== 3) return;
    if (reg?.status === "UNDER_REVIEW" || reg?.status === "APPROVED") return;
    if (reg?.locked) return;
    if (!studentsReadyForSubmit(students).ok) {
      setError(
        "Add at least one student with at least one olympiad before payment.",
      );
      setStep(2);
      if (reg?.id) writeStoredPortalStep(reg.id, 2);
    }
  }, [loading, step, students, reg?.status, reg?.id, reg?.locked]);

  const schoolForm = useForm<SchoolFormValues, unknown, SchoolFormOutput>({
    resolver: zodResolver(schoolSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      schoolCode: "",
      schoolName: "",
      address: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      country: "India",
      countryOther: "",
      website: "",
      affiliation: "",
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

  const watchedCountry = schoolForm.watch("country");
  const watchedAffiliation = schoolForm.watch("affiliation");

  useEffect(() => {
    return () => {
      if (submitSuccessTimerRef.current) {
        window.clearTimeout(submitSuccessTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const regRes = await fetchMyRegistration();
      if (cancelled) return;
      if (!regRes.success) {
        // Only leave the portal on a real auth failure — not network blips
        if (regRes.status === 401 && !regRes.networkError) {
          router.replace("/school/login");
          return;
        }
        setError(
          regRes.networkError
            ? "Cannot reach server. Check your connection and refresh."
            : regRes.message || "Failed to load registration",
        );
        setLoading(false);
        return;
      }
      if (!regRes.data) {
        setError("Failed to load registration");
        setLoading(false);
        return;
      }
      applyRegistration(regRes.data, { syncStep: true });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Keep status in sync with admin (approve / reject) without a manual refresh
  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      if (savingRef.current || uploadingRef.current) return;
      const regRes = await fetchMyRegistration();
      if (cancelled) return;
      if (!regRes.success || !regRes.data) {
        if (!regRes.success && regRes.status === 401 && !regRes.networkError) {
          router.replace("/school/login");
        }
        return;
      }
      const next = regRes.data;
      const prev = regRef.current;
      if (!prev) {
        applyRegistration(next, { syncStep: false });
        return;
      }
      const statusChanged = prev.status !== next.status;
      const rejectionChanged = prev.rejectionNote !== next.rejectionNote;
      const paymentChanged =
        Boolean(prev.payment?.id) !== Boolean(next.payment?.id) ||
        prev.payment?.status !== next.payment?.status ||
        prev.payment?.utr !== next.payment?.utr;
      if (statusChanged || rejectionChanged || paymentChanged) {
        const terminalStatus =
          next.status === "UNDER_REVIEW" ||
          next.status === "APPROVED" ||
          next.status === "REJECTED";
        // Never bounce Students → Payment on background refresh.
        applyRegistration(next, {
          syncStep: statusChanged && terminalStatus,
        });
      }
    }, LIVE_DATA_REFETCH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loading, router]);

  function applyRegistration(
    data: SchoolRegistration,
    options?: { syncStep?: boolean },
  ) {
    skipNextDraftRef.current = true;
    setReg(data);
    if (data.status !== "REJECTED") {
      setResubmitAfterReject(false);
    }
    schoolForm.reset({
      schoolCode: data.schoolCode || "",
      schoolName: data.schoolName || "",
      address: data.address || "",
      city: data.city || "",
      district: data.district || "",
      state: data.state || "",
      pincode: data.pincode || "",
      country: data.country === "Other" ? "Other" : "India",
      countryOther: data.countryOther || "",
      website: data.website || "",
      affiliation:
        data.affiliation === "CBSE" ||
        data.affiliation === "ICSE" ||
        data.affiliation === "STATE_BOARD" ||
        data.affiliation === "OTHER"
          ? data.affiliation
          : "",
      affiliationOther: data.affiliationOther || "",
      trustName: data.trustName || "",
      schoolMobile: data.schoolMobile || "",
      landline: data.landline || "",
      stdCode: data.stdCode || "",
      email: data.email || "",
      principalName: data.principalName || "",
      principalMobile: data.principalMobile || "",
      principalEmail: data.principalEmail || "",
      contactName: data.contactName || "",
      phone: data.phone || "",
      inchargeEmail: data.inchargeEmail || "",
    });

    const named = (data.students || [])
      .map(normalizeStudent)
      .filter((s) => s.name.trim());
    setStudents(
      named.length > 0
        ? ensureStudentsForGrade(named, activeGrade, emptyStudent, INITIAL_STUDENT_ROWS)
        : [],
    );

    const submittedPayment =
      data.status === "UNDER_REVIEW" || data.status === "APPROVED";
    const clearPayment =
      !submittedPayment ||
      data.status === "REJECTED" ||
      Boolean(data.rejectionNote) ||
      !data.payment ||
      data.payment.status === "REJECTED";

    if (clearPayment) {
      // Draft / rejected: never prefills old UTR — school must enter fresh
      setUtr("");
      setPaymentMethod("");
      setProofUrl("");
      setProofPublicId("");
      setPaymentErrors({});
    } else {
      setUtr(data.payment?.utr || "");
      setPaymentMethod(data.payment?.paymentMethod || "");
      setProofUrl(data.payment?.proofUrl || "");
    }

    if (!options?.syncStep) return;

    const nextStep = resolvePortalStep(data);
    stepReadyRef.current = true;
    setStep(nextStep);
    writeStoredPortalStep(data.id, nextStep);
  }

  const feeExpected = useMemo(() => {
    return students
      .filter((s) => s.name.trim())
      .reduce((sum, s) => {
        return (
          sum +
          ((s.imo ? 1 : 0) + (s.iso ? 1 : 0) + (s.ieo ? 1 : 0)) *
            PAYMENT_DETAILS.feeAmount
        );
      }, 0);
  }, [students]);

  const locked = Boolean(reg?.locked);
  const paymentReference = useMemo(
    () =>
      paymentMethod
        ? paymentReferenceField(paymentMethod)
        : {
            label: "Payment reference number *",
            placeholder: "Select payment method first",
            requiredError: "Payment reference number is required",
          },
    [paymentMethod],
  );

  // Seed rows when entering Students step (grade switches update synchronously below).
  useEffect(() => {
    if (step !== 2 || locked) return;
    setStudents((prev) =>
      ensureStudentsForGrade(
        prev,
        activeGrade,
        emptyStudent,
        INITIAL_STUDENT_ROWS,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering the step
  }, [step, locked]);

  const gradeIndices = useMemo(
    () => gradeStudentIndices(students, activeGrade),
    [students, activeGrade],
  );
  const gradeCounts = useMemo(() => namedCountByGrade(students), [students]);

  const draftStudents = useMemo(() => {
    return students
      .filter((s) => s.name.trim().length >= 2 && s.grade >= 3 && s.grade <= 10)
      .map((s) => ({
        id: s.id,
        registrationNumber: s.registrationNumber,
        name: s.name.trim().toUpperCase(),
        grade: s.grade,
        section: (s.section || "").trim().toUpperCase(),
        mobile: sanitizeMobileDigits(s.mobile),
        imo: Boolean(s.imo),
        iso: Boolean(s.iso),
        ieo: Boolean(s.ieo),
      }));
  }, [students]);

  async function persistDraftStudents(
    rows: StudentDraft[],
    options?: { immediate?: boolean },
  ) {
    if (locked) return;
    const payloadStudents = rows
      .filter((s) => s.name.trim().length >= 2 && s.grade >= 3 && s.grade <= 10)
      .map((s) => ({
        id: s.id,
        registrationNumber: s.registrationNumber,
        name: s.name.trim().toUpperCase(),
        grade: s.grade,
        section: (s.section || "").trim().toUpperCase(),
        mobile: sanitizeMobileDigits(s.mobile),
        imo: Boolean(s.imo),
        iso: Boolean(s.iso),
        ieo: Boolean(s.ieo),
      }));
    const payload = JSON.stringify(payloadStudents);
    if (payload === lastDraftPayloadRef.current) return;
    if (payloadStudents.length > MAX_STUDENTS_PER_REGISTRATION) {
      setDraftStatus("error");
      return;
    }

    const run = async () => {
      setDraftStatus("saving");
      const res = await saveSchoolStep2(payloadStudents, { draft: true });
      if (!res.success) {
        setDraftStatus("error");
        return;
      }
      lastDraftPayloadRef.current = payload;
      setDraftStatus("saved");
      const saved = res.data;
      if (!saved) return;
      setReg((prev) =>
        prev
          ? {
              ...prev,
              currentStep: saved.currentStep,
              feeExpected: saved.feeExpected,
              schoolCode: saved.schoolCode,
            }
          : saved,
      );
      // Keep local rows/focus stable — only patch ids / reg numbers from server.
      skipNextDraftRef.current = true;
      setStudents((prev) => {
        const merged = mergeStudentCodes(prev, saved.students);
        return ensureStudentsForGrade(
          merged,
          activeGrade,
          emptyStudent,
          INITIAL_STUDENT_ROWS,
        );
      });
      lastDraftPayloadRef.current = JSON.stringify(
        saved.students.map((s) => ({
          id: s.id,
          registrationNumber: s.registrationNumber,
          name: (s.name || "").trim().toUpperCase(),
          grade: s.grade,
          section: (s.section || "").trim().toUpperCase(),
          mobile: sanitizeMobileDigits(s.mobile),
          imo: Boolean(s.imo),
          iso: Boolean(s.iso),
          ieo: Boolean(s.ieo),
        })),
      );
    };

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if (options?.immediate) {
      await run();
      return;
    }
    const debounceMs = payloadStudents.length > 400 ? 1200 : 700;
    draftTimerRef.current = setTimeout(() => {
      void run();
    }, debounceMs);
  }

  useEffect(() => {
    if (step !== 2 || locked) return;

    const payload = JSON.stringify(draftStudents);
    if (skipNextDraftRef.current) {
      skipNextDraftRef.current = false;
      lastDraftPayloadRef.current = payload;
      return;
    }
    if (payload === lastDraftPayloadRef.current) return;

    void persistDraftStudents(students);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStudents, step, locked]);

  function removeStudentAt(absoluteIndex: number) {
    const next = ensureStudentsForGrade(
      students.filter((_, i) => i !== absoluteIndex),
      activeGrade,
      emptyStudent,
      INITIAL_STUDENT_ROWS,
    );
    setStudents(next);
    setStudentRowErrors((prev) => {
      if (!prev[absoluteIndex] && Object.keys(prev).length === 0) return prev;
      const remapped: Record<number, string> = {};
      for (const [key, message] of Object.entries(prev)) {
        const idx = Number(key);
        if (idx === absoluteIndex) continue;
        remapped[idx > absoluteIndex ? idx - 1 : idx] = message;
      }
      return remapped;
    });
    void persistDraftStudents(next, { immediate: true });
  }

  async function onSaveStep1(values: SchoolFormOutput) {
    setError("");
    setSaving(true);
    const res = await saveSchoolStep1(values);
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    applyRegistration(res.data, { syncStep: false });
    goToStep(2, { regOverride: res.data });
  }

  async function onSaveStep2() {
    setError("");
    const rowErrors: Record<number, string> = {};
    const fieldByRow: Record<number, "name" | "grade" | "olympiad"> = {};
    const cleaned = students.filter((s) => s.name.trim());
    if (cleaned.length === 0) {
      const firstEmpty = students.findIndex((s) => !s.name.trim());
      const target = firstEmpty >= 0 ? firstEmpty : 0;
      rowErrors[target] = "Student name is required";
      fieldByRow[target] = "name";
      setStudentRowErrors(rowErrors);
      setError("Enter at least one student name");
      focusStudentError(target, "name");
      return;
    }
    if (cleaned.length > MAX_STUDENTS_PER_REGISTRATION) {
      setError("Too many students for one registration");
      return;
    }
    for (const [i, s] of students.entries()) {
      if (!s.name.trim()) continue;
      if (!isStudentGrade(s.grade)) {
        rowErrors[i] = "Select at least one olympiad";
        fieldByRow[i] = "olympiad";
      } else if (!s.imo && !s.iso && !s.ieo) {
        rowErrors[i] = "Select at least one olympiad";
        fieldByRow[i] = "olympiad";
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
      focusStudentError(firstIndex, fieldByRow[firstIndex] || "name");
      return;
    }
    setStudentRowErrors({});
    const cleanedPayload = cleaned.map((s) => ({
      id: s.id,
      registrationNumber: s.registrationNumber,
      name: s.name.trim().toUpperCase(),
      grade: s.grade,
      section: (s.section || "").trim().toUpperCase(),
      mobile: (s.mobile || "").trim(),
      imo: Boolean(s.imo),
      iso: Boolean(s.iso),
      ieo: Boolean(s.ieo),
    }));
    setSaving(true);
    const res = await saveSchoolStep2(cleanedPayload, { draft: false });
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    lastDraftPayloadRef.current = JSON.stringify(cleanedPayload);
    applyRegistration(res.data, { syncStep: false });
    goToStep(3);
  }

  function focusStudentError(
    index: number,
    field: "name" | "grade" | "olympiad",
  ) {
    window.setTimeout(() => {
      const el = document.querySelector(
        `[data-student-row="${index}"][data-student-field="${field}"]`,
      ) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }, 50);
  }

  async function onImportExcel(file: File | null) {
    if (importFeedbackTimerRef.current) {
      clearTimeout(importFeedbackTimerRef.current);
      importFeedbackTimerRef.current = null;
    }
    if (!file) {
      setImportStatus("idle");
      setImportFileName("");
      return;
    }
    setError("");
    setImportFileName(file.name);
    setImportStatus("importing");
    const res = await importStudentsExcel(file);
    if (importInputRef.current) importInputRef.current.value = "";
    if (!res.success || !res.data) {
      setImportStatus("error");
      setError(
        `File selected: ${file.name}. ${res.message || "Import failed."}`,
      );
      importFeedbackTimerRef.current = setTimeout(() => {
        setImportStatus("idle");
        setImportFileName("");
      }, 6000);
      return;
    }
    if (res.data.students.length > MAX_STUDENTS_PER_REGISTRATION) {
      setImportStatus("error");
      setError(
        `File selected: ${file.name}. Too many students to import at once.`,
      );
      importFeedbackTimerRef.current = setTimeout(() => {
        setImportStatus("idle");
        setImportFileName("");
      }, 6000);
      return;
    }
    const imported = res.data.students.map((s) =>
      normalizeStudent({
        ...s,
        name: (s.name || "").toUpperCase(),
        section: (s.section || "").toUpperCase(),
        mobile: sanitizeMobileDigits(s.mobile),
      }),
    );
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    skipNextDraftRef.current = true;
    const nextRows = ensureStudentsForGrade(
      withTrailingEmptyRow(imported, activeGrade),
      activeGrade,
      emptyStudent,
      INITIAL_STUDENT_ROWS,
    );
    setStudents(nextRows);

    const rowErrors: Record<number, string> = {};
    res.data.students.forEach((s, i) => {
      const warning = (s as { importWarning?: string }).importWarning;
      if (warning) {
        if (!String(s.name || "").trim() || !isStudentGrade(s.grade)) {
          rowErrors[i] = "Enter a valid name and grade (3–10)";
        } else if (!s.imo && !s.iso && !s.ieo) {
          rowErrors[i] = "Select at least one olympiad";
        } else {
          rowErrors[i] = "Fix this row and save";
        }
      }
    });
    setStudentRowErrors(rowErrors);
    setImportStatus("done");

    if (res.data.errors.length) {
      setError(
        `File imported: ${file.name}. Some rows need fixing — edit them in the table, then save. ${res.data.errors.slice(0, 3).join(" · ")}`,
      );
    } else {
      setError("");
    }

    // Save imported rows once (skip auto-effect race), with sanitized mobiles
    lastDraftPayloadRef.current = "";
    void persistDraftStudents(nextRows, { immediate: true });

    importFeedbackTimerRef.current = setTimeout(() => {
      setImportStatus("idle");
      setImportFileName("");
      setError((prev) =>
        prev.startsWith("File imported:") || prev.startsWith("File selected:")
          ? ""
          : prev,
      );
    }, 5000);
  }

  function updateStudentRow(
    index: number,
    patch: Partial<RegistrationStudent>,
  ) {
    setError("");
    setImportStatus("idle");
    setImportFileName("");
    setStudentRowErrors((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setStudents((prev) => {
      const next = prev.map((s, i) =>
        i === index
          ? {
              ...s,
              ...patch,
              grade: isStudentGrade(s.grade) ? s.grade : activeGrade,
            }
          : s,
      );
      const ofGrade = next.filter((s) => s.grade === activeGrade);
      const needsEnsure =
        ofGrade.length < INITIAL_STUDENT_ROWS ||
        Boolean(ofGrade[ofGrade.length - 1]?.name.trim());
      if (!needsEnsure) return next;
      return ensureStudentsForGrade(
        next,
        activeGrade,
        emptyStudent,
        INITIAL_STUDENT_ROWS,
      );
    });
  }

  function switchGrade(grade: StudentGrade) {
    if (grade === activeGrade) return;
    setStudentRowErrors({});
    // Pad the target grade in the same tick as the tab change (no empty-frame blink).
    setStudents((prev) =>
      locked
        ? prev
        : ensureStudentsForGrade(
            prev,
            grade,
            emptyStudent,
            INITIAL_STUDENT_ROWS,
          ),
    );
    setActiveGrade(grade);
  }

  async function onUploadProof(file: File | null) {
    if (!file) return;
    setError("");
    setPaymentErrors((prev) => ({ ...prev, proof: undefined }));
    setUploading(true);
    try {
      const res = await uploadPaymentProofFile(file);
      if (!res.success || !res.data) {
        setError(res.message || "Could not upload payment proof");
        setPaymentErrors((prev) => ({
          ...prev,
          proof: res.message || "Upload failed",
        }));
        return;
      }
      setProofUrl(res.data.url);
      setProofPublicId(res.data.publicId);
    } catch {
      setError("Could not upload payment proof");
      setPaymentErrors((prev) => ({
        ...prev,
        proof: "Could not upload payment proof",
      }));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmitPayment() {
    setError("");
    const incomplete: string[] = [];
    if (!isSchoolDetailsComplete(reg)) {
      incomplete.push("School details");
    }
    const studentsCheck = studentsReadyForSubmit(students);
    if (!studentsCheck.ok) {
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
      goToStep(incomplete[0] === "School details" ? 1 : 2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const nextErrors: {
      paymentMethod?: string;
      utr?: string;
      proof?: string;
    } = {};
    if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      nextErrors.paymentMethod = "Select payment method";
    }
    if (!utr.trim() || utr.trim().length < 6) {
      nextErrors.utr = `${paymentReference.requiredError} (min 6 characters)`;
    }
    if (!proofUrl) {
      nextErrors.proof = "Payment proof is required";
    }
    if (nextErrors.utr || nextErrors.proof || nextErrors.paymentMethod) {
      setPaymentErrors(nextErrors);
      setError("Fill the highlighted payment fields");
      const focusField = nextErrors.paymentMethod
        ? "paymentMethod"
        : nextErrors.utr
          ? "utr"
          : "proof";
      window.setTimeout(() => {
        const el = document.querySelector(
          `[data-payment-field="${focusField}"]`,
        ) as HTMLElement | null;
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
      }, 50);
      return;
    }
    setPaymentErrors({});
    setSaving(true);
    const res = await saveSchoolStep3({
      paymentMethod: paymentMethod as PaymentMethod,
      utr: utr.trim(),
      proofUrl,
      proofPublicId: proofPublicId || undefined,
    });
    setSaving(false);
    if (!res.success || !res.data) {
      const message = res.message || "Could not submit payment";
      if (/already used/i.test(message)) {
        setPaymentErrors({ utr: "This reference number is already used" });
        window.setTimeout(() => {
          const el = document.querySelector(
            '[data-payment-field="utr"]',
          ) as HTMLElement | null;
          if (!el) return;
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
        }, 50);
      }
      setError(message);
      return;
    }
    applyRegistration(res.data, { syncStep: true });
    if (submitSuccessTimerRef.current) {
      window.clearTimeout(submitSuccessTimerRef.current);
    }
    setShowSubmitSuccess(true);
    submitSuccessTimerRef.current = window.setTimeout(() => {
      setShowSubmitSuccess(false);
      submitSuccessTimerRef.current = null;
    }, 3500);
    window.setTimeout(() => {
      const section = document.getElementById(
        "registration-under-verification",
      );
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 80);
  }

  async function onPaymentReferenceBlur() {
    const value = utr.trim();
    if (locked || value.length < 6) return;
    const res = await checkPaymentReference(value);
    if (!res.success) return;
    if (res.data && res.data.available === false) {
      setPaymentErrors((prev) => ({
        ...prev,
        utr: res.data?.message || "This reference number is already used",
      }));
    }
  }

  const savedThrough = resolveSavedThrough(reg);
  const submitted =
    reg?.status === "UNDER_REVIEW" || reg?.status === "APPROVED";

  function getStepState(
    stepId: number,
  ): "completed" | "current" | "incomplete" | "pending" {
    if (submitted) return "completed";
    if (stepId === step) return "current";
    if (stepId <= savedThrough && stepId < step) return "completed";
    if (stepId < step) return "incomplete";
    return "pending";
  }

  function titleCaseField(key: keyof SchoolFormValues) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const next = toTitleCaseInput(e.target.value);
      e.target.value = next;
      // Do not validate on each keystroke — that paints fields red mid-entry
      // (e.g. school name needs 2+ chars). Errors show on submit / blur only.
      schoolForm.setValue(key, next as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
      if (schoolForm.formState.errors[key]) {
        schoolForm.clearErrors(key);
      }
    };
  }

  function clearFieldErrorOnChange(key: keyof SchoolFormValues) {
    return () => {
      if (schoolForm.formState.errors[key]) {
        schoolForm.clearErrors(key);
      }
    };
  }

  const formErrors = schoolForm.formState.errors;
  const fieldErr = (key: keyof SchoolFormValues) =>
    formErrors[key]?.message as string | undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/80" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-white" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-white" />
      </div>
    );
  }

  const namedStudents = students.filter((s) => s.name.trim()).length;
  const schoolDone = isSchoolDetailsComplete(reg);
  const studentsCheck = studentsReadyForSubmit(students);
  const paymentDone = Boolean(reg?.payment?.utr && (reg.payment.proofUrl || proofUrl));

  const schoolIdentity =
    reg?.schoolName || reg?.schoolCode ? (
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:justify-end sm:text-right">
        {reg.schoolName ? (
          <p className="text-lg leading-tight text-muted sm:text-xl">
            School name:{" "}
            <span className="font-bold text-brand">{reg.schoolName}</span>
          </p>
        ) : null}
        {reg.schoolCode ? (
          <p className="text-lg leading-tight text-muted sm:text-xl">
            School code:{" "}
            <span className="font-mono font-bold tracking-wider text-brand">
              {reg.schoolCode}
            </span>
          </p>
        ) : null}
      </div>
    ) : null;

  function openTab(next: string) {
    router.replace(`/school/portal?tab=${next}`, { scroll: false });
  }

  const moduleTabs: Record<
    string,
    { title: string; description: string }
  > = {
    certificates: {
      title: "Certificates",
      description:
        "Download student certificates when they become available for this Olympiad Year.",
    },
    reports: {
      title: "Student reports",
      description:
        "Access student performance reports for your registered participants.",
    },
    rankings: {
      title: "Rankings",
      description:
        "See school and student rankings after results are published.",
    },
  };

  if (tab === "results") {
    return <SchoolResultsPanel />;
  }

  if (tab in moduleTabs) {
    const mod = moduleTabs[tab];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand">{mod.title}</h1>
          <p className="mt-1 text-sm text-muted">{mod.description}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-brand">Coming soon</p>
          <p className="mt-2 text-sm text-muted">
            This section will be available after results are published for the
            current Olympiad Year.
          </p>
        </div>
      </div>
    );
  }

  if (tab === "list") {
    // Only approved accounts use this page
    if (reg?.status !== "APPROVED") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-brand">Registration</h1>
            <p className="mt-1 text-sm text-muted">
              Complete and submit registration. Registered students appear here
              after admin approval.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-5 py-8 text-sm text-muted shadow-sm">
            This school account has no approved registration yet. Use{" "}
            <button
              type="button"
              className="font-semibold text-brand underline"
              onClick={() => openTab("registration")}
            >
              Registration
            </button>{" "}
            to continue.
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand">Registered students</h1>
            <p className="mt-1 text-sm text-muted">
              Approved students for your school.
            </p>
          </div>
          {schoolIdentity}
        </div>
        <SchoolApprovedStudents />
      </div>
    );
  }

  // Approved: Registration tab is not used — show students instead
  if (tab === "registration" && reg?.status === "APPROVED") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand">Registered students</h1>
            <p className="mt-1 text-sm text-muted">
              Approved students for your school.
            </p>
          </div>
          {schoolIdentity}
        </div>
        <SchoolApprovedStudents />
      </div>
    );
  }

  // Registration wizard (draft / under review / rejected / no registration yet)
  const registrationHeader = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-brand">Registration</h1>
        <p className="mt-1 text-sm text-muted">
          {reg?.status === "UNDER_REVIEW"
            ? "Your registration is pending verification."
            : reg?.status === "REJECTED" && !resubmitAfterReject
              ? "Registration rejected by i-CAPE. You can submit again."
              : "Complete school details, students, and payment."}
        </p>
      </div>
      {schoolIdentity}
    </div>
  );

  if (reg?.status === "UNDER_REVIEW") {
    return (
      <div className="space-y-6">
        {registrationHeader}
        <div
          id="registration-under-verification"
          className="scroll-mt-6 rounded-2xl border border-accent/40 bg-accent-soft px-5 py-8 sm:px-8"
        >
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <Clock className="size-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-xl font-bold text-brand sm:text-2xl">
                Registration pending
              </h2>
              <p className="text-sm leading-relaxed text-brand/80 sm:text-base">
                Your registration has been submitted and is waiting for admin
                verification. This usually takes up to{" "}
                <span className="font-semibold text-brand">24 hours</span>. You
                will get an email when it is approved or if any action is needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (reg?.status === "REJECTED" && !resubmitAfterReject) {
    return (
      <div className="space-y-6">
        {registrationHeader}
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
              <X className="size-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-red-900 sm:text-2xl">
                  Registration rejected by i-CAPE
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-red-800 sm:text-base">
                  You can submit again after updating your payment details.
                </p>
              </div>
              <div className="rounded-xl border border-red-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Reason
                </p>
                <p className="mt-1 text-sm font-medium text-red-950 sm:text-base">
                  {reg.rejectionNote?.trim() ||
                    "No reason was provided. Contact support if you need help."}
                </p>
              </div>
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  setResubmitAfterReject(true);
                  goToStep(3);
                }}
              >
                Submit again for verification
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {registrationHeader}

      {reg?.status === "REJECTED" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
          <p className="font-semibold text-base text-red-900">
            Registration rejected by i-CAPE. You can submit again.
          </p>
          <div className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Reason
            </p>
            <p className="mt-1 font-medium text-red-950">
              {reg.rejectionNote?.trim() ||
                "No reason was provided. Contact support if you need help."}
            </p>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Registration steps"
        className="w-full overflow-x-auto rounded-2xl border border-border bg-white px-3 py-4 shadow-sm sm:px-6"
      >
        <ol className="flex min-w-[640px] items-center justify-between gap-1 sm:min-w-0">
          {STEPS.map((item, index) => {
            const state = getStepState(item.id);
            const underReview = reg?.status === "UNDER_REVIEW";
            const studentsOk = studentsReadyForSubmit(students).ok;
            const schoolOk =
              underReview ||
              reg?.status === "APPROVED" ||
              isSchoolDetailsComplete(reg);
            const canOpenPayment =
              underReview ||
              reg?.status === "APPROVED" ||
              studentsOk;
            // Only unlock from saved progress — never from currentStep alone.
            const canJumpBase =
              underReview ||
              (!locked &&
                (item.id === step ||
                  item.id <= savedThrough ||
                  (item.id === 1 && savedThrough >= 1)));
            const canJump =
              item.id === 1
                ? canJumpBase || !locked
                : item.id === 2
                  ? canJumpBase && schoolOk
                  : canJumpBase && schoolOk && canOpenPayment;
            return (
              <li key={item.id} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={() => {
                    if (canJump) goToStep(item.id);
                  }}
                  className={cn(
                    "flex w-full min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left",
                    canJump
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-55",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                      state === "completed" &&
                        "border-green-600 bg-green-600 text-white",
                      state === "current" &&
                        "border-brand bg-brand text-white",
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
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <p className="min-w-0 flex-1">{error}</p>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-red-600 hover:bg-red-100"
            aria-label="Dismiss"
            onClick={() => setError("")}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <form
          className="space-y-6 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
          onSubmit={schoolForm.handleSubmit(onSaveStep1, () => {
            setError("Fill all required fields highlighted in red");
          })}
        >
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-brand">Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="School code" className="sm:col-span-2">
                <div className="flex h-9 max-w-xs items-center rounded-md border border-border bg-brand-soft/40 px-3 font-mono text-sm font-bold tracking-wider text-brand">
                  {reg?.schoolCode || "Assigning…"}
                </div>
              </Field>
              <Field label="School name *" error={fieldErr("schoolName")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("schoolName"))}
                  className={fieldBorder(Boolean(fieldErr("schoolName")))}
                  {...schoolForm.register("schoolName", {
                    onChange: titleCaseField("schoolName"),
                  })}
                />
              </Field>
              <Field
                label="Trust / Society *"
                error={fieldErr("trustName")}
              >
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("trustName"))}
                  className={fieldBorder(Boolean(fieldErr("trustName")))}
                  {...schoolForm.register("trustName", {
                    onChange: titleCaseField("trustName"),
                  })}
                />
              </Field>
              <Field
                label="School address *"
                error={fieldErr("address")}
                className="sm:col-span-2"
              >
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("address"))}
                  className={fieldBorder(Boolean(fieldErr("address")))}
                  {...schoolForm.register("address", {
                    onChange: titleCaseField("address"),
                  })}
                />
              </Field>
              <Field label="City *" error={fieldErr("city")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("city"))}
                  className={fieldBorder(Boolean(fieldErr("city")))}
                  {...schoolForm.register("city", {
                    onChange: titleCaseField("city"),
                  })}
                />
              </Field>
              <Field label="District *" error={fieldErr("district")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("district"))}
                  className={fieldBorder(Boolean(fieldErr("district")))}
                  {...schoolForm.register("district", {
                    onChange: titleCaseField("district"),
                  })}
                />
              </Field>
              <Field label="State *" error={fieldErr("state")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("state"))}
                  className={fieldBorder(Boolean(fieldErr("state")))}
                  {...schoolForm.register("state", {
                    onChange: titleCaseField("state"),
                  })}
                />
              </Field>
              <Field label="Pin code *" error={fieldErr("pincode")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("pincode"))}
                  className={fieldBorder(Boolean(fieldErr("pincode")))}
                  {...schoolForm.register("pincode", {
                    onChange: clearFieldErrorOnChange("pincode"),
                  })}
                />
              </Field>
              <Field label="Country *" error={fieldErr("country")}>
                <div
                  className={cn(
                    "flex flex-wrap gap-4 rounded-md border px-3 py-2",
                    fieldErr("country") ? "border-red-500" : "border-border",
                  )}
                >
                  {(["India", "Other"] as const).map((opt) => (
                    <label
                      key={opt}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
                    >
                      <input
                        type="radio"
                        disabled={locked}
                        value={opt}
                        checked={watchedCountry === opt}
                        onChange={() =>
                          schoolForm.setValue("country", opt, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </Field>
              {watchedCountry === "Other" ? (
                <Field
                  label="Name of the country *"
                  error={fieldErr("countryOther")}
                >
                  <Input
                    disabled={locked}
                    aria-invalid={Boolean(fieldErr("countryOther"))}
                    className={fieldBorder(Boolean(fieldErr("countryOther")))}
                    {...schoolForm.register("countryOther", {
                      onChange: titleCaseField("countryOther"),
                    })}
                  />
                </Field>
              ) : null}
              <Field label="School website" error={fieldErr("website")}>
                <Input
                  disabled={locked}
                  placeholder="www."
                  aria-invalid={Boolean(fieldErr("website"))}
                  className={fieldBorder(Boolean(fieldErr("website")))}
                  {...schoolForm.register("website", {
                    onChange: clearFieldErrorOnChange("website"),
                  })}
                />
              </Field>
              <Field
                label="School affiliation *"
                error={fieldErr("affiliation") || fieldErr("affiliationOther")}
                className="sm:col-span-2"
              >
                <div
                  className={cn(
                    "flex flex-wrap gap-4 rounded-md border px-3 py-2",
                    fieldErr("affiliation") || fieldErr("affiliationOther")
                      ? "border-red-500"
                      : "border-border",
                  )}
                >
                  {(
                    [
                      ["CBSE", "CBSE"],
                      ["ICSE", "ICSE"],
                      ["STATE_BOARD", "State board"],
                      ["OTHER", "Other"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
                    >
                      <input
                        type="radio"
                        disabled={locked}
                        checked={watchedAffiliation === value}
                        onChange={() =>
                          schoolForm.setValue("affiliation", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {watchedAffiliation === "OTHER" ? (
                  <Input
                    className={cn(
                      "mt-2",
                      fieldBorder(Boolean(fieldErr("affiliationOther"))),
                    )}
                    disabled={locked}
                    placeholder="Please mention"
                    aria-invalid={Boolean(fieldErr("affiliationOther"))}
                    {...schoolForm.register("affiliationOther", {
                      onChange: titleCaseField("affiliationOther"),
                    })}
                  />
                ) : null}
              </Field>
              <Field label="School mobile no. *" error={fieldErr("schoolMobile")}>
                <Input
                  disabled={locked}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  aria-invalid={Boolean(fieldErr("schoolMobile"))}
                  className={fieldBorder(Boolean(fieldErr("schoolMobile")))}
                  {...schoolForm.register("schoolMobile", {
                    onChange: clearFieldErrorOnChange("schoolMobile"),
                  })}
                />
              </Field>
              <Field label="School e-mail *" error={fieldErr("email")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("email"))}
                  className={fieldBorder(Boolean(fieldErr("email")))}
                  {...schoolForm.register("email", {
                    onChange: clearFieldErrorOnChange("email"),
                  })}
                />
              </Field>
              <Field label="STD code" error={fieldErr("stdCode")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("stdCode"))}
                  className={fieldBorder(Boolean(fieldErr("stdCode")))}
                  {...schoolForm.register("stdCode", {
                    onChange: clearFieldErrorOnChange("stdCode"),
                  })}
                />
              </Field>
              <Field label="Landline no." error={fieldErr("landline")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("landline"))}
                  className={fieldBorder(Boolean(fieldErr("landline")))}
                  {...schoolForm.register("landline", {
                    onChange: clearFieldErrorOnChange("landline"),
                  })}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-bold text-brand">Principal</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Name *" error={fieldErr("principalName")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("principalName"))}
                  className={fieldBorder(Boolean(fieldErr("principalName")))}
                  {...schoolForm.register("principalName", {
                    onChange: titleCaseField("principalName"),
                  })}
                />
              </Field>
              <Field label="Mobile no. *" error={fieldErr("principalMobile")}>
                <Input
                  disabled={locked}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  aria-invalid={Boolean(fieldErr("principalMobile"))}
                  className={fieldBorder(Boolean(fieldErr("principalMobile")))}
                  {...schoolForm.register("principalMobile", {
                    onChange: clearFieldErrorOnChange("principalMobile"),
                  })}
                />
              </Field>
              <Field label="E-mail *" error={fieldErr("principalEmail")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("principalEmail"))}
                  className={fieldBorder(Boolean(fieldErr("principalEmail")))}
                  {...schoolForm.register("principalEmail", {
                    onChange: clearFieldErrorOnChange("principalEmail"),
                  })}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-bold text-brand">
              School Olympiad Incharge
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Name *" error={fieldErr("contactName")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("contactName"))}
                  className={fieldBorder(Boolean(fieldErr("contactName")))}
                  {...schoolForm.register("contactName", {
                    onChange: titleCaseField("contactName"),
                  })}
                />
              </Field>
              <Field label="Mobile no. *" error={fieldErr("phone")}>
                <Input
                  disabled={locked}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  aria-invalid={Boolean(fieldErr("phone"))}
                  className={fieldBorder(Boolean(fieldErr("phone")))}
                  {...schoolForm.register("phone", {
                    onChange: clearFieldErrorOnChange("phone"),
                  })}
                />
              </Field>
              <Field label="E-mail *" error={fieldErr("inchargeEmail")}>
                <Input
                  disabled={locked}
                  aria-invalid={Boolean(fieldErr("inchargeEmail"))}
                  className={fieldBorder(Boolean(fieldErr("inchargeEmail")))}
                  {...schoolForm.register("inchargeEmail", {
                    onChange: clearFieldErrorOnChange("inchargeEmail"),
                  })}
                />
              </Field>
            </div>
          </section>

          {!locked ? (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Next — student details"}
              </Button>
            </div>
          ) : null}
        </form>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              Enter each student — draft saves automatically.
            </p>
            <p
              className={cn(
                "min-h-5 text-sm font-semibold",
                draftStatus === "saving" && "text-muted",
                draftStatus === "saved" && "text-green-700",
                draftStatus === "error" && "text-red-600",
              )}
              aria-live="polite"
            >
              {draftStatus === "saving"
                ? "Saving draft…"
                : draftStatus === "saved"
                  ? `Draft saved · ${draftStudents.length} student${draftStudents.length === 1 ? "" : "s"}`
                  : draftStatus === "error"
                    ? "Draft save failed"
                    : null}
            </p>
          </div>
          {!locked ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={studentTemplateUrl()}
                  className="inline-flex rounded-md border border-border px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
                >
                  Download Excel template
                </a>
                <label
                  className={cn(
                    "inline-flex cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft",
                    importStatus === "importing" && "pointer-events-none opacity-60",
                  )}
                >
                  {importStatus === "importing" ? "Importing…" : "Import Excel"}
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={importStatus === "importing"}
                    onChange={(e) => onImportExcel(e.target.files?.[0] ?? null)}
                  />
                </label>
                {importFileName ? (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      importStatus === "importing" && "text-muted",
                      importStatus === "done" && "text-green-700",
                      importStatus === "error" && "text-red-600",
                    )}
                    aria-live="polite"
                  >
                    {importStatus === "importing"
                      ? `Reading ${importFileName}…`
                      : importStatus === "done"
                        ? `Imported: ${importFileName}`
                        : importStatus === "error"
                          ? `Selected: ${importFileName} — not imported`
                          : importFileName}
                  </p>
                ) : null}
              </div>
              <GradeSwitchButtons
                activeGrade={activeGrade}
                onChange={switchGrade}
                counts={gradeCounts}
              />
            </div>
          ) : (
            <div className="flex justify-end">
              <GradeSwitchButtons
                activeGrade={activeGrade}
                onChange={switchGrade}
                counts={gradeCounts}
              />
            </div>
          )}

          <GradeTableFrame grade={activeGrade}>
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="bg-brand-stats text-white">
                <tr>
                  <th className="px-2 py-3 text-center font-semibold">S.No.</th>
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
                  <th className="w-[7.5rem] px-1 py-3 text-center font-semibold">
                    Mobile
                  </th>
                  <th className="px-2 py-3 text-center font-semibold">IMO</th>
                  <th className="px-2 py-3 text-center font-semibold">IEO</th>
                  <th className="px-2 py-3 text-center font-semibold">ISO</th>
                  <th className="w-14 px-2 py-3 text-center font-semibold">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {gradeIndices.map((absoluteIndex, displayIndex) => {
                  const student = students[absoluteIndex] as StudentDraft | undefined;
                  if (!student) return null;
                  const rowError = studentRowErrors[absoluteIndex];
                  const showOlympiadError =
                    rowError === "Select at least one olympiad";
                  return (
                  <tr
                    key={student.id || student.clientKey || `row-${absoluteIndex}`}
                    data-student-row-index={absoluteIndex}
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
                        disabled={locked}
                        value={student.name}
                        placeholder="IN BLOCK LETTERS"
                        data-student-row={absoluteIndex}
                        data-student-field="name"
                        aria-invalid={Boolean(rowError)}
                        className={cn(
                          "h-9 w-full uppercase",
                          fieldBorder(Boolean(rowError)),
                        )}
                        onChange={(e) =>
                          updateStudentRow(absoluteIndex, {
                            name: e.target.value.toUpperCase(),
                          })
                        }
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
                        disabled={locked}
                        value={student.section}
                        placeholder=""
                        maxLength={3}
                        className="h-9 w-12 px-1 text-center uppercase"
                        onChange={(e) =>
                          updateStudentRow(absoluteIndex, {
                            section: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </td>
                    <td className="w-[7.5rem] px-1 py-2 align-middle">
                      <Input
                        disabled={locked}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={student.mobile}
                        placeholder="Mobile"
                        className="h-9 w-[7.5rem] max-w-[7.5rem] px-2 text-center tabular-nums"
                        onChange={(e) =>
                          updateStudentRow(absoluteIndex, {
                            mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                          })
                        }
                      />
                    </td>
                    {(
                      [
                        ["imo", "IMO"],
                        ["ieo", "IEO"],
                        ["iso", "ISO"],
                      ] as const
                    ).map(([key], olympiadIndex) => (
                      <td
                        key={key}
                        className={cn(
                          "px-2 py-2 text-center align-middle",
                          showOlympiadError && "bg-red-100/80",
                        )}
                      >
                        <input
                          type="checkbox"
                          disabled={locked}
                          checked={student[key]}
                          data-student-row={
                            olympiadIndex === 0 ? absoluteIndex : undefined
                          }
                          data-student-field={
                            olympiadIndex === 0 ? "olympiad" : undefined
                          }
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
                            updateStudentRow(absoluteIndex, {
                              [key]: e.target.checked,
                            })
                          }
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center align-middle">
                      {!locked ? (
                        <button
                          type="button"
                          className="inline-flex text-red-600 hover:underline disabled:opacity-40"
                          aria-label="Remove student"
                          onClick={() => removeStudentAt(absoluteIndex)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </GradeTableFrame>

          {!locked ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
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
          ) : null}

          {!locked ? (
            <div className="flex justify-between gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => goToStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => void onSaveStep2()} disabled={saving}>
                {saving ? "Saving…" : "Next"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <PaymentFeeSummary
            students={students.filter((s) => s.name.trim())}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-accent/40 bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <QrCode className="size-5 text-brand" aria-hidden />
                <h3 className="font-bold text-brand">Online Payment QR</h3>
              </div>
              <div className="max-w-[200px] overflow-hidden rounded-lg border border-border bg-white p-2">
                <Image
                  src={PAYMENT_DETAILS.qrPath}
                  alt="Payment QR code"
                  width={400}
                  height={400}
                  className="h-auto w-full"
                />
              </div>
            </article>
            <article className="rounded-xl border border-accent/40 bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="size-5 text-brand" aria-hidden />
                <h3 className="font-bold text-brand">Bank transfer</h3>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Bank</dt>
                  <dd className="font-semibold text-brand">
                    {PAYMENT_DETAILS.bank.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">IFSC</dt>
                  <dd className="font-semibold text-brand">
                    {PAYMENT_DETAILS.bank.ifsc}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">A/C No.</dt>
                  <dd className="font-semibold text-brand">
                    {PAYMENT_DETAILS.bank.accountNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Branch</dt>
                  <dd className="font-semibold text-brand">
                    {PAYMENT_DETAILS.bank.branch}
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Payment method *"
              error={paymentErrors.paymentMethod}
            >
              <select
                disabled={locked}
                value={paymentMethod}
                data-payment-field="paymentMethod"
                aria-invalid={Boolean(paymentErrors.paymentMethod)}
                className={cn(
                  "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand disabled:cursor-default disabled:border-border disabled:bg-slate-50 disabled:text-brand disabled:opacity-100",
                  fieldBorder(Boolean(paymentErrors.paymentMethod)),
                )}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as PaymentMethod | "");
                  setPaymentErrors((prev) => ({
                    ...prev,
                    paymentMethod: undefined,
                    utr: undefined,
                  }));
                }}
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
            <Field label={paymentReference.label} error={paymentErrors.utr}>
              <Input
                key={`utr-${reg?.id ?? "new"}-${reg?.status ?? "draft"}-${reg?.rejectionNote ? "rej" : "ok"}`}
                disabled={locked}
                value={utr}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                name="icape-payment-reference"
                inputMode="text"
                data-payment-field="utr"
                aria-invalid={Boolean(paymentErrors.utr)}
                className={fieldBorder(Boolean(paymentErrors.utr))}
                onChange={(e) => {
                  setUtr(e.target.value);
                  setPaymentErrors((prev) => ({ ...prev, utr: undefined }));
                }}
                onBlur={() => void onPaymentReferenceBlur()}
                placeholder={paymentReference.placeholder}
              />
            </Field>
            <Field
              label="Payment proof (JPG / PNG / PDF) *"
              error={paymentErrors.proof}
              className="sm:col-span-2"
            >
              {locked ? (
                proofUrl ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    View uploaded proof
                  </a>
                ) : (
                  <p className="text-sm text-muted">No proof on file</p>
                )
              ) : (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    data-payment-field="proof"
                    aria-invalid={Boolean(paymentErrors.proof)}
                    className={fieldBorder(Boolean(paymentErrors.proof))}
                    onChange={(e) =>
                      onUploadProof(e.target.files?.[0] ?? null)
                    }
                  />
                  {uploading ? (
                    <p className="text-sm text-muted">Uploading…</p>
                  ) : null}
                  {proofUrl ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Proof uploaded — open
                    </a>
                  ) : null}
                </div>
              )}
            </Field>
          </div>

          {!locked ? (
            <div className="flex justify-between gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => goToStep(2)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={onSubmitPayment}
                disabled={saving || uploading}
              >
                {saving ? "Submitting…" : "Submit registration"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {showSubmitSuccess ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand/45 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="submit-success-title"
          aria-describedby="submit-success-desc"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="size-7" aria-hidden />
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted hover:bg-brand-soft hover:text-brand"
                aria-label="Close"
                onClick={() => {
                  setShowSubmitSuccess(false);
                  if (submitSuccessTimerRef.current) {
                    window.clearTimeout(submitSuccessTimerRef.current);
                    submitSuccessTimerRef.current = null;
                  }
                }}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <h2
              id="submit-success-title"
              className="mt-4 text-xl font-bold text-brand"
            >
              Registration submitted
            </h2>
            <p
              id="submit-success-desc"
              className="mt-2 text-sm leading-relaxed text-muted"
            >
              Your payment details were received. Verification usually takes up
              to 24 hours. You can track status on this page.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SchoolPortalPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-white/80" />
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-white" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-white" />
        </div>
      }
    >
      <SchoolPortalPage />
    </Suspense>
  );
}
