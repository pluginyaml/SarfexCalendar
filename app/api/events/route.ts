import { type NextRequest } from "next/server";
import { createEvent, deleteEvent, listEvents, updateEvent } from "@/lib/caldav";
import { ensureCategoryExistsByName } from "@/lib/server/db/categories";
import { requireApiSession } from "@/lib/server/auth/session";
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
    });

    return jsonSuccess(await listEvents(query.start, query.end));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = createEventPayloadSchema.parse(await request.json());
    await ensureCategoryExistsByName(payload.category);

    return jsonSuccess(
      await createEvent({
        title: payload.title,
        description: payload.description,
        location: payload.location,
        start: payload.start,
        end: payload.end,
        allDay: payload.allDay,
        category: payload.category,
        reminders: payload.reminders,
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

    return jsonSuccess(
      await updateEvent(payload.href, payload.etag, {
        title: payload.title,
        description: payload.description,
        location: payload.location,
        start: payload.start,
        end: payload.end,
        allDay: payload.allDay,
        category: payload.category,
        reminders: payload.reminders,
      }),
    );
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = deleteEventPayloadSchema.parse(await request.json());
    await deleteEvent(payload.href, payload.etag);
    return jsonSuccess({ href: payload.href });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
