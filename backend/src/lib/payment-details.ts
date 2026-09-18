export const FEE_PER_STUDENT_PER_OLYMPIAD = 150;

export const PAYMENT_METHODS = ["UPI", "NEFT", "RTGS", "IMPS"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_DETAILS = {
  feeLabel: "INR 150 per student per Olympiad",
  feeAmount: FEE_PER_STUDENT_PER_OLYMPIAD,
  qrPath: "/brand/payment-qr.png",
  bank: {
    name: "IDFC FIRST BANK",
    ifsc: "IDFB0080243",
    accountType: "Current",
    accountNumber: "10249756617",
    branch: "Begumpet",
  },
} as const;

export function computeRegistrationFee(
  students: Array<{ imo: boolean; iso: boolean; ieo: boolean }>,
) {
  const olympiadSlots = students.reduce((sum, s) => {
    return sum + (s.imo ? 1 : 0) + (s.iso ? 1 : 0) + (s.ieo ? 1 : 0);
  }, 0);
  return olympiadSlots * FEE_PER_STUDENT_PER_OLYMPIAD;
}
