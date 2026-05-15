import ICAL from "ical.js";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type {
  EventRecurrenceInput,
  RecurrenceFrequency,
  RecurrencePreset,
  RecurrenceWeekday,
} from "@/lib/recurrence/types";

const WEEKDAY_BY_INDEX: Record<number, RecurrenceWeekday> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDateOnlyRRuleValue(date: string) {
  return date.replace(/-/g, "");
}

function toUtcRRuleValue(date: Date) {
  return formatInTimeZone(date, "UTC", "yyyyMMdd'T'HHmmss'Z'");
}

function getStartWeekday(start: string, timezone: string, allDay: boolean): RecurrenceWeekday {
  const weekdayIndex = allDay
    ? Number(formatInTimeZone(new Date(`${start}T12:00:00Z`), "UTC", "i"))
    : Number(formatInTimeZone(start, timezone, "i"));

  return WEEKDAY_BY_INDEX[weekdayIndex] ?? "MO";
}

function getTimedUntilValue(until: string, start: string, timezone: string) {
  const startTime = formatInTimeZone(start, timezone, "HH:mm:ss");
  const untilDate = fromZonedTime(`${until}T${startTime}`, timezone);
  return toUtcRRuleValue(untilDate);
}

function getPresetDefaults(
  recurrence: EventRecurrenceInput,
  start: string,
  timezone: string,
  allDay: boolean,
) {
  const startWeekday = getStartWeekday(start, timezone, allDay);

  switch (recurrence.preset) {
    case "daily":
      return {
        frequency: "DAILY" as const,
        interval: 1,
        byWeekdays: [] as RecurrenceWeekday[],
      };
    case "weekly":
      return {
        frequency: "WEEKLY" as const,
        interval: 1,
        byWeekdays: recurrence.byWeekdays?.length ? recurrence.byWeekdays : [startWeekday],
      };
    case "biweekly":
      return {
        frequency: "WEEKLY" as const,
        interval: 2,
        byWeekdays: recurrence.byWeekdays?.length ? recurrence.byWeekdays : [startWeekday],
      };
    case "monthly":
      return {
        frequency: "MONTHLY" as const,
        interval: 1,
        byWeekdays: [] as RecurrenceWeekday[],
      };
    case "yearly":
      return {
        frequency: "YEARLY" as const,
        interval: 1,
        byWeekdays: [] as RecurrenceWeekday[],
      };
    case "custom":
      return {
        frequency: recurrence.frequency ?? "WEEKLY",
        interval: recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1,
        byWeekdays:
          recurrence.frequency === "WEEKLY"
            ? recurrence.byWeekdays?.length
              ? recurrence.byWeekdays
              : [startWeekday]
            : [],
      };
    case "none":
    default:
      return null;
  }
}

export function buildRecurrenceRule(
  recurrence: EventRecurrenceInput | null | undefined,
  options: {
    start: string;
    timezone: string;
    allDay: boolean;
  },
) {
  if (!recurrence || recurrence.preset === "none") {
    return null;
  }

  const defaults = getPresetDefaults(recurrence, options.start, options.timezone, options.allDay);

  if (!defaults) {
    return null;
  }

  const segments = [
    `FREQ=${defaults.frequency}`,
    `INTERVAL=${defaults.interval}`,
  ];

  if (defaults.frequency === "WEEKLY" && defaults.byWeekdays.length > 0) {
    segments.push(`BYDAY=${defaults.byWeekdays.join(",")}`);
  }

  const endMode = recurrence.endMode ?? "never";

  if (endMode === "count" && recurrence.count && recurrence.count > 0) {
    segments.push(`COUNT=${recurrence.count}`);
  }

  if (endMode === "until" && recurrence.until && isDateString(recurrence.until)) {
    segments.push(
      options.allDay
        ? `UNTIL=${toDateOnlyRRuleValue(recurrence.until)}`
        : `UNTIL=${getTimedUntilValue(recurrence.until, options.start, options.timezone)}`,
    );
  }

  return segments.join(";");
}

function detectPreset(
  frequency: RecurrenceFrequency,
  interval: number,
): RecurrencePreset {
  if (frequency === "DAILY" && interval === 1) {
    return "daily";
  }

  if (frequency === "WEEKLY" && interval === 1) {
    return "weekly";
  }

  if (frequency === "WEEKLY" && interval === 2) {
    return "biweekly";
  }

  if (frequency === "MONTHLY" && interval === 1) {
    return "monthly";
  }

  if (frequency === "YEARLY" && interval === 1) {
    return "yearly";
  }

  return "custom";
}

export function parseRecurrenceRule(
  recurrenceRule: string | null | undefined,
  options: {
    start: string;
    timezone: string;
    allDay: boolean;
  },
): EventRecurrenceInput {
  if (!recurrenceRule) {
    return {
      preset: "none",
      frequency: "WEEKLY",
      interval: 1,
      byWeekdays: [getStartWeekday(options.start, options.timezone, options.allDay)],
      endMode: "never",
    };
  }

  const recur = ICAL.Recur.fromString(recurrenceRule);
  const frequency = (recur.freq ?? "WEEKLY") as RecurrenceFrequency;
  const interval = recur.interval ?? 1;
  const byWeekdays = (recur.parts.BYDAY as RecurrenceWeekday[] | undefined) ??
    (frequency === "WEEKLY"
      ? [getStartWeekday(options.start, options.timezone, options.allDay)]
      : []);
  const endMode = recur.count
    ? "count"
    : recur.until
      ? "until"
      : "never";

  return {
    preset: detectPreset(frequency, interval),
    frequency,
    interval,
    byWeekdays,
    endMode,
    count: recur.count ?? undefined,
    until:
      recur.until == null
        ? undefined
        : recur.until.isDate
          ? recur.until.toString()
          : formatInTimeZone(recur.until.toJSDate(), options.timezone, "yyyy-MM-dd"),
  };
}
