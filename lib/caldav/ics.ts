import { addDays, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/server/errors";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { normalizeReminderMinutes } from "@/lib/reminders";
import { encodeEventId } from "@/lib/caldav/event-id";
import type { CalDavEventInput, EventViewModel } from "@/lib/caldav/types";

type ParsedProperty = {
  name: string;
  params: Record<string, string>;
  value: string;
};

type ExistingEventMetadata = {
  uid: string;
  createdAt: string | null;
};

function unfoldIcsLines(ics: string) {
  return ics
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r\n|\n|\r/)
    .filter(Boolean);
}

function parsePropertyLine(line: string): ParsedProperty {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    return {
      name: line.trim().toUpperCase(),
      params: {},
      value: "",
    };
  }

  const identifier = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1);
  const [name, ...paramSegments] = identifier.split(";");
  const params = Object.fromEntries(
    paramSegments.map((segment) => {
      const [key, ...valueParts] = segment.split("=");
      return [key.toUpperCase(), valueParts.join("=")];
    }),
  );

  return {
    name: name.toUpperCase(),
    params,
    value,
  };
}

function unescapeIcsText(value: string) {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string) {
  if (Buffer.byteLength(line, "utf8") <= 75) {
    return line;
  }

  let folded = "";
  let current = "";

  for (const character of line) {
    const next = `${current}${character}`;

    if (Buffer.byteLength(next, "utf8") > 75) {
      folded += `${current}\r\n `;
      current = character;
    } else {
      current = next;
    }
  }

  return `${folded}${current}`;
}

function formatUtcTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatDateValue(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new AppError("Ganztagstermine muessen als Datum uebergeben werden.", {
      code: "INVALID_ALL_DAY_DATE",
      statusCode: 422,
    });
  }

  return dateString.replace(/-/g, "");
}

function formatDateTimeValue(value: string, timezone: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Zeitangaben sind ungueltig.", {
      code: "INVALID_EVENT_TIME",
      statusCode: 422,
    });
  }

  return formatInTimeZone(date, timezone, "yyyyMMdd'T'HHmmss");
}

function formatTriggerDuration(minutes: number) {
  let remaining = minutes;
  const days = Math.floor(remaining / 1440);
  remaining -= days * 1440;
  const hours = Math.floor(remaining / 60);
  remaining -= hours * 60;
  const mins = remaining;

  let result = "P";

  if (days > 0) {
    result += `${days}D`;
  }

  if (hours > 0 || mins > 0 || days === 0) {
    result += "T";

    if (hours > 0) {
      result += `${hours}H`;
    }

    if (mins > 0 || hours === 0) {
      result += `${mins}M`;
    }
  }

  return `-${result}`;
}

function parseDateValue(value: string) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function parseDateTimeValue(value: string, timezone = DEFAULT_TIMEZONE) {
  if (value.endsWith("Z")) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const hours = Number(value.slice(9, 11));
    const minutes = Number(value.slice(11, 13));
    const seconds = Number(value.slice(13, 15));

    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds)).toISOString();
  }

  const localDateTime = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}`;
  return fromZonedTime(localDateTime, timezone).toISOString();
}

function parseDurationToMinutes(value: string) {
  const match = value.match(/^-?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/);

  if (!match) {
    return null;
  }

  const sign = value.startsWith("-") ? -1 : 1;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);

  return sign * (days * 1440 + hours * 60 + minutes);
}

function getEventLinesAndAlarmLines(ics: string) {
  const lines = unfoldIcsLines(ics);
  const eventLines: string[] = [];
  const alarmLines: string[][] = [];
  let insideEvent = false;
  let currentAlarm: string[] | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      insideEvent = true;
      continue;
    }

    if (line === "END:VEVENT") {
      break;
    }

    if (!insideEvent) {
      continue;
    }

    if (line === "BEGIN:VALARM") {
      currentAlarm = [];
      continue;
    }

    if (line === "END:VALARM") {
      if (currentAlarm) {
        alarmLines.push(currentAlarm);
      }
      currentAlarm = null;
      continue;
    }

    if (currentAlarm) {
      currentAlarm.push(line);
      continue;
    }

    eventLines.push(line);
  }

  if (!insideEvent && eventLines.length === 0) {
    throw new AppError("Die ICS-Datei enthaelt kein VEVENT.", {
      code: "INVALID_ICS_EVENT",
      statusCode: 500,
    });
  }

  return { eventLines, alarmLines };
}

function parseAlarmMinutes(alarmLines: string[][]) {
  const reminders = alarmLines
    .map((alarm) => alarm.map(parsePropertyLine))
    .map((properties) => properties.find((property) => property.name === "TRIGGER")?.value ?? null)
    .map((value) => (value ? parseDurationToMinutes(value) : null))
    .filter((value): value is number => typeof value === "number")
    .map((value) => Math.abs(value));

  return normalizeReminderMinutes(reminders);
}

function getProperty(properties: ParsedProperty[], propertyName: string) {
  return properties.find((property) => property.name === propertyName);
}

function getCategoryName(property: ParsedProperty | undefined) {
  if (!property) {
    return "";
  }

  return unescapeIcsText(property.value.split(",")[0] ?? "");
}

function buildDescription(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? escapeIcsText(trimmed) : null;
}

function buildLocation(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? escapeIcsText(trimmed) : null;
}

export function extractExistingEventMetadata(ics: string): ExistingEventMetadata {
  const { eventLines } = getEventLinesAndAlarmLines(ics);
  const properties = eventLines.map(parsePropertyLine);
  const uid = getProperty(properties, "UID")?.value ?? randomUUID();
  const createdAtValue = getProperty(properties, "CREATED")?.value ?? null;

  return {
    uid,
    createdAt: createdAtValue ? parseDateTimeValue(createdAtValue, "UTC") : null,
  };
}

export function buildEventIcs(
  input: CalDavEventInput,
  options?: {
    uid?: string;
    createdAt?: string | null;
    timezone?: string;
  },
) {
  const now = new Date();
  const timezone = options?.timezone ?? DEFAULT_TIMEZONE;
  const uid = options?.uid ?? randomUUID();
  const createdAt = options?.createdAt ? new Date(options.createdAt) : now;
  const description = buildDescription(input.description);
  const location = buildLocation(input.location);
  const reminders = normalizeReminderMinutes(input.reminders);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sarfex Calendar//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SUMMARY:${escapeIcsText(input.title.trim())}`,
    `DTSTAMP:${formatUtcTimestamp(now)}`,
    `CREATED:${formatUtcTimestamp(createdAt)}`,
    `LAST-MODIFIED:${formatUtcTimestamp(now)}`,
    `CATEGORIES:${escapeIcsText(input.category.trim())}`,
  ];

  if (input.allDay) {
    const startDate = formatDateValue(input.start);
    const exclusiveEndDate = formatDateValue(
      formatInTimeZone(addDays(new Date(`${input.end}T00:00:00Z`), 1), "UTC", "yyyy-MM-dd"),
    );
    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    lines.push(`DTEND;VALUE=DATE:${exclusiveEndDate}`);
  } else {
    lines.push(`DTSTART;TZID=${timezone}:${formatDateTimeValue(input.start, timezone)}`);
    lines.push(`DTEND;TZID=${timezone}:${formatDateTimeValue(input.end, timezone)}`);
  }

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  for (const reminder of reminders) {
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:${formatTriggerDuration(reminder)}`);
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeIcsText(input.title.trim())}`);
    lines.push("END:VALARM");
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n").concat("\r\n");
}

export function parseEventIcs(
  ics: string,
  options: {
    href: string;
    etag: string;
    timezone?: string;
    categoryColors?: Record<string, string>;
  },
): EventViewModel {
  const timezone = options.timezone ?? DEFAULT_TIMEZONE;
  const { eventLines, alarmLines } = getEventLinesAndAlarmLines(ics);
  const properties = eventLines.map(parsePropertyLine);

  const uid = getProperty(properties, "UID")?.value ?? randomUUID();
  const summary = getProperty(properties, "SUMMARY")?.value ?? "Unbenannter Termin";
  const description = getProperty(properties, "DESCRIPTION")?.value;
  const location = getProperty(properties, "LOCATION")?.value;
  const categories = getProperty(properties, "CATEGORIES");
  const dtStart = getProperty(properties, "DTSTART");
  const dtEnd = getProperty(properties, "DTEND");
  const duration = getProperty(properties, "DURATION");
  const lastModified = getProperty(properties, "LAST-MODIFIED")?.value ?? null;

  if (!dtStart) {
    throw new AppError("Der Termin enthaelt kein DTSTART.", {
      code: "INVALID_ICS_START",
      statusCode: 500,
    });
  }

  const allDay =
    dtStart.params.VALUE?.toUpperCase() === "DATE" || /^\d{8}$/.test(dtStart.value);

  let start: string;
  let end: string;

  if (allDay) {
    start = parseDateValue(dtStart.value);

    if (dtEnd) {
      end = formatInTimeZone(
        subDays(new Date(`${parseDateValue(dtEnd.value)}T00:00:00Z`), 1),
        "UTC",
        "yyyy-MM-dd",
      );
    } else {
      end = start;
    }
  } else {
    start = parseDateTimeValue(dtStart.value, dtStart.params.TZID ?? timezone);

    if (dtEnd) {
      end = parseDateTimeValue(dtEnd.value, dtEnd.params.TZID ?? timezone);
    } else if (duration) {
      const durationMinutes = parseDurationToMinutes(duration.value);

      if (durationMinutes === null) {
        end = start;
      } else {
        end = new Date(new Date(start).getTime() + durationMinutes * 60_000).toISOString();
      }
    } else {
      end = start;
    }
  }

  const category = getCategoryName(categories);
  const categoryKey = category.toLowerCase();

  return {
    id: encodeEventId(options.href),
    uid,
    href: options.href,
    etag: options.etag,
    title: unescapeIcsText(summary),
    description: description ? unescapeIcsText(description) : null,
    location: location ? unescapeIcsText(location) : null,
    start,
    end,
    allDay,
    category,
    color: options.categoryColors?.[categoryKey],
    lastModified: lastModified ? parseDateTimeValue(lastModified, "UTC") : null,
    reminders: parseAlarmMinutes(alarmLines),
  };
}
