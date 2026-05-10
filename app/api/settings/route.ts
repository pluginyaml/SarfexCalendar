import { type NextRequest } from "next/server";
import { requireApiSession } from "@/lib/server/auth/session";
import { getUiSettings, updateUiSettings } from "@/lib/server/db/settings";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { uiSettingsPayloadSchema } from "@/lib/validation/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await getUiSettings());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = uiSettingsPayloadSchema.parse(await request.json());
    return jsonSuccess(await updateUiSettings(payload));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
