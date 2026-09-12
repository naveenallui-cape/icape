export const REGISTRATION_DEADLINE_LABEL = "30th September 2026";
export const OLYMPIAD_YEAR_LABEL = "2026-27";
export const REGISTRATION_FEE_LABEL = "INR 150 per student per Olympiad";
export const WHATSAPP_NUMBER = "+91 80745 63902";

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
