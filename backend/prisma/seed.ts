import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const olympiads = [
    {
      code: "IMO" as const,
      name: "IMO",
      fullName: "Innovative Maths Olympiad",
    },
    {
      code: "ISO" as const,
      name: "ISO",
      fullName: "Innovative Science Olympiad",
    },
    {
      code: "IEO" as const,
      name: "IEO",
      fullName: "Innovative English Olympiad",
    },
  ];

  for (const item of olympiads) {
    await prisma.olympiad.upsert({
      where: { code: item.code },
      create: item,
      update: { name: item.name, fullName: item.fullName },
    });
  }

  const year = await prisma.olympiadYear.upsert({
    where: { code: "2025-2026" },
    create: {
      code: "2025-2026",
      label: "2025-26",
      isActive: false,
      published: true,
    },
    update: { published: true, label: "2025-26" },
  });

  await prisma.olympiadYear.upsert({
    where: { code: "2026-2027" },
    create: {
      code: "2026-2027",
      label: "2026-2027",
      isActive: true,
      published: false,
    },
    update: { isActive: true, label: "2026-2027" },
  });

  const passwordHash = await hash("admin123", 10);
  await prisma.admin.upsert({
    where: { email: "admin@icape.in" },
    create: {
      email: "admin@icape.in",
      name: "i-CAPE Admin",
      passwordHash,
    },
    update: { passwordHash, name: "i-CAPE Admin" },
  });

  const school = await prisma.school.upsert({
    where: {
      schoolCode_olympiadYearId: {
        schoolCode: "ICAPE-HYD-001",
        olympiadYearId: year.id,
      },
    },
    create: {
      schoolCode: "ICAPE-HYD-001",
      name: "Vitaran Learning School",
      city: "Hyderabad",
      state: "Telangana",
      olympiadYearId: year.id,
    },
    update: {
      name: "Vitaran Learning School",
      city: "Hyderabad",
      state: "Telangana",
    },
  });

  const students = [
    { registrationNumber: "REG10001", name: "Rahul Kumar", grade: 5 },
    { registrationNumber: "REG10008", name: "Ananya Sharma", grade: 5 },
    { registrationNumber: "REG10015", name: "Arjun Reddy", grade: 6 },
  ];

  const olympiadMap = Object.fromEntries(
    (await prisma.olympiad.findMany()).map((o) => [o.code, o]),
  );

  for (const s of students) {
    const student = await prisma.student.upsert({
      where: {
        registrationNumber_olympiadYearId: {
          registrationNumber: s.registrationNumber,
          olympiadYearId: year.id,
        },
      },
      create: {
        ...s,
        schoolId: school.id,
        olympiadYearId: year.id,
      },
      update: {
        name: s.name,
        grade: s.grade,
        schoolId: school.id,
      },
    });

    const resultSeed =
      s.registrationNumber === "REG10001"
        ? [
            { code: "IEO", marks: 42, total: 50, rank: 125, schoolRank: 8, status: "QUALIFIED" as const },
            { code: "ISO", marks: 45, total: 50, rank: 76, schoolRank: 4, status: "QUALIFIED" as const },
            { code: "IMO", marks: 48, total: 50, rank: 31, schoolRank: 2, status: "QUALIFIED" as const },
          ]
        : s.registrationNumber === "REG10008"
          ? [
              { code: "IMO", marks: 47, total: 50, rank: 40, schoolRank: 1, status: "QUALIFIED" as const },
              { code: "IEO", marks: 40, total: 50, rank: 180, schoolRank: 3, status: "PASSED" as const },
            ]
          : [
              { code: "ISO", marks: 38, total: 50, rank: 210, schoolRank: 5, status: "PARTICIPATED" as const },
            ];

    for (const r of resultSeed) {
      const olympiad = olympiadMap[r.code];
      await prisma.result.upsert({
        where: {
          studentId_olympiadId_olympiadYearId: {
            studentId: student.id,
            olympiadId: olympiad.id,
            olympiadYearId: year.id,
          },
        },
        create: {
          studentId: student.id,
          schoolId: school.id,
          olympiadId: olympiad.id,
          olympiadYearId: year.id,
          grade: s.grade,
          marksObtained: r.marks,
          totalMarks: r.total,
          percentage: Math.round((r.marks / r.total) * 10000) / 100,
          rank: r.rank,
          schoolRank: r.schoolRank,
          status: r.status,
        },
        update: {
          marksObtained: r.marks,
          totalMarks: r.total,
          percentage: Math.round((r.marks / r.total) * 10000) / 100,
          rank: r.rank,
          schoolRank: r.schoolRank,
          status: r.status,
        },
      });
    }
  }

  console.log("Seed complete");
  console.log("Admin: admin@icape.in / admin123");
  console.log("Sample student: REG10001 / Grade 5");
  console.log("Sample school: ICAPE-HYD-001");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
