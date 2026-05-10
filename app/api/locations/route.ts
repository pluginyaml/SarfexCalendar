import { type NextRequest } from "next/server";
import {
  createLocationTemplate,
  listLocationTemplates,
} from "@/lib/server/db/locations";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { locationTemplatePayloadSchema } from "@/lib/validation/locations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await listLocationTemplates());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = locationTemplatePayloadSchema.parse(await request.json());
    return jsonSuccess(await createLocationTemplate(payload), { status: 201 });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
