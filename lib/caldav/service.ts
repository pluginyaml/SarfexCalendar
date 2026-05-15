import { XMLParser } from "fast-xml-parser";
import { randomUUID } from "node:crypto";
import {
  buildCalDavTimeRangeCacheKey,
  invalidateCalDavTimeRangeCache,
  readThroughMemoryCache,
} from "@/lib/cache/caldav-read-cache";
import {
  normalizeCalendarCollectionUrl,
  normalizeCalendarItemHref,
  resolveDavUrl,
} from "@/lib/calendar/source-utils";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { buildEventIcs, extractExistingEventMetadata, parseEventIcs } from "@/lib/caldav/ics";
import type { CalDavConnectionResult, CalDavEventInput } from "@/lib/caldav/types";
import type { EventListResponse, EventViewModel, EventWarning } from "@/lib/calendar/types";
import { expandRecurringEventInRange } from "@/lib/recurrence/expand";
import { getCategoryColorMap } from "@/lib/server/db/categories";
import { readRuntimeEnv, requireRuntimeEnv } from "@/lib/server/env/runtime";
import { AppError, isAppError } from "@/lib/server/errors";
import type { CalendarSourceRecord } from "@/types/entities";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

type CalendarResponse = {
  href: string;
  etag: string;
  calendarData: string;
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value == null ? [] : [value];
}

function buildAuthHeader() {
  const { CALDAV_USERNAME, CALDAV_PASSWORD } = requireRuntimeEnv(
    "CALDAV_USERNAME",
    "CALDAV_PASSWORD",
  );

  return `Basic ${Buffer.from(`${CALDAV_USERNAME}:${CALDAV_PASSWORD}`).toString("base64")}`;
}

function getCalDavConfig() {
  const env = requireRuntimeEnv(
    "CALDAV_BASE_URL",
    "CALDAV_USERNAME",
    "CALDAV_PASSWORD",
  );

  return {
    ...env,
    CALDAV_CALENDAR_URL: readRuntimeEnv().CALDAV_CALENDAR_URL ?? null,
    TIMEZONE: readRuntimeEnv().TIMEZONE || DEFAULT_TIMEZONE,
  };
}

function getFallbackCalendarUrl() {
  const { CALDAV_CALENDAR_URL } = getCalDavConfig();

  if (!CALDAV_CALENDAR_URL) {
    throw new AppError("Es ist keine CalDAV-Kalender-URL konfiguriert.", {
      code: "CALDAV_CALENDAR_NOT_CONFIGURED",
      statusCode: 500,
    });
  }

  return normalizeCalendarCollectionUrl(CALDAV_CALENDAR_URL);
}

function resolveCalendarItemUrl(href: string, calendarUrl?: string) {
  const { CALDAV_BASE_URL } = getCalDavConfig();

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  if (href.startsWith("/")) {
    return resolveDavUrl(href, CALDAV_BASE_URL);
  }

  return new URL(href, calendarUrl ?? getFallbackCalendarUrl()).toString();
}

function buildCalendarItemUrl(calendarUrl: string, uid: string) {
  const normalizedCalendarUrl = normalizeCalendarCollectionUrl(calendarUrl);
  return new URL(`${uid}.ics`, normalizedCalendarUrl).toString();
}

async function caldavRequest(url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: buildAuthHeader(),
      ...(init?.headers ?? {}),
    },
  });
}

function ensureSuccessfulResponse(response: Response, context: string) {
  if (response.ok || response.status === 207 || response.status === 201 || response.status === 204) {
    return;
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError("CalDAV-Login fehlgeschlagen.", {
      code: "CALDAV_AUTH_FAILED",
      statusCode: 502,
    });
  }

  if (response.status === 404) {
    throw new AppError("Der konfigurierte Kalender wurde nicht gefunden.", {
      code: "CALDAV_CALENDAR_NOT_FOUND",
      statusCode: 502,
    });
  }

  if (response.status === 412) {
    throw new AppError("Der Termin wurde auf einem anderen Gerät geändert.", {
      code: "CALDAV_ETAG_CONFLICT",
      statusCode: 409,
    });
  }

  throw new AppError(`${context} fehlgeschlagen.`, {
    code: "CALDAV_REQUEST_FAILED",
    statusCode: 502,
    details: {
      status: response.status,
      statusText: response.statusText,
    },
  });
}

function buildCalendarQueryBody(rangeStart: string, rangeEnd: string) {
  const start = new Date(rangeStart).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const end = new Date(rangeEnd).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  return `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${start}" end="${end}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;
}

async function parseCalendarQueryResponse(xml: string) {
  const parsed = xmlParser.parse(xml);
  const responses = asArray(parsed.multistatus?.response);

  return responses
    .map((response) => {
      const propStat = asArray(response.propstat).find((item) =>
        String(item.status ?? "").includes("200"),
      );
      const href = typeof response.href === "string" ? response.href : null;
      const etag = propStat?.prop?.getetag;
      const calendarData = propStat?.prop?.["calendar-data"];

      if (!href || typeof etag !== "string" || typeof calendarData !== "string") {
        return null;
      }

      return {
        href,
        etag,
        calendarData,
      } satisfies CalendarResponse;
    })
    .filter((value): value is CalendarResponse => value !== null);
}

function getCalendarParseOptions(calendarSource: CalendarSourceRecord) {
  return {
    id: calendarSource.id,
    href: calendarSource.normalizedHref,
    name: calendarSource.displayName,
    color: calendarSource.color ?? calendarSource.remoteColor,
  };
}

function sortEvents(events: EventViewModel[]) {
  return [...events].sort((left, right) => {
    const leftTime = left.allDay
      ? new Date(`${left.start}T00:00:00Z`).getTime()
      : new Date(left.start).getTime();
    const rightTime = right.allDay
      ? new Date(`${right.start}T00:00:00Z`).getTime()
      : new Date(right.start).getTime();

    return leftTime - rightTime;
  });
}

function buildCalendarWarning(
  calendarSource: CalendarSourceRecord,
  code: string,
  message: string,
): EventWarning {
  return {
    code,
    message,
    calendarId: calendarSource.id,
    calendarName: calendarSource.displayName,
  };
}

function getCalendarLoadFailureWarning(
  calendarSource: CalendarSourceRecord,
  error: unknown,
): EventWarning {
  const message = error instanceof Error ? error.message : "Kalender konnte nicht geladen werden.";

  return buildCalendarWarning(
    calendarSource,
    isAppError(error) ? error.code : "CALDAV_READ_FAILED",
    `${calendarSource.displayName}: ${message}`,
  );
}

function getCalendarStaleCacheWarning(calendarSource: CalendarSourceRecord): EventWarning {
  return buildCalendarWarning(
    calendarSource,
    "CALDAV_CACHE_STALE",
    `${calendarSource.displayName}: Es werden kurzzeitig zwischengespeicherte Termine angezeigt.`,
  );
}

async function listEventsForCalendar(
  rangeStart: string,
  rangeEnd: string,
  calendarSource: CalendarSourceRecord,
  timezone: string,
  categoryColors: Record<string, string>,
) {
  const response = await caldavRequest(calendarSource.url, {
    method: "REPORT",
    headers: {
      Depth: "1",
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: buildCalendarQueryBody(rangeStart, rangeEnd),
  });

  ensureSuccessfulResponse(response, "CalDAV-Abfrage");

  const xml = await response.text();
  const calendarResponses = await parseCalendarQueryResponse(xml);

  return calendarResponses.flatMap((item) => {
    const event = parseEventIcs(item.calendarData, {
      href: normalizeCalendarItemHref(item.href),
      etag: item.etag,
      timezone,
      categoryColors,
      calendar: getCalendarParseOptions(calendarSource),
    });

    if (!event.recurrenceRule) {
      return [event];
    }

    return expandRecurringEventInRange(item.calendarData, event, {
      rangeStart,
      rangeEnd,
      timezone,
    });
  });
}

export async function testConnection(calendarUrl?: string): Promise<CalDavConnectionResult> {
  const targetCalendarUrl = calendarUrl ?? getFallbackCalendarUrl();
  const response = await caldavRequest(targetCalendarUrl, {
    method: "PROPFIND",
    headers: {
      Depth: "0",
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
  </d:prop>
</d:propfind>`,
  });

  ensureSuccessfulResponse(response, "CalDAV-Verbindungstest");

  return {
    ok: true,
    message: "Die Verbindung zum Nextcloud-Kalender funktioniert.",
    calendarUrl: targetCalendarUrl,
  };
}

export async function listEvents(
  rangeStart: string,
  rangeEnd: string,
  calendarSources: CalendarSourceRecord[],
): Promise<EventListResponse> {
  if (calendarSources.length === 0) {
    return {
      events: [],
      warnings: [],
    };
  }

  const { TIMEZONE } = getCalDavConfig();
  const categoryColors = await getCategoryColorMap();
  const calendarResults = await Promise.all(
    calendarSources.map(async (calendarSource) => {
      const cacheKey = buildCalDavTimeRangeCacheKey({
        calendarHref: calendarSource.normalizedHref,
        start: rangeStart,
        end: rangeEnd,
        timezone: TIMEZONE,
      });

      try {
        const result = await readThroughMemoryCache(
          cacheKey,
          () =>
            listEventsForCalendar(
              rangeStart,
              rangeEnd,
              calendarSource,
              TIMEZONE,
              categoryColors,
            ),
        );

        return {
          events: result.value,
          warnings:
            result.cacheState === "stale" ? [getCalendarStaleCacheWarning(calendarSource)] : [],
        };
      } catch (error) {
        return {
          events: [],
          warnings: [getCalendarLoadFailureWarning(calendarSource, error)],
        };
      }
    }),
  );

  return {
    events: sortEvents(calendarResults.flatMap((result) => result.events)),
    warnings: calendarResults.flatMap((result) => result.warnings),
  };
}

export async function getEventByHref(
  href: string,
  calendarSource?: CalendarSourceRecord | null,
): Promise<EventViewModel> {
  const { TIMEZONE } = getCalDavConfig();
  const resolvedCalendarSource = calendarSource ?? null;
  const response = await caldavRequest(resolveCalendarItemUrl(href, resolvedCalendarSource?.url), {
    method: "GET",
    headers: {
      Accept: "text/calendar",
    },
  });

  ensureSuccessfulResponse(response, "Terminabruf");

  const calendarData = await response.text();
  const etag = response.headers.get("etag");

  if (!etag) {
    throw new AppError("Der Termin konnte ohne ETag nicht geladen werden.", {
      code: "CALDAV_ETAG_MISSING",
      statusCode: 502,
    });
  }

  const categoryColors = await getCategoryColorMap();

  return parseEventIcs(calendarData, {
    href: normalizeCalendarItemHref(href),
    etag,
    timezone: TIMEZONE,
    categoryColors,
    calendar: resolvedCalendarSource ? getCalendarParseOptions(resolvedCalendarSource) : null,
  });
}

export async function createEvent(
  calendarSource: CalendarSourceRecord,
  input: CalDavEventInput,
): Promise<EventViewModel> {
  const { TIMEZONE } = getCalDavConfig();
  const uid = randomUUID();
  const targetUrl = buildCalendarItemUrl(calendarSource.url, uid);
  const ics = buildEventIcs(input, {
    uid,
    timezone: TIMEZONE,
  });

  const response = await caldavRequest(targetUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "If-None-Match": "*",
    },
    body: ics,
  });

  ensureSuccessfulResponse(response, "Termin speichern");
  invalidateCalDavTimeRangeCache(calendarSource.normalizedHref);

  return getEventByHref(normalizeCalendarItemHref(new URL(targetUrl).pathname), calendarSource);
}

export async function updateEvent(
  href: string,
  etag: string,
  input: CalDavEventInput,
  calendarSource?: CalendarSourceRecord | null,
): Promise<EventViewModel> {
  const { TIMEZONE } = getCalDavConfig();
  const resolvedCalendarSource = calendarSource ?? null;
  const targetUrl = resolveCalendarItemUrl(href, resolvedCalendarSource?.url);
  const existingResponse = await caldavRequest(targetUrl, {
    method: "GET",
    headers: {
      Accept: "text/calendar",
    },
  });

  ensureSuccessfulResponse(existingResponse, "Bestehenden Termin laden");

  const existingIcs = await existingResponse.text();
  const metadata = extractExistingEventMetadata(existingIcs);
  const ics = buildEventIcs(input, {
    uid: metadata.uid,
    createdAt: metadata.createdAt,
    timezone: TIMEZONE,
  });

  const updateResponse = await caldavRequest(targetUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "If-Match": etag,
    },
    body: ics,
  });

  ensureSuccessfulResponse(updateResponse, "Termin aktualisieren");
  if (resolvedCalendarSource) {
    invalidateCalDavTimeRangeCache(resolvedCalendarSource.normalizedHref);
  }

  return getEventByHref(normalizeCalendarItemHref(href), resolvedCalendarSource);
}

export async function deleteEvent(
  href: string,
  etag: string,
  calendarSource?: CalendarSourceRecord | null,
) {
  const targetUrl = resolveCalendarItemUrl(href, calendarSource?.url);
  const response = await caldavRequest(targetUrl, {
    method: "DELETE",
    headers: {
      "If-Match": etag,
    },
  });

  ensureSuccessfulResponse(response, "Termin löschen");
  if (calendarSource) {
    invalidateCalDavTimeRangeCache(calendarSource.normalizedHref);
  }
}
