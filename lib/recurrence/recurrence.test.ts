import test from "node:test";
import assert from "node:assert/strict";
import { expandRecurringEventInRange } from "@/lib/recurrence/expand";
import { buildRecurrenceRule, parseRecurrenceRule } from "@/lib/recurrence/rule";
import type { EventViewModel } from "@/lib/calendar/types";

test("builds and parses a weekly recurrence with an inclusive until date", () => {
  const rule = buildRecurrenceRule(
    {
      preset: "weekly",
      byWeekdays: ["WE"],
      endMode: "until",
      until: "2026-04-08",
    },
    {
      start: "2026-03-25T17:00:00.000Z",
      timezone: "Europe/Berlin",
      allDay: false,
    },
  );

  assert.equal(rule, "FREQ=WEEKLY;INTERVAL=1;BYDAY=WE;UNTIL=20260408T160000Z");

  const parsed = parseRecurrenceRule(rule, {
    start: "2026-03-25T17:00:00.000Z",
    timezone: "Europe/Berlin",
    allDay: false,
  });

  assert.equal(parsed.preset, "weekly");
  assert.deepEqual(parsed.byWeekdays, ["WE"]);
  assert.equal(parsed.endMode, "until");
  assert.equal(parsed.until, "2026-04-08");
});

test("expands weekly recurring timed events across the DST switch in Europe/Berlin", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:test",
    "DTSTART;TZID=Europe/Berlin:20260325T180000",
    "DTEND;TZID=Europe/Berlin:20260325T190000",
    "RRULE:FREQ=WEEKLY;COUNT=3",
    "SUMMARY:Vorlesung",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const baseEvent: EventViewModel = {
    id: "test",
    uid: "test",
    href: "/remote.php/dav/calendars/user/studium/test.ics",
    etag: '"etag"',
    title: "Vorlesung",
    description: null,
    location: null,
    start: "2026-03-25T17:00:00.000Z",
    end: "2026-03-25T18:00:00.000Z",
    allDay: false,
    category: "Studium",
    color: "#2563EB",
    lastModified: null,
    reminders: [],
    calendarId: "calendar-studium",
    calendarHref: "/remote.php/dav/calendars/user/studium/",
    calendarName: "Studium",
    calendarColor: "#2563EB",
    recurrenceRule: "FREQ=WEEKLY;COUNT=3",
    instanceKey: "/remote.php/dav/calendars/user/studium/test.ics::2026-03-25T17:00:00.000Z",
    isRecurring: true,
    isRecurringInstance: false,
    canDrag: false,
  };

  const occurrences = expandRecurringEventInRange(ics, baseEvent, {
    rangeStart: "2026-03-20T00:00:00.000Z",
    rangeEnd: "2026-04-10T00:00:00.000Z",
    timezone: "Europe/Berlin",
  });

  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.start),
    [
      "2026-03-25T17:00:00.000Z",
      "2026-04-01T16:00:00.000Z",
      "2026-04-08T16:00:00.000Z",
    ],
  );
  assert.equal(
    occurrences[1].instanceKey,
    "/remote.php/dav/calendars/user/studium/test.ics::2026-04-01T16:00:00.000Z",
  );
  assert.equal(occurrences[1].canDrag, false);
});

test("expands all-day recurring events as inclusive dates", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:test-all-day",
    "DTSTART;VALUE=DATE:20260325",
    "DTEND;VALUE=DATE:20260326",
    "RRULE:FREQ=DAILY;COUNT=3",
    "SUMMARY:Studienphase",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const baseEvent: EventViewModel = {
    id: "test-all-day",
    uid: "test-all-day",
    href: "/remote.php/dav/calendars/user/studium/all-day.ics",
    etag: '"etag"',
    title: "Studienphase",
    description: null,
    location: null,
    start: "2026-03-25",
    end: "2026-03-25",
    allDay: true,
    category: "Studium",
    color: "#2563EB",
    lastModified: null,
    reminders: [],
    calendarId: "calendar-studium",
    calendarHref: "/remote.php/dav/calendars/user/studium/",
    calendarName: "Studium",
    calendarColor: "#2563EB",
    recurrenceRule: "FREQ=DAILY;COUNT=3",
    instanceKey: "/remote.php/dav/calendars/user/studium/all-day.ics::2026-03-25",
    isRecurring: true,
    isRecurringInstance: false,
    canDrag: false,
  };

  const occurrences = expandRecurringEventInRange(ics, baseEvent, {
    rangeStart: "2026-03-24T00:00:00.000Z",
    rangeEnd: "2026-03-29T00:00:00.000Z",
    timezone: "Europe/Berlin",
  });

  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.start),
    ["2026-03-25", "2026-03-26", "2026-03-27"],
  );
  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.end),
    ["2026-03-25", "2026-03-26", "2026-03-27"],
  );
});
