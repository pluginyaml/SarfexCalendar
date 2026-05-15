import test from "node:test";
import assert from "node:assert/strict";
import { parseQuickAddInput } from "@/lib/quick-add/parser";
import type {
  CalendarSourceRecord,
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";

const now = new Date("2026-05-12T10:00:00.000Z");

const categories: CategoryRecord[] = [
  {
    id: "category-mathe",
    name: "Mathe",
    color: "#2563EB",
    icon: "book",
    defaultDurationMinutes: 120,
    defaultReminderMinutes: [60],
    sortOrder: 1,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "category-pruefung",
    name: "Pruefung",
    color: "#DC2626",
    icon: "alert",
    defaultDurationMinutes: 180,
    defaultReminderMinutes: [1440],
    sortOrder: 2,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "category-deadline",
    name: "Deadline",
    color: "#D97706",
    icon: "clock",
    defaultDurationMinutes: 60,
    defaultReminderMinutes: [1440, 120],
    sortOrder: 3,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "category-studium",
    name: "Studium",
    color: "#059669",
    icon: "graduation-cap",
    defaultDurationMinutes: 90,
    defaultReminderMinutes: [120],
    sortOrder: 4,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

const locations: LocationTemplateRecord[] = [
  {
    id: "location-onlinecampus",
    name: "Onlinecampus",
    address: "Onlinecampus",
    link: "https://campus.example",
    notes: null,
    defaultDescription: "Einwahl ueber den Onlinecampus.",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "location-wuerzburg",
    name: "Wuerzburg",
    address: "Wuerzburg",
    link: null,
    notes: null,
    defaultDescription: "Praesenzphase in Wuerzburg.",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

const templates: EventTemplateRecord[] = [
  {
    id: "template-lernblock",
    name: "Lernblock",
    titleTemplate: "Lernblock",
    categoryId: "category-studium",
    categoryName: "Studium",
    locationTemplateId: null,
    locationTemplateName: null,
    defaultDurationMinutes: 120,
    defaultDescription: "Fokussierter Lernblock.",
    defaultReminderMinutes: [60],
    isAllDayDefault: false,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

const calendars: CalendarSourceRecord[] = [
  {
    id: "calendar-studium",
    href: "/remote.php/dav/calendars/user/studium/",
    url: "https://nextcloud.example/remote.php/dav/calendars/user/studium/",
    normalizedHref: "/remote.php/dav/calendars/user/studium/",
    normalizedUrl: "https://nextcloud.example/remote.php/dav/calendars/user/studium/",
    remoteName: "Studium",
    displayName: "Studium",
    remoteColor: "#2563EB",
    color: null,
    isActive: true,
    isDefault: true,
    isMissingRemote: false,
    sortOrder: 1,
    lastDiscoveredAt: null,
    lastSeenAt: null,
    createdAt: "",
    updatedAt: "",
  },
];

function parse(input: string) {
  return parseQuickAddInput(input, {
    now,
    timezone: "Europe/Berlin",
    categories,
    locations,
    templates,
    calendars,
  });
}

test("parses a relative timed study block", () => {
  const result = parse("Mathe morgen 18 Uhr 2h");

  assert.equal(result.draft.title, "Mathe");
  assert.equal(result.draft.category, "Mathe");
  assert.equal(result.draft.startDate, "2026-05-13");
  assert.equal(result.draft.startTime, "18:00");
  assert.equal(result.draft.endTime, "20:00");
  assert.equal(result.draft.allDay, false);
});

test("parses location templates and weekday dates", () => {
  const result = parse("BWL Onlinecampus Montag 19:00 90min");

  assert.equal(result.draft.title, "BWL");
  assert.equal(result.draft.startDate, "2026-05-18");
  assert.equal(result.draft.startTime, "19:00");
  assert.equal(result.draft.endTime, "20:30");
  assert.equal(result.draft.location, "Onlinecampus");
  assert.equal(result.draft.locationTemplateId, "location-onlinecampus");
});

test("parses explicit exam dates and removes the category from the title", () => {
  const result = parse("Pruefung Recht 12.08.2026 09:00 3h");

  assert.equal(result.draft.title, "Recht");
  assert.equal(result.draft.category, "Pruefung");
  assert.equal(result.draft.startDate, "2026-08-12");
  assert.equal(result.draft.startTime, "09:00");
  assert.equal(result.draft.endTime, "12:00");
});

test("parses multi-day all-day phases", () => {
  const result = parse("Wuerzburg Studienphase 12.08 bis 16.08 ganztagig");

  assert.equal(result.draft.title, "Studienphase");
  assert.equal(result.draft.allDay, true);
  assert.equal(result.draft.startDate, "2026-08-12");
  assert.equal(result.draft.endDate, "2026-08-16");
  assert.equal(result.draft.location, "Wuerzburg");
});

test("parses deadlines without an explicit duration", () => {
  const result = parse("Deadline Einsendeaufgabe Freitag 23:59");

  assert.equal(result.draft.title, "Einsendeaufgabe");
  assert.equal(result.draft.category, "Deadline");
  assert.equal(result.draft.startDate, "2026-05-15");
  assert.equal(result.draft.startTime, "23:59");
  assert.equal(result.draft.endTime, "00:59");
  assert.ok(
    result.warnings.some((warning) => warning.includes("Keine Dauer erkannt")),
  );
});

test("parses templates and applies their defaults", () => {
  const result = parse("Lernblock Marketing heute 20 Uhr");

  assert.equal(result.draft.title, "Marketing");
  assert.equal(result.draft.templateId, "template-lernblock");
  assert.equal(result.draft.category, "Studium");
  assert.equal(result.draft.startDate, "2026-05-12");
  assert.equal(result.draft.startTime, "20:00");
  assert.equal(result.draft.endTime, "22:00");
  assert.equal(result.draft.description, "Fokussierter Lernblock.");
});
