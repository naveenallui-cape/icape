/** Indian mobile: exactly 10 digits, no spaces or country code. */
export const MOBILE_DIGITS_REGEX = /^[0-9]{10}$/;
export const MOBILE_ERROR = "Enter a valid 10-digit mobile number";

export function isValidMobile(value: string | null | undefined) {
  return MOBILE_DIGITS_REGEX.test((value || "").trim());
}
