import ICAL from "ical.js";
import { addDays, differenceInCalendarDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { createOccurrenceInstanceKey } from "@/lib/calendar/source-utils";
import type { EventViewModel } from "@/lib/calendar/types";

function intersectsTimedRange(
  eventStart: string,
  eventEnd: string,
  rangeStart: string,
  rangeEnd: string,
) {
  return new Date(eventStart).getTime() <= new Date(rangeEnd).getTime() &&
    new Date(eventEnd).getTime() >= new Date(rangeStart).getTime();
}

function intersectsAllDayRange(
  eventStart: string,
  eventEnd: string,
  rangeStart: string,
  rangeEnd: string,
  timezone: string,
) {
  const rangeStartDate = formatInTimeZone(rangeStart, timezone, "yyyy-MM-dd");
  const rangeEndDate = formatInTimeZone(rangeEnd, timezone, "yyyy-MM-dd");

  return eventStart <= rangeEndDate && eventEnd >= rangeStartDate;
}

export function expandRecurringEventInRange(
  ics: string,
  baseEvent: EventViewModel,
  options: {
    rangeStart: string;
    rangeEnd: string;
    timezone: string;
  },
) {
  if (!baseEvent.recurrenceRule) {
    return [baseEvent];
  }

  const component = new ICAL.Component(ICAL.parse(ics));
  const vevent = component.getFirstSubcomponent("vevent");

  if (!vevent) {
    return [baseEvent];
  }

  const event = new ICAL.Event(vevent);
  const expansion = new ICAL.RecurExpansion({
    component: vevent,
    dtstart: event.startDate,
  });
  const timedDurationMs = baseEvent.allDay
    ? 0
    : new Date(baseEvent.end).getTime() - new Date(baseEvent.start).getTime();
  const allDayDurationDays = baseEvent.allDay
    ? differenceInCalendarDays(
        new Date(`${baseEvent.end}T00:00:00Z`),
        new Date(`${baseEvent.start}T00:00:00Z`),
      )
    : 0;
  const occurrences: EventViewModel[] = [];

  for (let index = 0; index < 2000 && expansion.next(); index += 1) {
    const occurrence = expansion.last;
    const occurrenceValue = occurrence.toString();

    if (occurrence.isDate) {
      const occurrenceStart = occurrenceValue;

      if (occurrenceStart > formatInTimeZone(options.rangeEnd, options.timezone, "yyyy-MM-dd")) {
        break;
      }

      const occurrenceEnd = formatInTimeZone(
        addDays(new Date(`${occurrenceStart}T00:00:00Z`), allDayDurationDays),
        "UTC",
        "yyyy-MM-dd",
      );

      if (
        !intersectsAllDayRange(
          occurrenceStart,
          occurrenceEnd,
          options.rangeStart,
          options.rangeEnd,
          options.timezone,
        )
      ) {
        continue;
      }

      occurrences.push({
        ...baseEvent,
        start: occurrenceStart,
        end: occurrenceEnd,
        instanceKey: createOccurrenceInstanceKey(baseEvent.href, occurrenceStart),
        isRecurring: true,
        isRecurringInstance: occurrenceStart !== baseEvent.start,
        canDrag: false,
      });

      continue;
    }

    const occurrenceStartIso = fromZonedTime(occurrenceValue, options.timezone).toISOString();

    if (new Date(occurrenceStartIso).getTime() > new Date(options.rangeEnd).getTime()) {
      break;
    }

    const occurrenceEndIso = new Date(
      new Date(occurrenceStartIso).getTime() + timedDurationMs,
    ).toISOString();

    if (
      !intersectsTimedRange(
        occurrenceStartIso,
        occurrenceEndIso,
        options.rangeStart,
        options.rangeEnd,
      )
    ) {
      continue;
    }

    occurrences.push({
      ...baseEvent,
      start: occurrenceStartIso,
      end: occurrenceEndIso,
      instanceKey: createOccurrenceInstanceKey(baseEvent.href, occurrenceStartIso),
      isRecurring: true,
      isRecurringInstance: occurrenceStartIso !== baseEvent.start,
      canDrag: false,
    });
  }

  return occurrences;
}
