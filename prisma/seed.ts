import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tournament1 = await prisma.tournament.upsert({
    where: { slug: "nagarathars-chess-championship-2026" },
    update: {},
    create: {
      slug: "nagarathars-chess-championship-2026",
      title: "Nagarathar's Chess Championship 2026",
      description:
        "An open chess tournament for local, non-rated players representing their communities. All age groups welcome — think ahead, win ahead.",
      category: "Open",
      format: "classical",
      startDate: new Date("2026-11-14"),
      endDate: new Date("2026-11-15"),
      venue: "Chettinad Vidyashram",
      city: "Chennai",
      entryFee: 0,
      maxParticipants: 120,
      registrationDeadline: new Date("2026-11-07"),
      posterImageUrl: "/images/logo.png",
      status: "published",
    },
  });

  const tournament2 = await prisma.tournament.upsert({
    where: { slug: "tn-state-level-childrens-chess-tournament-2026" },
    update: {},
    create: {
      slug: "tn-state-level-childrens-chess-tournament-2026",
      title: "TN State Level 2nd Children's Chess Tournament 2026",
      description:
        "Organized by Ramanathapuram District Chess Association. Open to children across Tamil Nadu — a great first tournament experience for young, non-rated players.",
      category: "Children (U-15)",
      format: "rapid",
      startDate: new Date("2026-08-30"),
      endDate: new Date("2026-08-30"),
      venue: "Velumanickam Montessori Matriculation School",
      city: "Ramanathapuram",
      entryFee: 0,
      registrationDeadline: new Date("2026-08-25"),
      posterImageUrl: "/images/sample-tournament-poster.jpg",
      status: "published",
    },
  });

  await prisma.registration.upsert({
    where: { tournamentId_email: { tournamentId: tournament1.id, email: "test.player@example.com" } },
    update: {},
    create: {
      tournamentId: tournament1.id,
      fullName: "Test Player (sample entry)",
      email: "test.player@example.com",
      phone: "9999999999",
      city: "Chennai",
    },
  });

  await prisma.registration.upsert({
    where: { tournamentId_email: { tournamentId: tournament2.id, email: "sample.child@example.com" } },
    update: {},
    create: {
      tournamentId: tournament2.id,
      fullName: "Sample Child Entry",
      email: "sample.child@example.com",
      phone: "8888888888",
      city: "Ramanathapuram",
    },
  });

  const classData = [
    {
      slug: "beginner-fundamentals",
      title: "Beginner Fundamentals",
      level: "beginner" as const,
      description: "Piece movement, basic tactics, opening principles, and chess rules for newcomers and kids.",
      scheduleText: "Tue–Fri 5:00 PM – 6:00 PM (online)",
      instructorName: "Coach Arun",
    },
    {
      slug: "intermediate-tactics-strategy",
      title: "Intermediate Tactics & Strategy",
      level: "intermediate" as const,
      description: "Advanced tactics, middle-game strategy, endgame technique, and deeper opening theory.",
      scheduleText: "Sat 9:30 AM – 1:00 PM (online)",
      instructorName: "Coach Priya",
    },
    {
      slug: "advanced-tournament-prep",
      title: "Advanced Tournament Preparation",
      level: "advanced" as const,
      description: "Database-driven preparation, complex endgames, and personalized improvement for competitive players.",
      scheduleText: "Sun 9:30 AM – 1:00 PM (online)",
      instructorName: "Coach Arun",
    },
  ];

  for (const c of classData) {
    await prisma.classProgram.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, isOnline: true },
    });
  }

  const firstClass = await prisma.classProgram.findUniqueOrThrow({ where: { slug: "beginner-fundamentals" } });
  await prisma.classEnrollment.upsert({
    where: { classProgramId_email: { classProgramId: firstClass.id, email: "sample.student@example.com" } },
    update: {},
    create: {
      classProgramId: firstClass.id,
      fullName: "Sample Student Entry",
      email: "sample.student@example.com",
      phone: "7777777777",
      message: "Interested in weekday evening slots.",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
