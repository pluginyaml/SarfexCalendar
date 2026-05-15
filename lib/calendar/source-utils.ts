import { DEFAULT_TIMEZONE } from "@/lib/constants";

function normalizePathname(pathname: string, trailingSlash: boolean) {
  const segments = pathname.split("/").filter(Boolean);
  const normalizedBase = `/${segments.join("/")}`;

  if (normalizedBase === "/") {
    return "/";
  }

  return trailingSlash ? `${normalizedBase}/` : normalizedBase;
}

function extractPathname(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return new URL(value).pathname;
  }

  return value;
}

export function normalizeCalendarCollectionHref(href: string) {
  return normalizePathname(extractPathname(href), true);
}

export function normalizeCalendarItemHref(href: string) {
  return normalizePathname(extractPathname(href), false);
}

export function normalizeCalendarCollectionUrl(url: string) {
  const normalized = new URL(url);
  normalized.search = "";
  normalized.hash = "";
  normalized.pathname = normalizePathname(normalized.pathname, true);
  return normalized.toString();
}

export function resolveDavUrl(value: string, baseUrl: string) {
  const url = /^https?:\/\//i.test(value) ? new URL(value) : new URL(value, baseUrl);
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function getCalendarSourceNameFallback(hrefOrUrl: string) {
  const normalizedPath = normalizeCalendarCollectionHref(hrefOrUrl);
  const segments = normalizedPath.split("/").filter(Boolean);
  return segments.at(-1) ?? "Standardkalender";
}

export function getCalendarHomeHrefFromCollectionHref(href: string) {
  const normalizedCollectionHref = normalizeCalendarCollectionHref(href);
  const segments = normalizedCollectionHref.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return normalizedCollectionHref;
  }

  return `/${segments.slice(0, -1).join("/")}/`;
}

export function matchCalendarSourceHref(calendarHref: string, eventHref: string) {
  return normalizeCalendarItemHref(eventHref).startsWith(normalizeCalendarCollectionHref(calendarHref));
}

export function createOccurrenceInstanceKey(href: string, occurrenceStart: string) {
  return `${normalizeCalendarItemHref(href)}::${occurrenceStart}`;
}

export const DEFAULT_CALENDAR_TIMEZONE = DEFAULT_TIMEZONE;
