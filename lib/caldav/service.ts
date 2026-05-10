import { XMLParser } from "fast-xml-parser";
import { randomUUID } from "node:crypto";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { buildEventIcs, extractExistingEventMetadata, parseEventIcs } from "@/lib/caldav/ics";
import type {
  CalDavConnectionResult,
  CalDavEventInput,
  EventViewModel,
} from "@/lib/caldav/types";
import { getCategoryColorMap } from "@/lib/server/db/categories";
import { readRuntimeEnv, requireRuntimeEnv } from "@/lib/server/env/runtime";
import { AppError } from "@/lib/server/errors";

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
    "CALDAV_CALENDAR_URL",
    "CALDAV_USERNAME",
    "CALDAV_PASSWORD",
  );

  return {
    ...env,
    TIMEZONE: readRuntimeEnv().TIMEZONE || DEFAULT_TIMEZONE,
  };
}

function resolveCalendarItemUrl(href: string) {
  const { CALDAV_BASE_URL, CALDAV_CALENDAR_URL } = getCalDavConfig();

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  if (href.startsWith("/")) {
    return new URL(href, CALDAV_BASE_URL).toString();
  }

  const calendarUrl = CALDAV_CALENDAR_URL.endsWith("/")
    ? CALDAV_CALENDAR_URL
    : `${CALDAV_CALENDAR_URL}/`;

  return new URL(href, calendarUrl).toString();
}

function buildCalendarItemHref(uid: string) {
  const { CALDAV_CALENDAR_URL } = getCalDavConfig();
  const calendarUrl = new URL(CALDAV_CALENDAR_URL.endsWith("/") ? CALDAV_CALENDAR_URL : `${CALDAV_CALENDAR_URL}/`);
  return new URL(`${uid}.ics`, calendarUrl).toString();
}

async function caldavRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: buildAuthHeader(),
      ...(init?.headers ?? {}),
    },
  });

  return response;
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
    throw new AppError("Der Termin wurde auf einem anderen Geraet geaendert.", {
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

export async function testConnection(): Promise<CalDavConnectionResult> {
  const { CALDAV_CALENDAR_URL } = getCalDavConfig();

  const response = await caldavRequest(CALDAV_CALENDAR_URL, {
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
    calendarUrl: CALDAV_CALENDAR_URL,
  };
}

export async function listEvents(rangeStart: string, rangeEnd: string): Promise<EventViewModel[]> {
  const { CALDAV_CALENDAR_URL, TIMEZONE } = getCalDavConfig();

  const response = await caldavRequest(CALDAV_CALENDAR_URL, {
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
  const categoryColors = await getCategoryColorMap();

  return calendarResponses
    .map((item) =>
      parseEventIcs(item.calendarData, {
        href: item.href,
        etag: item.etag,
        timezone: TIMEZONE,
        categoryColors,
      }),
    )
    .sort((left, right) => {
      const leftTime = left.allDay
        ? new Date(`${left.start}T00:00:00Z`).getTime()
        : new Date(left.start).getTime();
      const rightTime = right.allDay
        ? new Date(`${right.start}T00:00:00Z`).getTime()
        : new Date(right.start).getTime();

      return leftTime - rightTime;
    });
}

export async function getEventByHref(href: string): Promise<EventViewModel> {
  const { TIMEZONE } = getCalDavConfig();
  const response = await caldavRequest(resolveCalendarItemUrl(href), {
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
    href,
    etag,
    timezone: TIMEZONE,
    categoryColors,
  });
}

export async function createEvent(input: CalDavEventInput): Promise<EventViewModel> {
  const { TIMEZONE } = getCalDavConfig();
  const uid = randomUUID();
  const targetUrl = buildCalendarItemHref(uid);
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

  const href = new URL(targetUrl).pathname;
  return getEventByHref(href);
}

export async function updateEvent(
  href: string,
  etag: string,
  input: CalDavEventInput,
): Promise<EventViewModel> {
  const { TIMEZONE } = getCalDavConfig();
  const existingResponse = await caldavRequest(resolveCalendarItemUrl(href), {
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

  const updateResponse = await caldavRequest(resolveCalendarItemUrl(href), {
    method: "PUT",
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "If-Match": etag,
    },
    body: ics,
  });

  ensureSuccessfulResponse(updateResponse, "Termin aktualisieren");

  return getEventByHref(href);
}

export async function deleteEvent(href: string, etag: string) {
  const response = await caldavRequest(resolveCalendarItemUrl(href), {
    method: "DELETE",
    headers: {
      "If-Match": etag,
    },
  });

  ensureSuccessfulResponse(response, "Termin loeschen");
}
