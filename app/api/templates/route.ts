import { type NextRequest } from "next/server";
import { createEventTemplate, listEventTemplates } from "@/lib/server/db/templates";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { eventTemplatePayloadSchema } from "@/lib/validation/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await listEventTemplates());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = eventTemplatePayloadSchema.parse(await request.json());
    return jsonSuccess(await createEventTemplate(payload), { status: 201 });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
