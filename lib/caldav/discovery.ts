import "server-only";
import { XMLParser } from "fast-xml-parser";
import {
  getCalendarHomeHrefFromCollectionHref,
  getCalendarSourceNameFallback,
  normalizeCalendarCollectionHref,
  normalizeCalendarCollectionUrl,
  resolveDavUrl,
} from "@/lib/calendar/source-utils";
import { requireRuntimeEnv, readRuntimeEnv } from "@/lib/server/env/runtime";
import { AppError } from "@/lib/server/errors";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

type XmlResponse = Record<string, unknown>;

export type DiscoveredCalendarSource = {
  href: string;
  url: string;
  normalizedHref: string;
  normalizedUrl: string;
  remoteName: string;
  displayName: string;
  remoteColor: string | null;
};

function asArray<T>(value: T | T[] | undefined | null) {
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

function getCalDavDiscoveryConfig() {
  const env = requireRuntimeEnv(
    "CALDAV_BASE_URL",
    "CALDAV_USERNAME",
    "CALDAV_PASSWORD",
  );

  return {
    ...env,
    CALDAV_CALENDAR_URL: readRuntimeEnv().CALDAV_CALENDAR_URL ?? null,
  };
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

function ensureSuccessfulResponse(
  response: Response,
  context: string,
  allowNotFound = false,
  requestUrl?: string,
) {
  if (response.ok || response.status === 207) {
    return;
  }

  if (allowNotFound && response.status === 404) {
    return;
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError("CalDAV-Login fehlgeschlagen.", {
      code: "CALDAV_AUTH_FAILED",
      statusCode: 502,
    });
  }

    throw new AppError(`${context} fehlgeschlagen.`, {
      code: "CALDAV_DISCOVERY_FAILED",
      statusCode: 502,
      details: {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl ?? null,
      },
    });
}

function parseResponses(xml: string) {
  const parsed = xmlParser.parse(xml);
  return asArray(parsed.multistatus?.response as XmlResponse[] | XmlResponse | undefined);
}

function getSuccessProp(response: XmlResponse) {
  const propstat = asArray(response.propstat as XmlResponse[] | XmlResponse | undefined).find((item) =>
    String((item as { status?: string }).status ?? "").includes("200"),
  );

  return (propstat as { prop?: XmlResponse } | undefined)?.prop ?? null;
}

function getHrefValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "href" in value) {
    const href = (value as { href?: unknown }).href;
    return typeof href === "string" ? href : null;
  }

  return null;
}

function getCalendarColor(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function hasCalendarResourceType(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "calendar" in (value as Record<string, unknown>);
}

async function propfind(url: string, depth: "0" | "1", body: string, context: string, allowNotFound = false) {
  const response = await caldavRequest(url, {
    method: "PROPFIND",
    headers: {
      Depth: depth,
      "Content-Type": "application/xml; charset=utf-8",
    },
    body,
  });

  ensureSuccessfulResponse(response, context, allowNotFound, url);
  return response;
}

function buildPrincipalDiscoveryBody() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal />
  </d:prop>
</d:propfind>`;
}

function buildCalendarHomeBody() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <c:calendar-home-set />
  </d:prop>
</d:propfind>`;
}

function buildCalendarListBody() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
    <cs:calendar-color />
  </d:prop>
</d:propfind>`;
}

async function discoverCurrentUserPrincipal() {
  const { CALDAV_BASE_URL, CALDAV_CALENDAR_URL } = getCalDavDiscoveryConfig();
  const davRootUrl = new URL("/remote.php/dav/", CALDAV_BASE_URL).toString();
  const candidateUrls = [
    davRootUrl,
    CALDAV_CALENDAR_URL,
    CALDAV_CALENDAR_URL
      ? resolveDavUrl(getCalendarHomeHrefFromCollectionHref(new URL(CALDAV_CALENDAR_URL).pathname), CALDAV_BASE_URL)
      : null,
  ].filter((value): value is string => Boolean(value));

  for (const candidateUrl of candidateUrls) {
    const response = await propfind(
      candidateUrl,
      "0",
      buildPrincipalDiscoveryBody(),
      "CalDAV-Prinzipalabfrage",
      true,
    );

    if (response.status === 404) {
      continue;
    }

    const xml = await response.text();
    const principalHref = parseResponses(xml)
      .map(getSuccessProp)
      .map((prop) => getHrefValue(prop?.["current-user-principal"]))
      .find((value): value is string => Boolean(value));

    if (principalHref) {
      return principalHref;
    }
  }

  return null;
}

async function discoverCalendarHomeHref() {
  const { CALDAV_BASE_URL, CALDAV_CALENDAR_URL } = getCalDavDiscoveryConfig();
  const principalHref = await discoverCurrentUserPrincipal();

  if (principalHref) {
    const principalUrl = resolveDavUrl(principalHref, CALDAV_BASE_URL);
    const response = await propfind(
      principalUrl,
      "0",
      buildCalendarHomeBody(),
      "CalDAV-Kalender-Home-Abfrage",
    );
    const xml = await response.text();
    const homeHref = parseResponses(xml)
      .map(getSuccessProp)
      .map((prop) => getHrefValue(prop?.["calendar-home-set"]))
      .find((value): value is string => Boolean(value));

    if (homeHref) {
      return homeHref;
    }
  }

  if (CALDAV_CALENDAR_URL) {
    return getCalendarHomeHrefFromCollectionHref(new URL(CALDAV_CALENDAR_URL).pathname);
  }

  throw new AppError("Kein CalDAV-Kalender-Home gefunden.", {
    code: "CALDAV_HOME_NOT_FOUND",
    statusCode: 502,
  });
}

export async function discoverCalendarSources() {
  const { CALDAV_BASE_URL } = getCalDavDiscoveryConfig();
  const homeHref = await discoverCalendarHomeHref();
  const homeUrl = resolveDavUrl(homeHref, CALDAV_BASE_URL);
  const response = await propfind(
    homeUrl,
    "1",
    buildCalendarListBody(),
    "CalDAV-Kalenderliste",
  );
  const xml = await response.text();
  const seen = new Set<string>();
  const results: DiscoveredCalendarSource[] = [];

  for (const item of parseResponses(xml)) {
    const href = getHrefValue(item.href);
    const prop = getSuccessProp(item);

    if (!href || !prop || !hasCalendarResourceType(prop.resourcetype)) {
      continue;
    }

    const normalizedHref = normalizeCalendarCollectionHref(href);
    const normalizedUrl = normalizeCalendarCollectionUrl(resolveDavUrl(href, CALDAV_BASE_URL));
    const dedupeKey = `${normalizedHref}::${normalizedUrl}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);

    const remoteName =
      (typeof prop.displayname === "string" ? prop.displayname.trim() : "") ||
      getCalendarSourceNameFallback(normalizedHref);

    results.push({
      href: normalizedHref,
      url: normalizedUrl,
      normalizedHref,
      normalizedUrl,
      remoteName,
      displayName: remoteName,
      remoteColor: getCalendarColor(prop["calendar-color"]),
    });
  }

  return results.sort((left, right) => left.remoteName.localeCompare(right.remoteName, "de-DE"));
}
