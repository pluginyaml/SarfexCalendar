import { type NextRequest } from "next/server";
import { requireApiSession } from "@/lib/server/auth/session";
import { listCalendarSources, updateCalendarSources } from "@/lib/server/db/calendars";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { updateCalendarSourcesPayloadSchema } from "@/lib/validation/calendars";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await listCalendarSources());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = updateCalendarSourcesPayloadSchema.parse(await request.json());
    return jsonSuccess(await updateCalendarSources(payload));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
