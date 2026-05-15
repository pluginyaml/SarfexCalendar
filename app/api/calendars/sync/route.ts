import { type NextRequest } from "next/server";
import { requireApiSession } from "@/lib/server/auth/session";
import { syncCalendarSources } from "@/lib/server/db/calendars";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await syncCalendarSources());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
