/** Indian mobile: exactly 10 digits, no spaces or country code. */
export const MOBILE_DIGITS_REGEX = /^[0-9]{10}$/;
export const MOBILE_ERROR = "Enter a valid 10-digit mobile number";

export function isValidMobile(value: string | null | undefined) {
  return MOBILE_DIGITS_REGEX.test((value || "").trim());
}

/** Keep only a valid 10-digit mobile; drop invalid Excel / paste values. */
export function sanitizeMobileDigits(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return "";
}
