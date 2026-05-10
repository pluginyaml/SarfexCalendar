import { PrismaClient } from "@prisma/client";
import { DEFAULT_TIMEZONE, DEFAULT_WEEK_STARTS_ON } from "../lib/constants";

const prisma = new PrismaClient();

const categorySeeds = [
  {
    name: "Onlineeinheit",
    color: "#2563EB",
    icon: "Monitor",
    defaultDurationMinutes: 180,
    defaultReminderMinutes: [60],
    sortOrder: 1,
  },
  {
    name: "Vorkurs",
    color: "#7C3AED",
    icon: "BookOpen",
    defaultDurationMinutes: 180,
    defaultReminderMinutes: [60],
    sortOrder: 2,
  },
  {
    name: "Präsenzphase",
    color: "#16A34A",
    icon: "MapPin",
    defaultDurationMinutes: 480,
    defaultReminderMinutes: [1440],
    sortOrder: 3,
  },
  {
    name: "Prüfung",
    color: "#DC2626",
    icon: "AlertTriangle",
    defaultDurationMinutes: 120,
    defaultReminderMinutes: [10080, 1440, 120],
    sortOrder: 4,
  },
  {
    name: "Deadline",
    color: "#EA580C",
    icon: "Clock",
    defaultDurationMinutes: 30,
    defaultReminderMinutes: [2880, 1440],
    sortOrder: 5,
  },
  {
    name: "Arbeit",
    color: "#6B7280",
    icon: "Briefcase",
    defaultDurationMinutes: 480,
    defaultReminderMinutes: [],
    sortOrder: 6,
  },
  {
    name: "Privat",
    color: "#DB2777",
    icon: "User",
    defaultDurationMinutes: 60,
    defaultReminderMinutes: [60],
    sortOrder: 7,
  },
  {
    name: "Sonstiges",
    color: "#64748B",
    icon: "Calendar",
    defaultDurationMinutes: 60,
    defaultReminderMinutes: [60],
    sortOrder: 8,
  },
] as const;

async function main() {
  for (const category of categorySeeds) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  const existingSettings = await prisma.uiSettings.findFirst();

  if (!existingSettings) {
    await prisma.uiSettings.create({
      data: {
        defaultView: "week",
        weekStartsOn: DEFAULT_WEEK_STARTS_ON,
        timezone: DEFAULT_TIMEZONE,
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (adminEmail && adminPasswordHash) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash: adminPasswordHash,
      },
      create: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed fehlgeschlagen", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
