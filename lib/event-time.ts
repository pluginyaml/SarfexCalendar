import {
  addDays,
  addMinutes,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { EventViewModel } from "@/lib/calendar/types";
import type { DefaultView } from "@/types/entities";

export function appendLinkToDescription(description: string, link: string) {
  const trimmedDescription = description.trim();
  const trimmedLink = link.trim();

  if (!trimmedLink) {
    return trimmedDescription;
  }

  return [trimmedDescription, `Link: ${trimmedLink}`].filter(Boolean).join("\n\n");
}

export function splitDescriptionAndLink(description: string | null | undefined) {
  const text = description?.trim() ?? "";

  if (!text) {
    return {
      description: "",
      link: "",
    };
  }

  const lines = text.split(/\r?\n/);
  const linkLineIndex = lines.findIndex((line) => /^link:\s+/i.test(line.trim()));

  if (linkLineIndex === -1) {
    return {
      description: text,
      link: "",
    };
  }

  const link = lines[linkLineIndex].replace(/^link:\s+/i, "").trim();
  const remainingLines = lines.filter((_, index) => index !== linkLineIndex).join("\n").trim();

  return {
    description: remainingLines,
    link,
  };
}

export function combineLocalDateTimeToIso(date: string, time: string, timezone: string) {
  return fromZonedTime(`${date}T${time}:00`, timezone).toISOString();
}

export function splitIsoToLocalParts(iso: string, timezone: string) {
  return {
    date: formatInTimeZone(iso, timezone, "yyyy-MM-dd"),
    time: formatInTimeZone(iso, timezone, "HH:mm"),
  };
}

export function applyDurationToLocalDateTime(
  date: string,
  time: string,
  durationMinutes: number,
  timezone: string,
) {
  const startDate = fromZonedTime(`${date}T${time}:00`, timezone);
  const endDate = addMinutes(startDate, durationMinutes);

  return {
    endDate: formatInTimeZone(endDate, timezone, "yyyy-MM-dd"),
    endTime: formatInTimeZone(endDate, timezone, "HH:mm"),
  };
}

function toRangeBoundary(date: Date, time: string, timezone: string) {
  const localDate = format(date, "yyyy-MM-dd");
  return fromZonedTime(`${localDate}T${time}`, timezone).toISOString();
}

export function getCalendarRange(view: DefaultView, currentDate: Date, timezone: string) {
  if (view === "day") {
    return {
      start: toRangeBoundary(currentDate, "00:00:00", timezone),
      end: toRangeBoundary(currentDate, "23:59:59", timezone),
    };
  }

  if (view === "week") {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    return {
      start: toRangeBoundary(weekStart, "00:00:00", timezone),
      end: toRangeBoundary(weekEnd, "23:59:59", timezone),
    };
  }

  if (view === "year") {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);

    return {
      start: toRangeBoundary(yearStart, "00:00:00", timezone),
      end: toRangeBoundary(yearEnd, "23:59:59", timezone),
    };
  }

  const monthStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const monthEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });

  return {
    start: toRangeBoundary(monthStart, "00:00:00", timezone),
    end: toRangeBoundary(monthEnd, "23:59:59", timezone),
  };
}

export function getUpcomingEventsRange(months: number, timezone: string) {
  const now = new Date();
  const future = addMonths(now, months);

  return {
    start: toRangeBoundary(now, "00:00:00", timezone),
    end: toRangeBoundary(future, "23:59:59", timezone),
  };
}

export function getUpcomingDaysRange(days: number, timezone: string) {
  const now = new Date();
  const future = addDays(now, days);

  return {
    start: toRangeBoundary(now, "00:00:00", timezone),
    end: toRangeBoundary(future, "23:59:59", timezone),
  };
}

export function shiftCalendarDate(
  currentDate: Date,
  view: DefaultView,
  direction: "previous" | "next",
) {
  const delta = direction === "next" ? 1 : -1;

  if (view === "day") {
    return addDays(currentDate, delta);
  }

  if (view === "week") {
    return addDays(currentDate, delta * 7);
  }

  if (view === "year") {
    return addYears(currentDate, delta);
  }

  return addMonths(currentDate, delta);
}

export function formatEventDateTime(event: EventViewModel, timezone: string) {
  if (event.allDay) {
    if (event.start === event.end) {
      return `${format(new Date(`${event.start}T00:00:00`), "dd.MM.yyyy")} · Ganztägig`;
    }

    return `${format(new Date(`${event.start}T00:00:00`), "dd.MM.yyyy")} – ${format(new Date(`${event.end}T00:00:00`), "dd.MM.yyyy")} · Ganztägig`;
  }

  const startLabel = formatInTimeZone(event.start, timezone, "dd.MM.yyyy, HH:mm");
  const endLabel = formatInTimeZone(event.end, timezone, "dd.MM.yyyy, HH:mm");

  return `${startLabel} – ${endLabel}`;
}

export function getEventLocalDate(event: EventViewModel, timezone: string) {
  return event.allDay ? event.start : formatInTimeZone(event.start, timezone, "yyyy-MM-dd");
}

export function eventOccursOnDate(event: EventViewModel, date: string, timezone: string) {
  const eventStart = event.allDay ? event.start : formatInTimeZone(event.start, timezone, "yyyy-MM-dd");
  const eventEnd = event.allDay ? event.end : formatInTimeZone(event.end, timezone, "yyyy-MM-dd");

  return date >= eventStart && date <= eventEnd;
}

export function formatEventTimeLabel(event: EventViewModel, timezone: string) {
  if (event.allDay) {
    return "Ganztägig";
  }

  return `${formatInTimeZone(event.start, timezone, "HH:mm")} – ${formatInTimeZone(event.end, timezone, "HH:mm")}`;
}
