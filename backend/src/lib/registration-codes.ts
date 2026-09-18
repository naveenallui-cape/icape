import { randomInt } from "crypto";
import { prisma } from "../lib/prisma";

/** Inclusive range for 6-digit school codes (never leading zero). */
const MIN_SIX_DIGIT = 100_000;
const MAX_SIX_DIGIT = 999_999;

/** Inclusive range for 8-digit student codes (never leading zero). */
const MIN_EIGHT_DIGIT = 10_000_000;
const MAX_EIGHT_DIGIT = 99_999_999;
const MAX_ATTEMPTS = 40;
const CANDIDATE_BATCH = 64;

function randomSixDigit(): string {
  return String(randomInt(MIN_SIX_DIGIT, MAX_SIX_DIGIT + 1));
}

function randomEightDigit(): string {
  return String(randomInt(MIN_EIGHT_DIGIT, MAX_EIGHT_DIGIT + 1));
}

async function schoolCodeTaken(code: string, olympiadYearId?: string) {
  const existing = await prisma.schoolRegistration.findFirst({
    where: olympiadYearId
      ? { schoolCode: code, olympiadYearId }
      : { schoolCode: code },
    select: { id: true },
  });
  return Boolean(existing);
}

/**
 * Unique random 6-digit school code for the Olympiad Year.
 */
export async function allocateSchoolCode(
  _olympiadYearCode: string,
  olympiadYearId?: string,
) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = randomSixDigit();
    if (!(await schoolCodeTaken(code, olympiadYearId))) {
      return code;
    }
  }
  throw new Error("Could not allocate a unique school code");
}

/**
 * Unique random 8-digit student registration numbers (global uniqueness).
 * Uses crypto-safe randomness + batched DB checks — safe for production at scale.
 *
 * Generated when a named student is first saved (draft or final), then kept stable
 * across later edits of that same student.
 */
export async function allocateStudentRegistrationNumbers(
  count: number,
): Promise<string[]> {
  if (count <= 0) return [];

  const allocated = new Set<string>();
  let rounds = 0;
  const maxRounds = Math.max(MAX_ATTEMPTS, Math.ceil(count / 8) * MAX_ATTEMPTS);

  while (allocated.size < count && rounds < maxRounds) {
    rounds += 1;
    const needed = count - allocated.size;
    const batchSize = Math.min(CANDIDATE_BATCH, Math.max(needed * 3, needed));
    const candidates = new Set<string>();

    while (candidates.size < batchSize) {
      const code = randomEightDigit();
      if (!allocated.has(code)) candidates.add(code);
    }

    const list = [...candidates];
    const taken = await prisma.registrationStudent.findMany({
      where: { registrationNumber: { in: list } },
      select: { registrationNumber: true },
    });
    const takenSet = new Set(taken.map((row) => row.registrationNumber));

    for (const code of list) {
      if (takenSet.has(code)) continue;
      allocated.add(code);
      if (allocated.size >= count) break;
    }
  }

  if (allocated.size < count) {
    throw new Error("Could not allocate unique student registration numbers");
  }

  return [...allocated].slice(0, count);
}
