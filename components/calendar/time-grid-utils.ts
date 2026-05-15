import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { EventViewModel } from "@/lib/calendar/types";
import { eventOccursOnDate } from "@/lib/event-time";

export const HOUR_ROW_HEIGHT = 42;
export const TIME_GRID_STEP_MINUTES = 15;

const DEFAULT_VISIBLE_START_HOUR = 0;
const DEFAULT_VISIBLE_END_HOUR = 24;
const MIN_EVENT_HEIGHT = 28;

type TimedEventSegment = {
  event: EventViewModel;
  actualStartMinutes: number;
  actualEndMinutes: number;
  startMinutes: number;
  endMinutes: number;
  lane?: number;
};

export type TimedEventLayout = {
  event: EventViewModel;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
};

type CalendarSlotInput = {
  dateKey: string;
  offsetY: number;
  startHour: number;
  endHour: number;
  durationMinutes: number;
};

function getLocalMinutes(value: string, timezone: string) {
  const hour = Number(formatInTimeZone(value, timezone, "H"));
  const minutes = Number(formatInTimeZone(value, timezone, "m"));

  return hour * 60 + minutes;
}

function getLocalDateKey(value: string, timezone: string) {
  return formatInTimeZone(value, timezone, "yyyy-MM-dd");
}

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function minutesToTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${padTimePart(hours)}:${padTimePart(minutes)}`;
}

export function canDragTimedCalendarEvent(event: EventViewModel, timezone: string) {
  if (!event.canDrag || event.allDay || event.isRecurring || event.isRecurringInstance) {
    return false;
  }

  return getLocalDateKey(event.start, timezone) === getLocalDateKey(event.end, timezone);
}

export function resolveCalendarSlotFromOffset({
  dateKey,
  offsetY,
  startHour,
  endHour,
  durationMinutes,
}: CalendarSlotInput) {
  const gridMinutes = (offsetY / HOUR_ROW_HEIGHT) * 60 + startHour * 60;
  const snappedMinutes =
    Math.round(gridMinutes / TIME_GRID_STEP_MINUTES) * TIME_GRID_STEP_MINUTES;
  const minimumMinutes = startHour * 60;
  const maximumMinutes = Math.max(
    minimumMinutes,
    endHour * 60 - Math.max(durationMinutes, TIME_GRID_STEP_MINUTES),
  );
  const clampedMinutes = Math.min(Math.max(snappedMinutes, minimumMinutes), maximumMinutes);

  return {
    dateKey,
    startMinutes: clampedMinutes,
    startTime: minutesToTimeLabel(clampedMinutes),
  };
}

export function buildTimedEventDropUpdate(
  event: EventViewModel,
  slot: {
    dateKey: string;
    startTime: string;
  },
  timezone: string,
) {
  const eventDurationMs = new Date(event.end).getTime() - new Date(event.start).getTime();
  const nextStartDate = fromZonedTime(`${slot.dateKey}T${slot.startTime}:00`, timezone);
  const nextEndDate = new Date(nextStartDate.getTime() + eventDurationMs);

  return {
    start: nextStartDate.toISOString(),
    end: nextEndDate.toISOString(),
  };
}

function finalizeCluster(cluster: TimedEventSegment[], visibleStartMinutes: number) {
  const laneEndMinutes: number[] = [];

  for (const segment of cluster) {
    const reusableLane = laneEndMinutes.findIndex((laneEnd) => laneEnd <= segment.startMinutes);

    if (reusableLane === -1) {
      segment.lane = laneEndMinutes.length;
      laneEndMinutes.push(segment.endMinutes);
      continue;
    }

    segment.lane = reusableLane;
    laneEndMinutes[reusableLane] = segment.endMinutes;
  }

  const totalLanes = Math.max(1, laneEndMinutes.length);

  return cluster.map((segment) => ({
    event: segment.event,
    top: ((segment.startMinutes - visibleStartMinutes) / 60) * HOUR_ROW_HEIGHT,
    height: Math.max(((segment.endMinutes - segment.startMinutes) / 60) * HOUR_ROW_HEIGHT, MIN_EVENT_HEIGHT),
    leftPct: ((segment.lane ?? 0) / totalLanes) * 100,
    widthPct: 100 / totalLanes,
  }));
}

export function getVisibleHourRange(
  _events: EventViewModel[],
  _dates: Date[],
  _timezone: string,
) {
  void _events;
  void _dates;
  void _timezone;

  return {
    startHour: DEFAULT_VISIBLE_START_HOUR,
    endHour: DEFAULT_VISIBLE_END_HOUR,
  };
}

export function getAllDayEventsForDate(
  events: EventViewModel[],
  dateKey: string,
  timezone: string,
) {
  return events.filter((event) => event.allDay && eventOccursOnDate(event, dateKey, timezone));
}

export function buildTimedEventLayoutsForDate(
  events: EventViewModel[],
  dateKey: string,
  timezone: string,
  startHour: number,
  endHour: number,
) {
  const visibleStartMinutes = startHour * 60;
  const visibleEndMinutes = endHour * 60;
  const segments: TimedEventSegment[] = events
    .filter((event) => !event.allDay && eventOccursOnDate(event, dateKey, timezone))
    .map((event) => {
      const localStartDate = getLocalDateKey(event.start, timezone);
      const localEndDate = getLocalDateKey(event.end, timezone);
      const actualStartMinutes = localStartDate < dateKey ? 0 : getLocalMinutes(event.start, timezone);
      const actualEndMinutes = localEndDate > dateKey ? 24 * 60 : getLocalMinutes(event.end, timezone);

      return {
        event,
        actualStartMinutes,
        actualEndMinutes,
        startMinutes: Math.max(actualStartMinutes, visibleStartMinutes),
        endMinutes: Math.min(Math.max(actualEndMinutes, actualStartMinutes + 15), visibleEndMinutes),
      };
    })
    .filter((segment) => segment.endMinutes > visibleStartMinutes && segment.startMinutes < visibleEndMinutes)
    .sort((left, right) => left.startMinutes - right.startMinutes || left.endMinutes - right.endMinutes);

  const layouts: TimedEventLayout[] = [];
  let cluster: TimedEventSegment[] = [];
  let clusterEndMinutes = -1;

  for (const segment of segments) {
    if (cluster.length === 0 || segment.startMinutes < clusterEndMinutes) {
      cluster.push(segment);
      clusterEndMinutes = Math.max(clusterEndMinutes, segment.endMinutes);
      continue;
    }

    layouts.push(...finalizeCluster(cluster, visibleStartMinutes));
    cluster = [segment];
    clusterEndMinutes = segment.endMinutes;
  }

  if (cluster.length > 0) {
    layouts.push(...finalizeCluster(cluster, visibleStartMinutes));
  }

  return layouts;
}
