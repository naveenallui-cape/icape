"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  KeyRound,
  MapPin,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentReferenceField, type PaymentMethod } from "@/lib/payment-details";
import { cn } from "@/lib/utils";
import { AdminTableShell, AdminTableSkeletonRows } from "@/components/admin/admin-table-shell";
import { AdminSearchField } from "@/components/admin/admin-search-field";
import { apiRequest } from "@/lib/api";
import {
  adminQueryKeys,
  ADMIN_LIST_REFETCH_MS,
  fetchAdminAccounts,
} from "@/lib/admin-queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type RegistrationDetail = {
  id: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  countryOther: string;
  website: string;
  affiliation: string;
  affiliationOther: string;
  trustName: string;
  schoolMobile: string;
  landline: string;
  stdCode: string;
  email: string;
  principalName: string;
  principalMobile: string;
  principalEmail: string;
  contactName: string;
  phone: string;
  inchargeEmail: string;
  status: string;
  currentStep: number;
  submittedAt: string | null;
  updatedAt: string;
  olympiadYear: { label: string; code: string } | null;
  _count: { students: number };
  payment: {
    status: string;
    paymentMethod?: PaymentMethod;
    utr: string;
    amountExpected: string | number;
  } | null;
};

type AccountRow = {
  id: string;
  email: string;
  password?: string;
  name: string | null;
  createdAt: string;
  registrationCount: number;
  schoolName: string;
  schoolCode: string;
  city: string;
  state: string;
  district: string;
  contactName: string;
  phone: string;
  status: string | null;
  studentCount: number;
  imoCount: number;
  isoCount: number;
  ieoCount: number;
  olympiadTotal: number;
  olympiadYear: { label: string; code: string } | null;
  registration: RegistrationDetail | null;
};

const PAGE_SIZE = 20;

function statusClass(status: string | null) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "UNDER_REVIEW":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    case "DRAFT":
      return "bg-brand-soft text-brand border-border";
    default:
      return "bg-background text-muted border-border";
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-snug text-brand">
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-white">
      <div className="flex items-center gap-2.5 border-b border-border/70 bg-brand-soft/40 px-4 py-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className="text-sm font-bold text-brand">{title}</h3>
      </div>
      <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </section>
  );
}

export default function AdminSchoolsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedInput = useDebouncedValue(searchInput, 300);
  const q = debouncedInput.trim();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<AccountRow | null>(null);
  const [passwordId, setPasswordId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const schoolsQuery = useQuery({
    queryKey: adminQueryKeys.schools(page, q),
    queryFn: () =>
      fetchAdminAccounts({
        page,
        limit: PAGE_SIZE,
        q,
        approved: true,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: ADMIN_LIST_REFETCH_MS,
  });

  const rows = (schoolsQuery.data?.accounts || []) as AccountRow[];
  const totalPages = schoolsQuery.data?.pagination.totalPages || 1;
  const total = schoolsQuery.data?.pagination.total || 0;
  const serialOffset = (page - 1) * PAGE_SIZE;
  const totals = schoolsQuery.data?.totals || {
    imo: 0,
    iso: 0,
    ieo: 0,
    schools: total,
  };
  const showInitialLoading = schoolsQuery.isPending && !schoolsQuery.data;

  async function setSchoolPassword() {
    if (!passwordId) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const res = await apiRequest(
      `/admin/school-registrations/accounts/${passwordId}/password`,
      {
        method: "POST",
        body: { password },
      },
    );
    setBusy(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMessage("Password updated");
    setPassword("");
    setPasswordId(null);
  }

  const reg = selected?.registration;
  const queryError =
    error ||
    (schoolsQuery.isError
      ? schoolsQuery.error instanceof Error
        ? schoolsQuery.error.message
        : "Failed to load schools"
      : "");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Schools</h1>
          <p className="mt-1 text-sm text-muted">
            Approved school registrations for the active Olympiad Year.
          </p>
        </div>
        <div
          aria-label="Schools and olympiad entry totals"
          className="flex shrink-0 items-stretch overflow-hidden rounded-lg border border-border bg-white"
        >
          {(
            [
              { code: "IMO", count: totals.imo },
              { code: "IEO", count: totals.ieo },
              { code: "ISO", count: totals.iso },
            ] as const
          ).map((item, index) => (
            <div
              key={item.code}
              className={
                index > 0
                  ? "border-l border-border px-3.5 py-2 text-center sm:px-4"
                  : "px-3.5 py-2 text-center sm:px-4"
              }
            >
              <p className="text-[11px] font-semibold tracking-wide text-muted">
                {item.code}
              </p>
              <p className="text-base font-bold tabular-nums leading-tight text-brand">
                {showInitialLoading ? "—" : item.count}
              </p>
            </div>
          ))}
          <div className="border-l border-brand/20 bg-brand px-3.5 py-2 text-center sm:px-4">
            <p className="text-[11px] font-semibold tracking-wide text-white/80">
              Schools
            </p>
            <p className="text-base font-bold tabular-nums leading-tight text-white">
              {showInitialLoading ? "—" : totals.schools || total}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-3">
        <AdminSearchField
          value={searchInput}
          onChange={setSearchInput}
          placeholder="School name, code, email, city…"
        />
      </div>

      {queryError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {queryError}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {message}
        </div>
      ) : null}

      <AdminTableShell
        loading={showInitialLoading}
        className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(13,23,59,0.05)]"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-brand-stats text-white">
              <tr>
                <th className="px-3 py-3 font-semibold">S.No.</th>
                <th className="px-4 py-3 font-semibold">School name</th>
                <th className="px-3 py-3 font-semibold">School code</th>
                <th className="px-3 py-3 font-semibold">Contact</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-center font-semibold">IMO</th>
                <th className="px-3 py-3 text-center font-semibold">IEO</th>
                <th className="px-3 py-3 text-center font-semibold">ISO</th>
                <th className="px-3 py-3 text-center font-semibold">Total</th>
                <th className="px-3 py-3 text-center font-semibold">Details</th>
                <th className="px-3 py-3 text-center font-semibold">Password</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-border",
                    index % 2 === 0 ? "bg-white" : "bg-brand-soft/20",
                  )}
                >
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {serialOffset + index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand">
                      {row.schoolName || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs font-bold tracking-wide text-brand">
                    {row.schoolCode || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-brand">{row.contactName || "—"}</p>
                    <p className="text-xs text-muted">{row.phone || ""}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        statusClass(row.status),
                      )}
                    >
                      {row.status || "No registration"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-brand">
                    {row.imoCount}
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-brand">
                    {row.ieoCount}
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-brand">
                    {row.isoCount}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-brand">
                    {row.olympiadTotal}
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(row)}
                    >
                      <Eye className="size-3.5" aria-hidden />
                      Details
                    </Button>
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPasswordId(row.id);
                        setPassword("");
                        setMessage("");
                        setError("");
                      }}
                    >
                      <KeyRound className="size-3.5" aria-hidden />
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
              {!showInitialLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted">
                    No schools found.
                  </td>
                </tr>
              ) : null}
              {showInitialLoading ? (
                <AdminTableSkeletonRows columns={11} rows={8} />
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
            {total > 0
              ? ` · Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
              : null}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || schoolsQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || schoolsQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </AdminTableShell>

      {passwordId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-brand">Set password</h2>
                <p className="text-sm text-muted">
                  Update login password for this school account.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPasswordId(null)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 6)"
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button type="button" disabled={busy} onClick={setSchoolPassword}>
                Save password
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-[#f4f7fb] shadow-2xl sm:rounded-3xl">
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-hover px-5 py-5 text-white sm:px-7 sm:py-6">
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 15% 20%, #d4af37 0%, transparent 40%), radial-gradient(circle at 90% 0%, #fff 0%, transparent 35%)",
                }}
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    School profile
                  </p>
                  <h2 className="mt-1 truncate font-serif text-2xl font-semibold tracking-tight">
                    {selected.schoolName || selected.name || "School account"}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {selected.schoolCode ? (
                      <span className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-accent">
                        {selected.schoolCode}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        statusClass(selected.status),
                      )}
                    >
                      {selected.status || "No registration"}
                    </span>
                    <span className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/90">
                      {selected.studentCount} students
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-white/75">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {[selected.city, selected.district, selected.state]
                      .filter(Boolean)
                      .join(", ") || "Location not added"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => setSelected(null)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {reg ? (
                <>
                  <DetailSection icon={Building2} title="School details">
                    <DetailItem label="School name" value={reg.schoolName} />
                    <DetailItem label="School code" value={reg.schoolCode} />
                    <DetailItem
                      label="Affiliation"
                      value={
                        reg.affiliation === "OTHER"
                          ? reg.affiliationOther || "Other"
                          : reg.affiliation
                      }
                    />
                    <DetailItem label="Trust / Society" value={reg.trustName} />
                    <DetailItem label="Website" value={reg.website} />
                    <DetailItem label="School email" value={reg.email} />
                    <DetailItem
                      label="School mobile"
                      value={reg.schoolMobile}
                    />
                    <DetailItem
                      label="Landline"
                      value={
                        reg.stdCode
                          ? `${reg.stdCode} – ${reg.landline}`
                          : reg.landline
                      }
                    />
                  </DetailSection>

                  <DetailSection icon={MapPin} title="Address">
                    <DetailItem
                      label="Address"
                      value={reg.address}
                    />
                    <DetailItem label="City" value={reg.city} />
                    <DetailItem label="District" value={reg.district} />
                    <DetailItem label="State" value={reg.state} />
                    <DetailItem label="Pin code" value={reg.pincode} />
                    <DetailItem
                      label="Country"
                      value={
                        reg.country === "Other"
                          ? reg.countryOther || "Other"
                          : reg.country
                      }
                    />
                  </DetailSection>

                  <DetailSection icon={UserRound} title="Principal">
                    <DetailItem label="Name" value={reg.principalName} />
                    <DetailItem label="Mobile" value={reg.principalMobile} />
                    <DetailItem label="Email" value={reg.principalEmail} />
                  </DetailSection>

                  <DetailSection
                    icon={GraduationCap}
                    title="Olympiad incharge"
                  >
                    <DetailItem label="Name" value={reg.contactName} />
                    <DetailItem label="Mobile" value={reg.phone} />
                    <DetailItem label="Email" value={reg.inchargeEmail} />
                  </DetailSection>

                  {reg.payment ? (
                    <DetailSection icon={Wallet} title="Payment">
                      <DetailItem label="Status" value={reg.payment.status} />
                      <DetailItem
                        label="Method"
                        value={reg.payment.paymentMethod || "UPI"}
                      />
                      <DetailItem
                        label={paymentReferenceField(
                          reg.payment.paymentMethod || "UPI",
                        ).label.replace(" *", "")}
                        value={reg.payment.utr}
                      />
                      <DetailItem
                        label="Amount"
                        value={`INR ${Number(reg.payment.amountExpected).toLocaleString("en-IN")}`}
                      />
                    </DetailSection>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center">
                  <Building2 className="mx-auto size-8 text-muted" aria-hidden />
                  <p className="mt-3 text-sm font-semibold text-brand">
                    No registration started
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    This account has not filled school registration details yet.
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-4 py-3 sm:px-6">
              <p className="text-xs text-muted">
                Login email:{" "}
                <span className="font-semibold text-brand">{selected.email}</span>
                {" · "}
                Password:{" "}
                <span className="font-mono font-semibold text-brand">
                  {selected.password || "—"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordId(selected.id);
                    setSelected(null);
                    setPassword("");
                  }}
                >
                  <KeyRound className="size-4" aria-hidden />
                  Set password
                </Button>
                <Button type="button" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
