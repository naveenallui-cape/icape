export const REGISTRATION_DEADLINE_LABEL = "30th September 2026";
export const OLYMPIAD_YEAR_LABEL = "2026-27";
export const REGISTRATION_FEE_LABEL = "INR 150 per student per Olympiad";
export const WHATSAPP_NUMBER = "+91 80745 63902";
/** Digits only, country code included (no +) — for WhatsApp app deep links */
export const WHATSAPP_E164 = "918074563902";

/**
 * Opens the WhatsApp app directly (not WhatsApp Web / wa.me website).
 * Optional prefilled message is supported.
 */
export function buildWhatsAppAppUrl(text?: string) {
  const params = new URLSearchParams({ phone: WHATSAPP_E164 });
  if (text?.trim()) params.set("text", text.trim());
  return `whatsapp://send?${params.toString()}`;
}

export const WHATSAPP_APP_HREF = buildWhatsAppAppUrl();

export const ANNOUNCEMENT_OLYMPIADS = [
  {
    code: "IMO",
    name: "Innovative Maths Olympiad",
    examDate: "14th December 2026",
    href: "/imo",
  },
  {
    code: "ISO",
    name: "Innovative Science Olympiad",
    examDate: "16th December 2026",
    href: "/iso",
  },
  {
    code: "IEO",
    name: "Innovative English Olympiad",
    examDate: "18th December 2026",
    href: "/ieo",
  },
] as const;

/** localStorage key — bump year segment when Olympiad Year changes */
export const INTRO_POPUP_STORAGE_KEY = "icape-intro-popup-dismissed-2026-27";
