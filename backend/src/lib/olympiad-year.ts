/** Fixed Olympiad Year — never dynamic; no before/after years. */
export const CURRENT_OLYMPIAD_YEAR = "2026-2027" as const;

export type OlympiadYearMeta = {
  label: typeof CURRENT_OLYMPIAD_YEAR;
  code: typeof CURRENT_OLYMPIAD_YEAR;
};

export const OLYMPIAD_YEAR_META: OlympiadYearMeta = {
  label: CURRENT_OLYMPIAD_YEAR,
  code: CURRENT_OLYMPIAD_YEAR,
};

/** Always 2026-2027 (ignores any input). */
export function olympiadYearMeta(_year?: string): OlympiadYearMeta {
  return OLYMPIAD_YEAR_META;
}

/** Always 2026-2027 (ignores any input). */
export function resolveOlympiadYear(_input?: string | null): string {
  return CURRENT_OLYMPIAD_YEAR;
}

export function listOlympiadYears(): OlympiadYearMeta[] {
  return [OLYMPIAD_YEAR_META];
}

export function getCurrentOlympiadYear(): OlympiadYearMeta {
  return OLYMPIAD_YEAR_META;
}

export const getActiveOlympiadYear = getCurrentOlympiadYear;
