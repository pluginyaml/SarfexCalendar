import { type NextRequest } from "next/server";
import { createEvent, deleteEvent, listEvents, updateEvent } from "@/lib/caldav";
import { requireApiSession } from "@/lib/server/auth/session";
import { ensureCategoryExistsByName } from "@/lib/server/db/categories";
import {
  findCalendarSourceForEventHref,
  getCalendarSourceForCreate,
  listActiveCalendarSources,
} from "@/lib/server/db/calendars";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import {
  createEventPayloadSchema,
  deleteEventPayloadSchema,
  eventRangeQuerySchema,
  updateEventPayloadSchema,
} from "@/lib/validation/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    const query = eventRangeQuerySchema.parse({
      start: request.nextUrl.searchParams.get("start"),
      end: request.nextUrl.searchParams.get("end"),
      calendarIds: request.nextUrl.searchParams.get("calendarIds") ?? undefined,
    });
    const calendarIds = query.calendarIds
      ? query.calendarIds
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined;
    const calendarSources = await listActiveCalendarSources(calendarIds);
    return jsonSuccess(await listEvents(query.start, query.end, calendarSources));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = createEventPayloadSchema.parse(await request.json());
    await ensureCategoryExistsByName(payload.category);
    const calendarSource = await getCalendarSourceForCreate(payload.calendarId);

    return jsonSuccess(
      await createEvent(calendarSource, {
        title: payload.title,
        description: payload.description,
        location: payload.location,
        start: payload.start,
        end: payload.end,
        allDay: payload.allDay,
        category: payload.category,
        reminders: payload.reminders,
        recurrence: payload.recurrence,
      }),
      { status: 201 },
    );
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = updateEventPayloadSchema.parse(await request.json());
    await ensureCategoryExistsByName(payload.category);
    const calendarSource = await findCalendarSourceForEventHref(payload.href);

    return jsonSuccess(
      await updateEvent(
        payload.href,
        payload.etag,
        {
          title: payload.title,
          description: payload.description,
          location: payload.location,
          start: payload.start,
          end: payload.end,
          allDay: payload.allDay,
          category: payload.category,
          reminders: payload.reminders,
          recurrence: payload.recurrence,
        },
        calendarSource,
      ),
    );
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = deleteEventPayloadSchema.parse(await request.json());
    const calendarSource = await findCalendarSourceForEventHref(payload.href);
    await deleteEvent(payload.href, payload.etag, calendarSource);
    return jsonSuccess({ href: payload.href });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
