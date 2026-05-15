import { type NextRequest } from "next/server";
import { getEventByHref } from "@/lib/caldav";
import { requireApiSession } from "@/lib/server/auth/session";
import { findCalendarSourceForEventHref } from "@/lib/server/db/calendars";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { eventDetailQuerySchema } from "@/lib/validation/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    const query = eventDetailQuerySchema.parse({
      href: request.nextUrl.searchParams.get("href"),
    });
    const calendarSource = await findCalendarSourceForEventHref(query.href);

    return jsonSuccess(await getEventByHref(query.href, calendarSource));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
