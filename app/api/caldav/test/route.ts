import { type NextRequest } from "next/server";
import { testConnection } from "@/lib/caldav";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await testConnection());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
