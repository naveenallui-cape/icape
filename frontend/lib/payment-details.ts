export const FEE_PER_STUDENT_PER_OLYMPIAD = 150;

export const PAYMENT_METHODS = ["UPI", "NEFT", "RTGS", "IMPS"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function paymentReferenceField(method: PaymentMethod) {
  switch (method) {
    case "UPI":
      return {
        label: "Transaction / UPI reference number (UTR) *",
        placeholder: "Enter UPI transaction reference",
        requiredError: "Transaction / UPI reference number is required",
      };
    case "NEFT":
      return {
        label: "UTR number *",
        placeholder: "Enter UTR number",
        requiredError: "UTR number is required",
      };
    case "RTGS":
      return {
        label: "UTR number *",
        placeholder: "Enter UTR number",
        requiredError: "UTR number is required",
      };
    case "IMPS":
      return {
        label: "Transaction reference number / RRN *",
        placeholder: "Enter transaction reference or RRN",
        requiredError: "Transaction reference number / RRN is required",
      };
  }
}

export const PAYMENT_DETAILS = {
  feeLabel: "INR 150 per Olympiad",
  feeAmount: FEE_PER_STUDENT_PER_OLYMPIAD,
  qrPath: "/brand/payment-qr.png",
  bank: {
    accountName:
      "INNOVATIVE CENTRE FOR ASSESSMENT AND PROGRESSIVE EDUCATION PVT LTD",
    name: "IDFC FIRST BANK",
    ifsc: "IDFB0080243",
    accountType: "Current",
    accountNumber: "10249756617",
    branch: "Begumpet",
  },
} as const;

export function computeRegistrationFee(
  students: Array<{ imo: boolean; iso: boolean; ieo: boolean }>,
  feePerSlot: number = FEE_PER_STUDENT_PER_OLYMPIAD,
) {
  return summarizeRegistrationFee(students, feePerSlot).totalFee;
}

export function summarizeRegistrationFee(
  students: Array<{
    name?: string;
    imo: boolean;
    iso: boolean;
    ieo: boolean;
  }>,
  feePerSlot: number = FEE_PER_STUDENT_PER_OLYMPIAD,
) {
  const named = students.filter((s) =>
    s.name === undefined ? true : Boolean(s.name.trim()),
  );
  let imoCount = 0;
  let isoCount = 0;
  let ieoCount = 0;
  for (const s of named) {
    if (s.imo) imoCount += 1;
    if (s.iso) isoCount += 1;
    if (s.ieo) ieoCount += 1;
  }
  const olympiadSlots = imoCount + isoCount + ieoCount;
  const rate =
    Number.isFinite(feePerSlot) && feePerSlot > 0
      ? feePerSlot
      : FEE_PER_STUDENT_PER_OLYMPIAD;
  const totalFee = olympiadSlots * rate;
  return {
    studentCount: named.length,
    imoCount,
    isoCount,
    ieoCount,
    olympiadSlots,
    feePerSlot: rate,
    totalFee,
  };
}
