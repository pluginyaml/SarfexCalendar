import { type NextRequest } from "next/server";
import { testConnection } from "@/lib/caldav";
import { requireApiSession } from "@/lib/server/auth/session";
import { listCalendarSources } from "@/lib/server/db/calendars";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    const calendarSources = await listCalendarSources();
    const defaultCalendar = calendarSources.find((source) => source.isDefault) ?? calendarSources[0];
    return jsonSuccess(await testConnection(defaultCalendar?.url));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
