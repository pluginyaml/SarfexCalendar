import { requestJson } from "@/lib/http-client";
import type { EventListResponse, EventViewModel } from "@/lib/calendar/types";

function isEventListResponse(value: unknown): value is EventListResponse {
  if (!value || typeof value !== "object" || !("events" in value)) {
    return false;
  }

  const candidate = value as Partial<EventListResponse>;
  return Array.isArray(candidate.events);
}

export async function requestEvents(input: RequestInfo | URL, init?: RequestInit) {
  const payload = await requestJson<EventListResponse | EventViewModel[]>(input, init);

  if (Array.isArray(payload)) {
    return {
      events: payload,
      warnings: [],
    } satisfies EventListResponse;
  }

  if (isEventListResponse(payload)) {
    return {
      events: payload.events,
      warnings: payload.warnings ?? [],
    } satisfies EventListResponse;
  }

  return {
    events: [],
    warnings: [],
  } satisfies EventListResponse;
}
